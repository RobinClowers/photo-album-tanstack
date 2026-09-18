import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { createFileRoute, Link } from '@tanstack/react-router'
import { adminListImports } from '@/api/admin-imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from '@/components/admin/ImportStatus'
import { usePollWhile } from '@/components/admin/usePollWhile'

export const Route = createFileRoute('/admin/imports/')({
  loader: async () => ({ imports: await adminListImports() }),
  component: ImportsPage,
})

function ImportsPage() {
  const { imports } = Route.useLoaderData()
  usePollWhile(imports.some((i) => i.status === 'running'))

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Imports
      </Typography>
      {imports.length === 0 ? (
        <Typography color="text.secondary">
          No imports yet. Start one from an album page with "Reprocess
          variants".
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Started</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Album</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {imports.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Link
                      to="/admin/imports/$id"
                      params={{ id: String(record.id) }}
                      style={{ color: 'inherit' }}
                    >
                      {formatTimestamp(record.createdAt)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {IMPORT_KIND_LABEL[record.kind] ?? record.kind}
                  </TableCell>
                  <TableCell>
                    {record.album ? (
                      <Link
                        to="/admin/albums/$id"
                        params={{ id: String(record.album.id) }}
                        style={{ color: 'inherit' }}
                      >
                        {record.album.title || record.album.slug}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={record.status} />
                  </TableCell>
                  <TableCell>
                    <ImportProgress counts={record.counts} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
