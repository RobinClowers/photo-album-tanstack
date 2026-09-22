import { Chip, LinearProgress, Stack, Typography } from '@mui/material'
import type { ImportCounts } from '@/db/imports'

/** Color-coded status chip for an import or an item. */
export function StatusChip({ status }: { status: string }) {
  const color =
    status === 'done'
      ? 'success'
      : status === 'failed'
        ? 'error'
        : status === 'processing' || status === 'picking'
          ? 'info'
          : 'default'
  return <Chip size="small" label={status} color={color} variant="outlined" />
}

/** "3 / 12 done, 1 failed" with a progress bar. */
export function ImportProgress({ counts }: { counts: ImportCounts }) {
  const finished = counts.done + counts.failed
  const percent = counts.total ? (finished / counts.total) * 100 : 100
  return (
    <Stack spacing={0.5} sx={{ minWidth: 160 }}>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={counts.failed ? 'error' : 'primary'}
      />
      <Typography variant="caption" color="text.secondary">
        {counts.done} / {counts.total} done
        {counts.failed ? `, ${counts.failed} failed` : ''}
        {counts.processing ? `, ${counts.processing} running` : ''}
      </Typography>
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
