import { ArrowBack, OpenInNew } from '@mui/icons-material'
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
import { type AdminPhoto, PhotoTile } from '@/components/admin/PhotoTile'
import { useAdminAction } from '@/components/admin/useAdminAction'
import type { AdminAlbumDetails } from '@/db/admin'
import { isValidSlug } from '@/utils/slug'

export const Route = createFileRoute('/admin/albums/$id')({
  loader: async ({ params }) => {
    const id = Number(params.id)
    const album = Number.isInteger(id)
      ? await adminGetAlbum({ data: { id } })
      : null
    if (!album) throw notFound()
    return { album }
  },
  notFoundComponent: () => (
    <Container sx={{ py: 4 }}>
      <Typography>Album not found.</Typography>
    </Container>
  ),
  component: AdminAlbumPage,
})

function AdminAlbumPage() {
  const { album } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()
  const [toDelete, setToDelete] = useState<AdminPhoto | null>(null)
  const published = Boolean(album.publishedAt)

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
          key={`${album.id}-${album.updatedAt}`}
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
                    run(() =>
                      adminUpdatePhotoCaption({
                        data: { photoId: photo.id, caption },
                      }),
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
                />
              ))}
            </Box>
          )}
        </section>
      </Stack>

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete photo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Removes <strong>{toDelete?.filename}</strong> from this album. The
            image files stay in storage for now.
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
  const [title, setTitle] = useState(album.title ?? '')
  const [slug, setSlug] = useState(album.slug ?? '')
  const dirty = title !== (album.title ?? '') || slug !== (album.slug ?? '')
  const slugError = slug && !isValidSlug(slug)

  return (
    <Paper
      component="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(title.trim(), slug)
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
