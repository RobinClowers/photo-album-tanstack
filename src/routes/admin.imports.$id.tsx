import { ArrowBack } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { adminGetImport, adminRetryImport } from '@/api/admin-imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from '@/components/admin/ImportStatus'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { usePollWhile } from '@/components/admin/usePollWhile'
import { parseRecordId } from '@/utils/id'

export const Route = createFileRoute('/admin/imports/$id')({
  loader: async ({ params }) => {
    const id = parseRecordId(params.id)
    const record = id === null ? null : await adminGetImport({ data: { id } })
    if (!record) throw notFound()
    return { record }
  },
  notFoundComponent: () => (
    <Container sx={{ py: 4 }}>
      <Typography>Import not found.</Typography>
    </Container>
  ),
  component: ImportPage,
})

function ImportPage() {
  const { record } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()
  usePollWhile(record.status === 'running')

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/admin/imports"
            startIcon={<ArrowBack />}
            size="small"
          >
            All imports
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {record.counts.failed > 0 && (
            <Button
              variant="contained"
              size="small"
              disabled={pending}
              onClick={() =>
                run(() => adminRetryImport({ data: { id: record.id } }))
              }
            >
              Retry {record.counts.failed} failed
            </Button>
          )}
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            alignItems={{ sm: 'center' }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h1">
                {IMPORT_KIND_LABEL[record.kind] ?? record.kind}
                {record.album && (
                  <>
                    {' · '}
                    <Link
                      to="/admin/albums/$id"
                      params={{ id: String(record.album.id) }}
                      style={{ color: 'inherit' }}
                    >
                      {record.album.title || record.album.slug}
                    </Link>
                  </>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Started {formatTimestamp(record.createdAt)}
                {record.finishedAt &&
                  `, finished ${formatTimestamp(record.finishedAt)}`}
              </Typography>
            </Box>
            <StatusChip status={record.status} />
            <ImportProgress counts={record.counts} />
          </Stack>
          {record.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {record.error}
            </Alert>
          )}
        </Paper>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Attempts</TableCell>
                <TableCell>Last error</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {record.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.filename ?? item.photoId ?? '—'}</TableCell>
                  <TableCell>
                    <StatusChip status={item.status} />
                  </TableCell>
                  <TableCell align="right">{item.attempts}</TableCell>
                  <TableCell
                    sx={{
                      color: 'error.main',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      maxWidth: 480,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.lastError}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatTimestamp(item.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Snackbar open={Boolean(error)} onClose={clearError}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}
