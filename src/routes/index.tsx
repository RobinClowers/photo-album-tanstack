import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material'

interface Album {
  id: string
  slug: string
  title: string
  description?: string
  cover_photo?: {
    url: string
    width: number
    height: number
  }
  photo_count: number
}

export const Route = createFileRoute('/')({
  component: IndexPage,
  loader: async () => {
    // Mock data for now - replace with actual API call
    const albums: Album[] = [
      {
        id: '1',
        slug: 'japan-2024',
        title: 'Japan 2024',
        description: 'Cherry blossoms and temples',
        cover_photo: {
          url: 'https://picsum.photos/400/300?random=1',
          width: 400,
          height: 300,
        },
        photo_count: 156,
      },
      {
        id: '2',
        slug: 'iceland-adventure',
        title: 'Iceland Adventure',
        description: 'Northern lights and glaciers',
        cover_photo: {
          url: 'https://picsum.photos/400/300?random=2',
          width: 400,
          height: 300,
        },
        photo_count: 89,
      },
    ]

    return { albums }
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
                  image={album.cover_photo.url}
                  alt={album.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {album.title}
                </Typography>
                {album.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="p"
                  >
                    {album.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {album.photo_count} photos
                </Typography>
              </CardContent>
            </Card>
          </Link>
        ))}
      </Box>
    </Container>
  )
}
