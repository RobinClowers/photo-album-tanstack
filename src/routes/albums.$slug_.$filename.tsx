import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { Container, Typography, Box, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { getPhotoDetailsFn } from '@/api/albums'
import { buildPhotoPath } from '@/utils/photo'

export const Route = createFileRoute('/albums/$slug_/$filename')({
  component: PhotoPage,
  loader: async ({ params }) => {
    const data = await getPhotoDetailsFn({
      data: { slug: params.slug, filename: params.filename },
    })
    if (!data || !data.photo) {
      throw notFound()
    }
    return data
  },
  head: ({ loaderData }) => {
    if (!loaderData?.photo) return { meta: [] }
    const { photo } = loaderData
    const albumTitle = photo.album?.title || 'Album'
    const originalUrl = buildPhotoPath(photo, 'original')

    // Determine the width and height for og:image from the original version
    const originalVersion =
      photo.versions?.find((v: any) => v.size === 'original') ||
      photo.versions?.[0]

    // Note: process.env is not directly available in Vite/Cloudflare without setup, so using a relative or placeholder URL
    // for og:url might be necessary, but typically you need the absolute URL for OpenGraph.

    return {
      meta: [
        { title: `${albumTitle} photo` },
        { property: 'title', content: `Photo from ${albumTitle}` },
        {
          property: 'description',
          content: photo.caption || `A photo from ${albumTitle}.`,
        },
        { property: 'og:title', content: `Photo from ${albumTitle}` },
        {
          property: 'og:description',
          content: photo.caption || `A photo from ${albumTitle}.`,
        },
        { property: 'og:image', content: originalUrl },
        { property: 'og:image:secure_url', content: originalUrl },
        ...(originalVersion
          ? [
              {
                property: 'og:image:width',
                content: String(originalVersion.width),
              },
              {
                property: 'og:image:height',
                content: String(originalVersion.height),
              },
            ]
          : []),
      ],
    }
  },
})

function PhotoPage() {
  const { photo, previousPhotoFilename, nextPhotoFilename } = Route.useLoaderData()
  const { slug } = Route.useParams()

  // Use a sensible high-res version for the main display, e.g. 'desktop' or 'original'
  // But since we want to be performant, let's look for a large version if available, or fallback to original.
  const displayUrl =
    buildPhotoPath(photo, 'desktop') || buildPhotoPath(photo, 'original')

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Link
            to="/albums/$slug"
            params={{ slug }}
            style={{ display: 'block' }}
          >
            <IconButton sx={{ mr: 2 }} aria-label="Back to album">
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Typography variant="h6" component="h1">
            Back to {photo.album?.title || 'Album'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            height: 'calc(100vh - 150px)', // Rough calculation to keep it within view
            position: 'relative',
          }}
        >
          {previousPhotoFilename ? (
            <Link
              to="/albums/$slug/$filename"
              params={{ slug, filename: previousPhotoFilename }}
              style={{ display: 'flex', zIndex: 1 }}
            >
              <IconButton size="large" aria-label="Previous photo">
                <ArrowBackIosNewIcon fontSize="large" />
              </IconButton>
            </Link>
          ) : (
            <Box sx={{ width: 51 }} /> // Placeholder to keep image centered
          )}

          <Box
            component="img"
            src={displayUrl}
            alt={photo.caption || ''}
            sx={{
              maxWidth: 'calc(100% - 120px)',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />

          {nextPhotoFilename ? (
            <Link
              to="/albums/$slug/$filename"
              params={{ slug, filename: nextPhotoFilename }}
              style={{ display: 'flex', zIndex: 1 }}
            >
              <IconButton size="large" aria-label="Next photo">
                <ArrowForwardIosIcon fontSize="large" />
              </IconButton>
            </Link>
          ) : (
            <Box sx={{ width: 51 }} /> // Placeholder to keep image centered
          )}
        </Box>

        {photo.caption && (
          <Box sx={{ mt: 3, px: 2 }}>
            <Typography variant="body1" align="center">
              {photo.caption}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  )
}
