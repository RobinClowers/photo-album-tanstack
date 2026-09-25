import * as stylex from '@stylexjs/stylex'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { getAlbumDetails } from '@/api/albums'
import PhotoGrid from '@/components/PhotoGrid'
import { Container, Text } from '@/components/ui'
import { space } from '@/styles/tokens.stylex'
import { publicPageHeaders } from '@/utils/cacheControl'

export const Route = createFileRoute('/albums/$slug')({
  headers: publicPageHeaders,
  component: AlbumPage,
  loader: async ({ params }) => {
    const album = await getAlbumDetails({ data: { slug: params.slug } })
    if (!album) {
      throw notFound()
    }
    return { album }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.album) return { meta: [] }
    const { album } = loaderData
    return {
      meta: [
        { title: `${album.title} photos` },
        { name: 'description', content: `Photos from ${album.title}` },
      ],
    }
  },
})

const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s4 },
  title: { marginBottom: space.s4 },
})

function AlbumPage() {
  const { album } = Route.useLoaderData()

  return (
    <Container maxWidth="xl" xstyle={styles.page}>
      <Text variant="h3" as="h1" align="center" xstyle={styles.title}>
        {album.title}
      </Text>

      <PhotoGrid photos={album.photos} albumSlug={album.slug || ''} />
    </Container>
  )
}
