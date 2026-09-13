import { OpenInNew } from '@mui/icons-material'
import {
  Avatar,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { AdminAlbumRow } from '@/db/admin'
import { buildPhotoPath } from '@/utils/photo'

function formatDate(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10)
}

export function AlbumTable({
  albums,
  onTogglePublished,
  pending,
}: {
  albums: AdminAlbumRow[]
  onTogglePublished: (album: AdminAlbumRow) => void
  pending: boolean
}) {
  if (albums.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        None.
      </Typography>
    )
  }
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>Title</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell align="right">Photos</TableCell>
            <TableCell>First photo</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {albums.map((album) => {
            const published = Boolean(album.publishedAt)
            return (
              <TableRow key={album.id} hover>
                <TableCell padding="checkbox">
                  <Avatar
                    variant="rounded"
                    src={buildPhotoPath(album.cover_photo, 'mobile_sm')}
                    alt=""
                    sx={{ width: 40, height: 40 }}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    to="/admin/albums/$id"
                    params={{ id: String(album.id) }}
                    style={{ color: 'inherit', fontWeight: 500 }}
                  >
                    {album.title || '(untitled)'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {album.slug}
                  </Typography>
                </TableCell>
                <TableCell align="right">{album.photoCount}</TableCell>
                <TableCell>{formatDate(album.firstPhotoTakenAt)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {published && album.slug && (
                    <IconButton
                      component="a"
                      href={`/albums/${album.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      title="View public page"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  )}
                  <Button
                    size="small"
                    variant={published ? 'outlined' : 'contained'}
                    disabled={pending || (!published && !album.coverPhotoId)}
                    title={
                      !published && !album.coverPhotoId
                        ? 'Choose a cover photo before publishing'
                        : undefined
                    }
                    onClick={() => onTogglePublished(album)}
                    sx={{ ml: 1 }}
                  >
                    {published ? 'Unpublish' : 'Publish'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
