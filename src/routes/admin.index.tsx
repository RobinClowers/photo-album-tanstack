import * as stylex from '@stylexjs/stylex'
import { createFileRoute } from '@tanstack/react-router'
import { adminListAlbums, adminSetAlbumPublished } from '@/api/admin-albums'
import { AlbumTable } from '@/components/admin/AlbumTable'
import { NewAlbumForm } from '@/components/admin/NewAlbumForm'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { Container, Stack, Text, Toast } from '@/components/ui'
import type { AdminAlbumRow } from '@/db/admin'
import { space } from '@/styles/tokens.stylex'

export const Route = createFileRoute('/admin/')({
  loader: async () => ({ albums: await adminListAlbums() }),
  component: AdminDashboard,
})

const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s4 },
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
    <Container maxWidth="lg" xstyle={styles.page}>
      <Stack gap={4}>
        <NewAlbumForm />

        <section>
          <Text variant="h5" as="h2" gutterBottom>
            Unpublished ({unpublished.length})
          </Text>
          <AlbumTable
            albums={unpublished}
            onTogglePublished={togglePublished}
            pending={pending}
          />
        </section>

        <section>
          <Text variant="h5" as="h2" gutterBottom>
            Published ({published.length})
          </Text>
          <AlbumTable
            albums={published}
            onTogglePublished={togglePublished}
            pending={pending}
          />
        </section>
      </Stack>

      <Toast open={Boolean(error)} severity="error" onClose={clearError}>
        {error}
      </Toast>
    </Container>
  )
}
