import * as stylex from '@stylexjs/stylex'
import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@/components/ui'
import type { AlbumImportRow } from '@/db/imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from './ImportStatus'

const styles = stylex.create({
  nowrap: { whiteSpace: 'nowrap' },
})

/** The album page's compact list of its latest imports. */
export function AlbumImports({ imports }: { imports: AlbumImportRow[] }) {
  return (
    <TableContainer paper="outlined">
      <Table size="small">
        <TableBody>
          {imports.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell xstyle={styles.nowrap}>
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
  )
}
