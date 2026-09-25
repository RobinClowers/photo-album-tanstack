import * as stylex from '@stylexjs/stylex'
import { Chip, LinearProgress, Stack, Text } from '@/components/ui'
import type { ImportCounts } from '@/db/imports'

/** Chip color for an import or item status. */
export function statusColor(status: string) {
  return status === 'done'
    ? 'success'
    : status === 'failed'
      ? 'error'
      : status === 'processing' || status === 'picking'
        ? 'info'
        : 'default'
}

/** Color-coded status chip for an import or an item. */
export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={status}
      color={statusColor(status)}
      variant="outlined"
    />
  )
}

const styles = stylex.create({
  progress: { minWidth: '160px' },
})

/** "3 / 12 done, 1 failed" with a progress bar. */
export function ImportProgress({ counts }: { counts: ImportCounts }) {
  const finished = counts.done + counts.failed
  const percent = counts.total ? (finished / counts.total) * 100 : 100
  const summary = [
    `${counts.done} / ${counts.total} done`,
    counts.failed ? `, ${counts.failed} failed` : '',
    counts.processing ? `, ${counts.processing} running` : '',
  ].join('')
  return (
    <Stack gap={0.5} xstyle={styles.progress}>
      <LinearProgress
        value={percent}
        color={counts.failed ? 'error' : 'primary'}
        aria-label={summary}
      />
      <Text variant="caption" color="textSecondary">
        {summary}
      </Text>
    </Stack>
  )
}

export const IMPORT_KIND_LABEL: Record<string, string> = {
  reprocess: 'Reprocess variants',
  google: 'Google Photos import',
}

/** Stored ISO timestamps → 'YYYY-MM-DD HH:MM' in UTC, matching the tables. */
export function formatTimestamp(value: string | null) {
  return value ? `${value.slice(0, 10)} ${value.slice(11, 16)}` : ''
}
