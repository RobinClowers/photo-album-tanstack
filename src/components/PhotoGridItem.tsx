import { Box, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import {
  buildPhotoPath,
  buildPhotoSrcSet,
  type PhotoWithVersions,
} from '@/utils/photo'

interface PhotoGridItemProps {
  photo: PhotoWithVersions
  /** Width / height of the original, used to size the tile in its row. */
  aspectRatio: number
  albumSlug: string
}

// Keep in sync with --row-height in PhotoGrid. Tiles grow somewhat past their
// basis to fill a row, so the srcset hint allows for that.
const ROW_HEIGHT_MOBILE = 200
const ROW_HEIGHT = 320
const ROW_GROWTH = 1.25

export default function PhotoGridItem({
  photo,
  aspectRatio,
  albumSlug,
}: PhotoGridItemProps) {
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
      }}
    >
      <Link
        to="/albums/$slug/$filename"
        params={{ slug: albumSlug, filename: photo.filename || '' }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Box
          component="img"
          src={buildPhotoPath(photo, 'tablet')}
          srcSet={buildPhotoSrcSet(photo)}
          sizes={`(max-width: 599px) min(100vw, ${mobileWidth}px), ${desktopWidth}px`}
          alt={photo.caption || ''}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            verticalAlign: 'bottom',
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
