import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Text } from '@/components/ui'
import { colors, radii, space } from '@/styles/tokens.stylex'
import type { GridPhoto } from '@/utils/publicPhoto'
import { photoGrid } from './photoGrid.stylex'

interface PhotoGridItemProps {
  photo: GridPhoto
  albumSlug: string
  /**
   * Above-the-fold tiles load eagerly at high priority and skip the fade-in,
   * so they can paint from the server HTML before hydration.
   */
  priority?: boolean
}

// Keep in sync with photoGrid.rowHeight in PhotoGrid. Tiles grow somewhat
// past their basis to fill a row, so the srcset hint allows for that.
const ROW_HEIGHT_MOBILE = 200
const ROW_HEIGHT = 320
const ROW_GROWTH = 1.25

const styles = stylex.create({
  tile: {
    position: 'relative',
    flexShrink: 1,
    minWidth: 0,
    // A row that wraps early (typically before a panorama) stretches its
    // few tiles across the full width; cap the height and let the image
    // crop rather than rendering one enormous tile.
    maxHeight: `calc(${photoGrid.rowHeight} * 1.5)`,
    overflow: 'hidden',
    borderRadius: radii.sm,
    // Placeholder while the photo loads.
    backgroundColor: colors.grey200,
  },
  // Per-photo sizing: grow in proportion to width, basis = width at the
  // target row height.
  aspect: (aspectRatio: number) => ({
    flexGrow: aspectRatio,
    flexBasis: `calc(${photoGrid.rowHeight} * ${aspectRatio})`,
    aspectRatio,
  }),
  link: { display: 'block', width: '100%', height: '100%' },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    verticalAlign: 'bottom',
    transitionProperty: 'opacity',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-in',
  },
  loading: { opacity: 0 },
  caption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: colors.white,
    padding: space.s1,
  },
})

export default function PhotoGridItem({
  photo,
  albumSlug,
  priority = false,
}: PhotoGridItemProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(priority)

  // An image that finished loading before hydration never fires onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  const { aspectRatio } = photo
  const mobileWidth = Math.round(aspectRatio * ROW_HEIGHT_MOBILE * ROW_GROWTH)
  const desktopWidth = Math.round(aspectRatio * ROW_HEIGHT * ROW_GROWTH)

  return (
    <div {...stylex.props(styles.tile, styles.aspect(aspectRatio))}>
      <Link
        to="/albums/$slug/$filename"
        params={{ slug: albumSlug, filename: photo.filename }}
        {...stylex.props(styles.link)}
      >
        <img
          ref={imgRef}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          data-loaded={loaded}
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={`(max-width: 599px) min(100vw, ${mobileWidth}px), ${desktopWidth}px`}
          alt={photo.caption || ''}
          {...stylex.props(styles.image, !loaded && styles.loading)}
        />
        {photo.caption && (
          <div {...stylex.props(styles.caption)}>
            <Text variant="caption" noWrap as="div">
              {photo.caption}
            </Text>
          </div>
        )}
      </Link>
    </div>
  )
}
