import * as stylex from '@stylexjs/stylex'
import {
  Avatar,
  Button,
  IconButton,
  Link,
  OpenInNewIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@/components/ui'
import type { AdminAlbumRow } from '@/db/admin'
import { font, space } from '@/styles/tokens.stylex'
import { buildPhotoPath } from '@/utils/photo'

/**
 * Stored timestamps are UTC with no offset ('YYYY-MM-DD HH:MM:SS'), which
 * browsers parse as local time, so round-tripping through `Date` shifts the
 * date by a day west of UTC. The date is already the first ten characters.
 */
function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

// Slugs and the empty state are not grey: on the MUI + Pigment build
// `color="text.secondary"` on Typography never applied.
const styles = stylex.create({
  empty: { padding: space.s2 },
  title: { fontWeight: font.weightMedium },
  actions: { whiteSpace: 'nowrap' },
  publish: { marginLeft: space.s1 },
})

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
    return <Text xstyle={styles.empty}>None.</Text>
  }
  return (
    <TableContainer paper="elevation">
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
            const needsCover = !published && !album.coverPhotoId
            return (
              <TableRow key={album.id} hover>
                <TableCell padding="checkbox">
                  <Avatar
                    variant="rounded"
                    src={buildPhotoPath(album.cover_photo, 'mobile_sm')}
                    alt=""
                  />
                </TableCell>
                <TableCell>
                  <Link
                    to="/admin/albums/$id"
                    params={{ id: String(album.id) }}
                    color="inherit"
                    xstyle={styles.title}
                  >
                    {album.title || '(untitled)'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Text variant="body2">{album.slug}</Text>
                </TableCell>
                <TableCell align="right">{album.photoCount}</TableCell>
                <TableCell>{formatDate(album.firstPhotoTakenAt)}</TableCell>
                <TableCell align="right" xstyle={styles.actions}>
                  {published && album.slug && (
                    <IconButton
                      href={`/albums/${album.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      title="View public page"
                      aria-label="View public page"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Button
                    size="small"
                    variant={published ? 'outlined' : 'contained'}
                    disabled={pending || needsCover}
                    title={
                      needsCover
                        ? 'Choose a cover photo before publishing'
                        : undefined
                    }
                    onClick={() => onTogglePublished(album)}
                    xstyle={styles.publish}
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
