import { Link, createFileRoute } from '@tanstack/react-router'
import { Container, Typography, Box, Card, CardMedia, CardContent } from '@mui/material'

import { getAllAlbums } from '@/api/albums'

export const Route = createFileRoute('/')({
  component: IndexPage,
  loader: async () => {
    const albums = await getAllAlbums()

    return {
      albums: albums.map((album) => ({
        id: String(album.id),
        slug: album.slug || '',
        title: album.title || '',
        cover_photo: album.coverPhoto,
      })),
    }
  },
})

function IndexPage() {
  const { albums } = Route.useLoaderData()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Travel Photos
      </Typography>
      <Typography variant="body1" color="text.secondary" component="p">
        Travel photos from all over the world by Robin Clowers.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {albums.map((album) => (
          <Link
            to="/albums/$slug"
            params={{
              slug: album.slug,
            }}
            key={album.id}
          >
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              {album.cover_photo && (
                <CardMedia
                  component="img"
                  height="200"
                  image={album.cover_photo.path}
                  alt={album.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {album.title}
                </Typography>
              </CardContent>
            </Card>
          </Link>
        ))}
      </Box>
    </Container>
  )
}
