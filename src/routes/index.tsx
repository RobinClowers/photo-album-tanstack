import { Link, createFileRoute } from '@tanstack/react-router'
import { Container, Typography, Box, Card, CardMedia } from '@mui/material'

import { getAllAlbums } from '@/api/albums'
import type { Photo, PhotoVersion } from '@/db/schema'

const BASE_PHOTO_PATH = 'https://s3.amazonaws.com/robin-photos/'

export type PhotoWithVersions = Photo & { versions: PhotoVersion[] }

export function buildPhotoPath(
  photo: PhotoWithVersions | null | undefined,
  size: string,
) {
  if (!photo?.versions?.length) return ''
  const version =
    photo.versions.find((v) => v.size === size) || photo.versions[0]
  if (!version) return ''
  return `${BASE_PHOTO_PATH}${photo.path}/${size}/${version.filename}`
}

export const Route = createFileRoute('/')({
  component: IndexPage,
  loader: async () => {
    const albums = await getAllAlbums()

    return {
      albums: albums.map((album) => ({
        id: String(album.id),
        slug: album.slug || '',
        title: album.title || '',
        cover_photo: album.cover_photo,
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
            style={{ textDecoration: 'none' }}
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
                  image={buildPhotoPath(album.cover_photo, 'mobile_sm')}
                  alt={album.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <Typography
                variant="h6"
                component="h2"
                sx={{ my: 1 }}
                align="center"
              >
                {album.title}
              </Typography>
            </Card>
          </Link>
        ))}
      </Box>
    </Container>
  )
}
