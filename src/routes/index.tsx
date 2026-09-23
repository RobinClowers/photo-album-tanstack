import * as stylex from '@stylexjs/stylex'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllAlbums } from '@/api/albums'
import { Card, CardMedia, Container, Text } from '@/components/ui'
import { space } from '@/styles/tokens.stylex'
import { publicPageHeaders } from '@/utils/cacheControl'

export const Route = createFileRoute('/')({
  headers: publicPageHeaders,
  component: IndexPage,
  loader: async () => ({ albums: await getAllAlbums() }),
})

const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s4 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 240px)',
    justifyContent: 'center',
    gap: space.s3,
  },
  link: { textDecoration: 'none' },
})

function IndexPage() {
  const { albums } = Route.useLoaderData()

  return (
    <Container maxWidth="lg" xstyle={styles.page}>
      <div {...stylex.props(styles.grid)}>
        {albums.map((album) => (
          <Link
            to="/albums/$slug"
            params={{
              slug: album.slug,
            }}
            key={album.id}
            {...stylex.props(styles.link)}
          >
            <Card>
              {album.cover_photo && (
                <CardMedia
                  height="180"
                  width="240"
                  src={album.cover_photo.src}
                  srcSet={album.cover_photo.srcSet}
                  sizes="240px"
                  alt={album.title}
                />
              )}
              <Text variant="h6" as="h2" align="center">
                {album.title}
              </Text>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
