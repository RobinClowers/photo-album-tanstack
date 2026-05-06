import { createFileRoute, notFound } from '@tanstack/react-router'
import { Container, Typography } from '@mui/material'
import PhotoGrid from '@/components/PhotoGrid'
import { getAlbumDetails } from '@/api/albums'

export const Route = createFileRoute('/albums/$slug')({
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

function AlbumPage() {
  const { album } = Route.useLoaderData()

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        component="h1"
        align="center"
        gutterBottom
        sx={{ mb: 4 }}
      >
        {album.title}
      </Typography>

      <PhotoGrid photos={album.photos} />
    </Container>
  )
}
