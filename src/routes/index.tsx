import { Box, Card, CardMedia, Container, Typography } from '@mui/material'
import { createFileRoute, Link } from '@tanstack/react-router'

import { getAllAlbums } from '@/api/albums'
import { publicPageHeaders } from '@/utils/cacheControl'

export const Route = createFileRoute('/')({
  headers: publicPageHeaders,
  component: IndexPage,
  loader: async () => ({ albums: await getAllAlbums() }),
})

function IndexPage() {
  const { albums } = Route.useLoaderData()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, 240px)',
          justifyContent: 'center',
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
                  height="180"
                  width="240"
                  image={album.cover_photo.src}
                  srcSet={album.cover_photo.srcSet}
                  sizes="240px"
                  alt={album.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <Typography
                variant="h6"
                component="h2"
                sx={{ my: 1, fontWeight: 400 }}
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
