import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { AlbumImportRow } from '@/db/imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from './ImportStatus'

/** The album page's compact list of its latest imports. */
export function AlbumImports({ imports }: { imports: AlbumImportRow[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
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
