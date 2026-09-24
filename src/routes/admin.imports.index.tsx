import * as stylex from '@stylexjs/stylex'
import { createFileRoute } from '@tanstack/react-router'
import { adminListImports } from '@/api/admin-imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from '@/components/admin/ImportStatus'
import { usePollWhile } from '@/components/admin/usePollWhile'
import {
  Container,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@/components/ui'
import { space } from '@/styles/tokens.stylex'

export const Route = createFileRoute('/admin/imports/')({
  loader: async () => ({ imports: await adminListImports() }),
  component: ImportsPage,
})

// The empty-state text is not grey and the Started column may wrap: on the
// MUI + Pigment build that `color` and cell `sx` never applied.
const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s4 },
})

function ImportsPage() {
  const { imports } = Route.useLoaderData()
  usePollWhile(imports.some((i) => i.status === 'running'))

  return (
    <Container maxWidth="lg" xstyle={styles.page}>
      <Text variant="h5" as="h1" gutterBottom>
        Imports
      </Text>
      {imports.length === 0 ? (
        <Text>
          No imports yet. Start one from an album page with "Reprocess
          variants".
        </Text>
      ) : (
        <TableContainer paper="elevation">
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
                  <TableCell>
                    <Link
                      to="/admin/imports/$id"
                      params={{ id: String(record.id) }}
                      color="inherit"
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
                        color="inherit"
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
