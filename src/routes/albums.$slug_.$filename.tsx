import * as stylex from '@stylexjs/stylex'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { getPhotoDetailsFn } from '@/api/albums'
import {
  ArrowBackIcon,
  ArrowBackIosNewIcon,
  ArrowForwardIosIcon,
  Container,
  IconButton,
  Text,
} from '@/components/ui'
import { radii, space } from '@/styles/tokens.stylex'
import { publicPageHeaders } from '@/utils/cacheControl'

export const Route = createFileRoute('/albums/$slug_/$filename')({
  headers: publicPageHeaders,
  component: PhotoPage,
  loader: async ({ params }) => {
    const data = await getPhotoDetailsFn({
      data: { slug: params.slug, filename: params.filename },
    })
    if (!data?.photo) {
      throw notFound()
    }
    return data
  },
  head: ({ loaderData }) => {
    if (!loaderData?.photo) return { meta: [] }
    const { photo } = loaderData
    const albumTitle = photo.albumTitle || 'Album'
    const { original } = photo

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
        { property: 'og:image', content: original.src },
        { property: 'og:image:secure_url', content: original.src },
        ...(original.width && original.height
          ? [
              { property: 'og:image:width', content: String(original.width) },
              { property: 'og:image:height', content: String(original.height) },
            ]
          : []),
      ],
    }
  },
})

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  container: { paddingTop: space.s2, paddingBottom: space.s2 },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: space.s2,
  },
  stage: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // Rough calculation to keep the photo within the viewport.
    height: 'calc(100vh - 150px)',
    position: 'relative',
  },
  nav: { zIndex: 1 },
  navPlaceholder: { width: '51px' },
  photo: {
    maxWidth: 'calc(100% - 120px)',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: radii.sm,
  },
  caption: {
    marginTop: space.s3,
    paddingLeft: space.s2,
    paddingRight: space.s2,
  },
})

function PhotoPage() {
  const { photo, previousPhotoFilename, nextPhotoFilename } =
    Route.useLoaderData()
  const { slug } = Route.useParams()

  return (
    <div {...stylex.props(styles.page)}>
      <Container maxWidth="xl" xstyle={styles.container}>
        <div {...stylex.props(styles.header)}>
          <IconButton
            render={<Link to="/albums/$slug" params={{ slug }} />}
            aria-label="Back to album"
          >
            <ArrowBackIcon />
          </IconButton>
          <Text variant="h6" as="h1">
            Back to {photo.albumTitle || 'Album'}
          </Text>
        </div>

        <div {...stylex.props(styles.stage)}>
          {previousPhotoFilename ? (
            <IconButton
              render={
                <Link
                  to="/albums/$slug/$filename"
                  params={{ slug, filename: previousPhotoFilename }}
                />
              }
              size="large"
              aria-label="Previous photo"
              xstyle={styles.nav}
            >
              <ArrowBackIosNewIcon fontSize="large" />
            </IconButton>
          ) : (
            // Placeholder to keep the image centered.
            <div {...stylex.props(styles.navPlaceholder)} />
          )}

          <img
            src={photo.src}
            alt={photo.caption || ''}
            {...stylex.props(styles.photo)}
          />

          {nextPhotoFilename ? (
            <IconButton
              render={
                <Link
                  to="/albums/$slug/$filename"
                  params={{ slug, filename: nextPhotoFilename }}
                />
              }
              size="large"
              aria-label="Next photo"
              xstyle={styles.nav}
            >
              <ArrowForwardIosIcon fontSize="large" />
            </IconButton>
          ) : (
            <div {...stylex.props(styles.navPlaceholder)} />
          )}
        </div>

        {photo.caption && (
          <div {...stylex.props(styles.caption)}>
            <Text variant="body1" align="center">
              {photo.caption}
            </Text>
          </div>
        )}
      </Container>
    </div>
  )
}
