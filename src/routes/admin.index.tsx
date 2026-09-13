import { Alert, Container, Snackbar, Stack, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { adminListAlbums, adminSetAlbumPublished } from '@/api/admin-albums'
import { AlbumTable } from '@/components/admin/AlbumTable'
import { NewAlbumForm } from '@/components/admin/NewAlbumForm'
import { useAdminAction } from '@/components/admin/useAdminAction'
import type { AdminAlbumRow } from '@/db/admin'

export const Route = createFileRoute('/admin/')({
  loader: async () => ({ albums: await adminListAlbums() }),
  component: AdminDashboard,
})

function AdminDashboard() {
  const { albums } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()

  const unpublished = albums.filter((a) => !a.publishedAt)
  const published = albums.filter((a) => a.publishedAt)

  const togglePublished = (album: AdminAlbumRow) =>
    run(() =>
      adminSetAlbumPublished({
        data: { id: album.id, published: !album.publishedAt },
      }),
    )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <NewAlbumForm />

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            Unpublished ({unpublished.length})
          </Typography>
          <AlbumTable
            albums={unpublished}
            onTogglePublished={togglePublished}
            pending={pending}
          />
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            Published ({published.length})
          </Typography>
          <AlbumTable
            albums={published}
            onTogglePublished={togglePublished}
            pending={pending}
          />
        </section>
      </Stack>

      <Snackbar open={Boolean(error)} onClose={clearError}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}
