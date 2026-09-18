import { ArrowBack, ArrowDropDown, OpenInNew } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import {
  adminDeletePhoto,
  adminGetAlbum,
  adminSetAlbumPublished,
  adminSetCoverPhoto,
  adminUpdateAlbum,
  adminUpdatePhotoCaption,
} from '@/api/admin-albums'
import {
  adminListAlbumImports,
  adminReprocessAlbum,
  adminReprocessPhoto,
} from '@/api/admin-imports'
import { AlbumImports } from '@/components/admin/AlbumImports'
import { type AdminPhoto, PhotoTile } from '@/components/admin/PhotoTile'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { usePollWhile } from '@/components/admin/usePollWhile'
import type { AdminAlbumDetails } from '@/db/admin'
import { parseRecordId } from '@/utils/id'
import { isValidSlug } from '@/utils/slug'

export const Route = createFileRoute('/admin/albums/$id')({
  loader: async ({ params }) => {
    // Anything that is not a plain positive integer is a not-found URL, not a
    // server error: '0'/'-1'/'1e300' would fail zod validation on the server
    // and render a raw ZodError, and '0x10'/'1e2'/'1.0' would alias real ids.
    const id = parseRecordId(params.id)
    if (id === null) throw notFound()
    const [album, imports] = await Promise.all([
      adminGetAlbum({ data: { id } }),
      adminListAlbumImports({ data: { albumId: id } }),
    ])
    if (!album) throw notFound()
    return { album, imports }
  },
  notFoundComponent: () => (
    <Container sx={{ py: 4 }}>
      <Typography>Album not found.</Typography>
    </Container>
  ),
  component: AdminAlbumPage,
})

function AdminAlbumPage() {
  const { album, imports } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()
  const [toDelete, setToDelete] = useState<AdminPhoto | null>(null)
  const [reprocessMenu, setReprocessMenu] = useState<HTMLElement | null>(null)
  const published = Boolean(album.publishedAt)
  usePollWhile(imports.some((i) => i.status === 'running'))

  const reprocessAlbum = (force: boolean) => {
    setReprocessMenu(null)
    return run(() =>
      adminReprocessAlbum({ data: { albumId: album.id, force } }),
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/admin"
            startIcon={<ArrowBack />}
            size="small"
          >
            All albums
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            endIcon={<ArrowDropDown />}
            disabled={pending || album.photos.length === 0}
            onClick={(e) => setReprocessMenu(e.currentTarget)}
          >
            Reprocess variants
          </Button>
          <Menu
            anchorEl={reprocessMenu}
            open={Boolean(reprocessMenu)}
            onClose={() => setReprocessMenu(null)}
          >
            <MenuItem onClick={() => reprocessAlbum(false)}>
              Generate missing sizes only
            </MenuItem>
            <MenuItem onClick={() => reprocessAlbum(true)}>
              Regenerate every size
            </MenuItem>
          </Menu>
          {published && album.slug && (
            <Button
              component="a"
              href={`/albums/${album.slug}`}
              target="_blank"
              rel="noreferrer"
              endIcon={<OpenInNew />}
              size="small"
            >
              View public page
            </Button>
          )}
          <Button
            variant={published ? 'outlined' : 'contained'}
            size="small"
            disabled={pending || (!published && !album.coverPhotoId)}
            title={
              !published && !album.coverPhotoId
                ? 'Choose a cover photo before publishing'
                : undefined
            }
            onClick={() =>
              run(() =>
                adminSetAlbumPublished({
                  data: { id: album.id, published: !published },
                }),
              )
            }
          >
            {published ? 'Unpublish' : 'Publish'}
          </Button>
        </Box>

        <AlbumDetailsForm
          key={album.id}
          album={album}
          pending={pending}
          onSave={(title, slug) =>
            run(() => adminUpdateAlbum({ data: { id: album.id, title, slug } }))
          }
        />

        <section>
          <Typography variant="h6" component="h2" gutterBottom>
            Photos ({album.photos.length})
          </Typography>
          {album.photos.length === 0 ? (
            <Typography color="text.secondary">
              No photos yet. Importing from Google Photos arrives in a later PR.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 2,
              }}
            >
              {album.photos.map((photo) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  isCover={album.coverPhotoId === photo.id}
                  disabled={pending}
                  onSaveCaption={(caption) =>
                    run(
                      () =>
                        adminUpdatePhotoCaption({
                          data: { photoId: photo.id, caption },
                        }),
                      // Saved on blur: the tile shows its own saving state so
                      // the click that caused the blur still lands.
                      { trackPending: false },
                    )
                  }
                  onSetCover={() =>
                    run(() =>
                      adminSetCoverPhoto({
                        data: { albumId: album.id, photoId: photo.id },
                      }),
                    )
                  }
                  onDelete={() => setToDelete(photo)}
                  onReprocess={() =>
                    run(() =>
                      adminReprocessPhoto({
                        data: { photoId: photo.id, force: true },
                      }),
                    )
                  }
                />
              ))}
            </Box>
          )}
        </section>

        {imports.length > 0 && (
          <section>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent imports
            </Typography>
            <AlbumImports imports={imports} />
          </section>
        )}
      </Stack>

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete photo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently removes <strong>{toDelete?.filename}</strong> from this
            album, along with its comments, plus ones and every stored copy of
            the image. This cannot be undone.
            {album.coverPhotoId === toDelete?.id &&
              (album.photos.length > 1
                ? ' The earliest remaining photo becomes the cover.'
                : ' This album has no other photos, so it will be unpublished.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending}
            onClick={async () => {
              if (!toDelete) return
              await run(() =>
                adminDeletePhoto({ data: { photoId: toDelete.id } }),
              )
              setToDelete(null)
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(error)} onClose={clearError}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

function AlbumDetailsForm({
  album,
  pending,
  onSave,
}: {
  album: AdminAlbumDetails
  pending: boolean
  onSave: (title: string, slug: string) => void
}) {
  const savedTitle = album.title ?? ''
  const savedSlug = album.slug ?? ''
  const [title, setTitle] = useState(savedTitle)
  const [slug, setSlug] = useState(savedSlug)
  const [synced, setSynced] = useState({ title: savedTitle, slug: savedSlug })

  // Resync only when the saved values actually change. Keying the form on
  // `album.updatedAt` instead would remount it after a set-cover or publish
  // (both bump updated_at) and silently drop unsaved edits.
  if (synced.title !== savedTitle || synced.slug !== savedSlug) {
    setSynced({ title: savedTitle, slug: savedSlug })
    setTitle(savedTitle)
    setSlug(savedSlug)
  }

  const dirty = title.trim() !== savedTitle || slug.trim() !== savedSlug
  const slugError = slug && !isValidSlug(slug)

  return (
    <Paper
      component="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(title.trim(), slug.trim())
      }}
      sx={{ p: 2 }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="small"
          sx={{ flex: '2 1 240px' }}
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          size="small"
          error={Boolean(slugError)}
          helperText={
            slugError
              ? 'Lowercase letters, numbers and dashes'
              : 'Changing the slug changes the public URL and the storage path prefix for new uploads'
          }
          sx={{ flex: '1 1 240px' }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={pending || !dirty || !title.trim() || !isValidSlug(slug)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Save
        </Button>
      </Box>
    </Paper>
  )
}
