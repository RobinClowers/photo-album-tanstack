import { Box, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { GridPhoto } from '@/utils/publicPhoto'

interface PhotoGridItemProps {
  photo: GridPhoto
  albumSlug: string
  /**
   * Above-the-fold tiles load eagerly at high priority and skip the fade-in,
   * so they can paint from the server HTML before hydration.
   */
  priority?: boolean
}

// Keep in sync with --row-height in PhotoGrid. Tiles grow somewhat past their
// basis to fill a row, so the srcset hint allows for that.
const ROW_HEIGHT_MOBILE = 200
const ROW_HEIGHT = 320
const ROW_GROWTH = 1.25

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
    <Box
      // Pigment extracts sx at build time, so the per-photo value is passed
      // as a CSS variable rather than interpolated into the sx styles.
      style={{ '--aspect-ratio': aspectRatio } as React.CSSProperties}
      sx={{
        position: 'relative',
        flex: 'var(--aspect-ratio) 1 calc(var(--row-height) * var(--aspect-ratio))',
        minWidth: 0,
        aspectRatio: 'var(--aspect-ratio)',
        // A row that wraps early (typically before a panorama) stretches its
        // few tiles across the full width; cap the height and let the image
        // crop rather than rendering one enormous tile.
        maxHeight: 'calc(var(--row-height) * 1.5)',
        overflow: 'hidden',
        borderRadius: 1,
        // Placeholder while the photo loads.
        bgcolor: 'grey.200',
      }}
    >
      <Link
        to="/albums/$slug/$filename"
        params={{ slug: albumSlug, filename: photo.filename }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Box
          component="img"
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
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            verticalAlign: 'bottom',
            transition: 'opacity 0.3s ease-in',
            '&[data-loaded="false"]': { opacity: 0 },
          }}
        />
        {photo.caption && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: 1,
            }}
          >
            <Typography variant="caption" noWrap component="div">
              {photo.caption}
            </Typography>
          </Box>
        )}
      </Link>
    </Box>
  )
}
