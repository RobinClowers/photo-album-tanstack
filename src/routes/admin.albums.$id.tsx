import * as stylex from '@stylexjs/stylex'
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
import { GoogleImportDialog } from '@/components/admin/GoogleImportDialog'
import { type AdminPhoto, PhotoTile } from '@/components/admin/PhotoTile'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { usePollWhile } from '@/components/admin/usePollWhile'
import {
  ArrowBackIcon,
  ArrowDropDownIcon,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  OpenInNewIcon,
  Paper,
  Stack,
  Text,
  TextField,
  Toast,
} from '@/components/ui'
import type { AdminAlbumDetails } from '@/db/admin'
import { space } from '@/styles/tokens.stylex'
import { parseRecordId } from '@/utils/id'
import { isValidSlug } from '@/utils/slug'

/** `?google=` is set by the OAuth callback after connecting Google Photos. */
const GOOGLE_RESULTS = ['connected', 'denied', 'wrong_account'] as const
type GoogleResult = (typeof GOOGLE_RESULTS)[number]

const GOOGLE_MESSAGES: Record<GoogleResult, string> = {
  connected: 'Google Photos connected.',
  denied: 'Google Photos access was not granted.',
  wrong_account:
    'That Google account is not the one you are signed in with here.',
}

export const Route = createFileRoute('/admin/albums/$id')({
  // Optional so links to the album page never have to pass a search object.
  validateSearch: (
    search: Record<string, unknown>,
  ): { google?: GoogleResult } => {
    const google = search.google
    return GOOGLE_RESULTS.includes(google as GoogleResult)
      ? { google: google as GoogleResult }
      : {}
  },
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
    <Container xstyle={styles.notFound}>
      <Text>Album not found.</Text>
    </Container>
  ),
  component: AdminAlbumPage,
})

/*
 * On the MUI + Pigment build the `sx` on this route's details form (Paper
 * padding, TextField flex sizes, Save alignment) and `color="text.secondary"`
 * on the empty-photos text never applied. This keeps the live look: an
 * unpadded form whose fields take their natural width and a Save button
 * stretched to the row height.
 */
const styles = stylex.create({
  notFound: { paddingTop: space.s4, paddingBottom: space.s4 },
  page: { paddingTop: space.s3, paddingBottom: space.s3 },
  toolbar: { display: 'flex', alignItems: 'center', gap: space.s2 },
  grow: { flexGrow: 1 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: space.s2,
  },
  fields: { display: 'flex', gap: space.s2, flexWrap: 'wrap' },
})

function AdminAlbumPage() {
  const { album, imports } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()
  const [toDelete, setToDelete] = useState<AdminPhoto | null>(null)
  const { google } = Route.useSearch()
  // Connecting Google Photos round-trips through Google and lands back here;
  // reopen the dialog so the admin can carry on where they left off.
  const [googleOpen, setGoogleOpen] = useState(google === 'connected')
  const [googleNotice, setGoogleNotice] = useState<string | null>(
    google ? GOOGLE_MESSAGES[google] : null,
  )
  const published = Boolean(album.publishedAt)
  usePollWhile(imports.some((i) => i.status === 'running'))

  const reprocessAlbum = (force: boolean) =>
    run(() => adminReprocessAlbum({ data: { albumId: album.id, force } }))

  return (
    <Container maxWidth="xl" xstyle={styles.page}>
      <Stack gap={3}>
        <div {...stylex.props(styles.toolbar)}>
          <Button
            render={<Link to="/admin" />}
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            All albums
          </Button>
          <div {...stylex.props(styles.grow)} />
          <Button
            size="small"
            variant="outlined"
            disabled={pending}
            onClick={() => setGoogleOpen(true)}
          >
            Import from Google Photos
          </Button>
          <Menu
            trigger={
              <Button
                size="small"
                endIcon={<ArrowDropDownIcon />}
                disabled={pending || album.photos.length === 0}
              >
                Reprocess variants
              </Button>
            }
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
              href={`/albums/${album.slug}`}
              target="_blank"
              rel="noreferrer"
              endIcon={<OpenInNewIcon />}
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
        </div>

        <AlbumDetailsForm
          key={album.id}
          album={album}
          pending={pending}
          onSave={(title, slug) =>
            run(() => adminUpdateAlbum({ data: { id: album.id, title, slug } }))
          }
        />

        <section>
          <Text variant="h6" as="h2" gutterBottom>
            Photos ({album.photos.length})
          </Text>
          {album.photos.length === 0 ? (
            <Text>
              No photos yet. Use "Import from Google Photos" to add some.
            </Text>
          ) : (
            <div {...stylex.props(styles.grid)}>
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
            </div>
          )}
        </section>

        {imports.length > 0 && (
          <section>
            <Text variant="h6" as="h2" gutterBottom>
              Recent imports
            </Text>
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

      <GoogleImportDialog
        albumId={album.id}
        open={googleOpen}
        onClose={() => setGoogleOpen(false)}
      />

      <Toast
        open={Boolean(googleNotice)}
        severity={google === 'connected' ? 'success' : 'warning'}
        timeout={6000}
        onClose={() => setGoogleNotice(null)}
      >
        {googleNotice}
      </Toast>

      <Toast open={Boolean(error)} severity="error" onClose={clearError}>
        {error}
      </Toast>
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
      render={
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(title.trim(), slug.trim())
          }}
        />
      }
    >
      <div {...stylex.props(styles.fields)}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="small"
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
        />
        <Button
          type="submit"
          variant="contained"
          disabled={pending || !dirty || !title.trim() || !isValidSlug(slug)}
        >
          Save
        </Button>
      </div>
    </Paper>
  )
}
