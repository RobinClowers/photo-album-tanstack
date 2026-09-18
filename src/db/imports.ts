import { and, count, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { chunk } from '@/utils/chunk'
import type { DB } from './index'
import {
  type Import,
  type ImportItem,
  importItems,
  imports,
  type NewImportItem,
} from './schema'

/**
 * D1 rejects a statement with more than 100 bound parameters, so `IN (...)`
 * lists are split; the margin leaves room for the other values a statement
 * binds.
 */
const D1_IN_LIST_CHUNK = 50

export type ImportKind = 'reprocess' | 'google'
export type ImportStatus = 'running' | 'done' | 'failed'
export type ImportItemStatus = 'queued' | 'processing' | 'done' | 'failed'

const now = () => new Date().toISOString()

export interface ImportCounts {
  total: number
  queued: number
  processing: number
  done: number
  failed: number
}

const ITEM_STATUSES: readonly ImportItemStatus[] = [
  'queued',
  'processing',
  'done',
  'failed',
]

function isItemStatus(value: string): value is ImportItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value)
}

function rowsToCounts(rows: { status: string; n: number }[]): ImportCounts {
  const counts: ImportCounts = {
    total: 0,
    queued: 0,
    processing: 0,
    done: 0,
    failed: 0,
  }
  for (const row of rows) {
    counts.total += row.n
    if (isItemStatus(row.status)) counts[row.status] += row.n
  }
  return counts
}

export async function getImport(
  db: DB,
  id: number,
): Promise<Import | undefined> {
  const [record] = await db.select().from(imports).where(eq(imports.id, id))
  return record
}

/** What a caller supplies per item; status, attempts and timestamps are set here. */
export type ImportItemInput = Pick<
  NewImportItem,
  'photoId' | 'filename' | 'googleMediaId' | 'payload'
>

/**
 * Create an import with its items. Items are written without a queue message
 * yet; the caller enqueues the returned ids, so a failed send leaves rows the
 * sweeper can pick up rather than nothing at all.
 */
export async function createImport(
  db: DB,
  data: {
    albumId: number | null
    kind: ImportKind
    createdByUserId: number | null
    googleSessionId?: string | null
    googleSessionExpiresAt?: string | null
  },
  items: ImportItemInput[],
): Promise<{ import: Import; itemIds: number[] }> {
  const timestamp = now()
  const [record] = await db
    .insert(imports)
    .values({
      albumId: data.albumId,
      kind: data.kind,
      status: 'running',
      createdByUserId: data.createdByUserId,
      googleSessionId: data.googleSessionId ?? null,
      googleSessionExpiresAt: data.googleSessionExpiresAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
  if (!record) throw new Error('Failed to create import')

  if (items.length === 0) {
    await finishImport(db, record.id)
    return { import: (await getImport(db, record.id)) ?? record, itemIds: [] }
  }

  // One statement for every item, however many: D1 allows 100 bound
  // parameters per statement (a multi-row VALUES insert binds eight per row)
  // and the free plan 50 statements per invocation, so an album-sized batch
  // cannot be inserted row by row or in slices. The rows travel as one JSON
  // parameter instead and SQLite's json_each unpacks them; status and
  // attempts take their column defaults.
  const json = JSON.stringify(
    items.map((item) => ({
      photoId: item.photoId ?? null,
      filename: item.filename ?? null,
      googleMediaId: item.googleMediaId ?? null,
      payload: item.payload,
    })),
  )
  const rows = await db.all<{ id: number }>(sql`
    insert into import_items
      (import_id, photo_id, filename, google_media_id, payload, created_at, updated_at)
    select
      ${record.id},
      json_extract(value, '$.photoId'),
      json_extract(value, '$.filename'),
      json_extract(value, '$.googleMediaId'),
      json_extract(value, '$.payload'),
      ${timestamp},
      ${timestamp}
    from json_each(${json})
    returning id
  `)
  return { import: record, itemIds: rows.map((r) => r.id) }
}

/** The import an item belongs to, or undefined if the item is gone. */
export async function getImportItemImportId(
  db: DB,
  id: number,
): Promise<number | undefined> {
  const [row] = await db
    .select({ importId: importItems.importId })
    .from(importItems)
    .where(eq(importItems.id, id))
  return row?.importId
}

/**
 * Claim an item for processing: bumps attempts and records the start.
 * Returns undefined if the item is gone or already finished (a duplicate
 * delivery), in which case the consumer just acks.
 */
export async function claimImportItem(
  db: DB,
  id: number,
): Promise<ImportItem | undefined> {
  const timestamp = now()
  const [item] = await db
    .update(importItems)
    .set({
      status: 'processing',
      attempts: sql`${importItems.attempts} + 1`,
      startedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(
      and(
        eq(importItems.id, id),
        inArray(importItems.status, ['queued', 'processing']),
      ),
    )
    .returning()
  return item
}

export async function markImportItemDone(db: DB, id: number): Promise<void> {
  const timestamp = now()
  await db
    .update(importItems)
    .set({
      status: 'done',
      lastError: null,
      finishedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(importItems.id, id))
}

/**
 * Record a failure. The item goes back to 'queued' while attempts remain
 * (the queue redelivers it) and to 'failed' once they run out.
 */
export async function markImportItemFailed(
  db: DB,
  id: number,
  error: string,
  options: { final: boolean },
): Promise<void> {
  const timestamp = now()
  await db
    .update(importItems)
    .set({
      status: options.final ? 'failed' : 'queued',
      lastError: error.slice(0, 2000),
      ...(options.final ? { finishedAt: timestamp } : {}),
      updatedAt: timestamp,
    })
    .where(eq(importItems.id, id))
}

export async function countImportItems(
  db: DB,
  importId: number,
): Promise<ImportCounts> {
  const rows = await db
    .select({ status: importItems.status, n: count() })
    .from(importItems)
    .where(eq(importItems.importId, importId))
    .groupBy(importItems.status)
  return rowsToCounts(rows)
}

/**
 * Close an import whose items are all finished. Returns true when this call
 * moved it out of 'running' (so completion work runs exactly once), false
 * when items remain or it was already closed.
 */
export async function finishImport(db: DB, importId: number): Promise<boolean> {
  const counts = await countImportItems(db, importId)
  if (counts.queued > 0 || counts.processing > 0) return false
  const timestamp = now()
  const [updated] = await db
    .update(imports)
    .set({
      status: counts.failed > 0 ? 'failed' : 'done',
      finishedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(and(eq(imports.id, importId), eq(imports.status, 'running')))
    .returning({ id: imports.id })
  return Boolean(updated)
}

/**
 * Reopen an import and put its failed items back in the queue. Returns the
 * item ids to enqueue.
 */
export async function resetFailedImportItems(
  db: DB,
  importId: number,
): Promise<number[]> {
  const timestamp = now()
  const rows = await db
    .update(importItems)
    .set({
      status: 'queued',
      attempts: 0,
      lastError: null,
      startedAt: null,
      finishedAt: null,
      updatedAt: timestamp,
    })
    .where(
      and(eq(importItems.importId, importId), eq(importItems.status, 'failed')),
    )
    .returning({ id: importItems.id })
  if (rows.length > 0) {
    await db
      .update(imports)
      .set({ status: 'running', finishedAt: null, updatedAt: timestamp })
      .where(eq(imports.id, importId))
  }
  return rows.map((r) => r.id)
}

/**
 * Items that have sat in 'queued' or 'processing' for longer than `staleMs`:
 * their queue message was lost, expired (24 h retention) or the consumer
 * died mid-item. The sweeper re-enqueues them.
 */
export async function findStaleImportItems(
  db: DB,
  staleMs: number,
  limit = 100,
): Promise<number[]> {
  const cutoff = new Date(Date.now() - staleMs).toISOString()
  const rows = await db
    .select({ id: importItems.id })
    .from(importItems)
    .where(
      and(
        inArray(importItems.status, ['queued', 'processing']),
        lt(importItems.updatedAt, cutoff),
      ),
    )
    .limit(limit)
  return rows.map((r) => r.id)
}

/** Bump updated_at so the stale-item sweep does not pick these up again. */
export async function touchImportItems(db: DB, ids: number[]): Promise<void> {
  const timestamp = now()
  for (const slice of chunk(ids, D1_IN_LIST_CHUNK)) {
    await db
      .update(importItems)
      .set({ updatedAt: timestamp })
      .where(inArray(importItems.id, slice))
  }
}

export async function listRunningImportIds(db: DB): Promise<number[]> {
  const rows = await db
    .select({ id: imports.id })
    .from(imports)
    .where(eq(imports.status, 'running'))
  return rows.map((r) => r.id)
}

async function countsByImport(db: DB, importIds: number[]) {
  const byImport = new Map<number, ImportCounts>()
  if (importIds.length === 0) return byImport
  const rows = await db
    .select({
      importId: importItems.importId,
      status: importItems.status,
      n: count(),
    })
    .from(importItems)
    .where(inArray(importItems.importId, importIds))
    .groupBy(importItems.importId, importItems.status)
  for (const id of importIds) {
    byImport.set(id, rowsToCounts(rows.filter((r) => r.importId === id)))
  }
  return byImport
}

/** Recent imports with their counts, newest first. */
export async function listImportsForAdmin(db: DB, limit = 50) {
  const rows = await db.query.imports.findMany({
    with: { album: { columns: { id: true, title: true, slug: true } } },
    orderBy: [desc(imports.createdAt), desc(imports.id)],
    limit,
  })
  const counts = await countsByImport(
    db,
    rows.map((r) => r.id),
  )
  return rows.map((row) => ({
    ...row,
    counts: counts.get(row.id) ?? rowsToCounts([]),
  }))
}

export type AdminImportRow = Awaited<
  ReturnType<typeof listImportsForAdmin>
>[number]

/** One import with every item, failed and in-flight ones first. */
export async function getImportForAdmin(db: DB, id: number) {
  const record = await db.query.imports.findFirst({
    where: eq(imports.id, id),
    with: {
      album: { columns: { id: true, title: true, slug: true } },
      items: {
        orderBy: (item) => [
          sql`case ${item.status} when 'failed' then 0 when 'processing' then 1 when 'queued' then 2 else 3 end`,
          item.id,
        ],
      },
    },
  })
  if (!record) return undefined
  const tally = new Map<string, number>()
  for (const item of record.items) {
    tally.set(item.status, (tally.get(item.status) ?? 0) + 1)
  }
  return {
    ...record,
    counts: rowsToCounts([...tally].map(([status, n]) => ({ status, n }))),
  }
}

export type AdminImportDetails = NonNullable<
  Awaited<ReturnType<typeof getImportForAdmin>>
>

/** Imports touching one album, newest first (for the album admin page). */
export async function listImportsForAlbum(db: DB, albumId: number, limit = 5) {
  const rows = await db
    .select()
    .from(imports)
    .where(eq(imports.albumId, albumId))
    .orderBy(desc(imports.createdAt), desc(imports.id))
    .limit(limit)
  const counts = await countsByImport(
    db,
    rows.map((r) => r.id),
  )
  return rows.map((row) => ({
    ...row,
    counts: counts.get(row.id) ?? rowsToCounts([]),
  }))
}

export type AlbumImportRow = Awaited<
  ReturnType<typeof listImportsForAlbum>
>[number]
