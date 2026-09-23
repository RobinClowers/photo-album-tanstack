import { Box } from '@mui/material'
import type { PhotoWithVersions } from '@/utils/photo'
import PhotoGridItem from './PhotoGridItem'

interface PhotoGridProps {
  photos: PhotoWithVersions[]
  albumSlug: string
}

function aspectRatio(photo: PhotoWithVersions): number | null {
  const original = photo.versions.find((v) => v.size === 'original')
  if (!original?.width || !original?.height) return null
  return original.width / original.height
}

/**
 * Justified rows in pure CSS: each tile's flex-basis is its width at the
 * target row height, and its flex-grow is its aspect ratio, so leftover space
 * in a row is shared in proportion to width and every tile in the row keeps
 * the same height. Because nothing is measured in JS, the server renders the
 * final layout and the page has its full height on the first paint.
 */
export default function PhotoGrid({ photos, albumSlug }: PhotoGridProps) {
  return (
    <Box
      sx={{
        '--row-height': { xs: '200px', sm: '320px' },
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: '10px',
        px: { xs: 0, sm: '10px' },
        // Absorbs the free space in the last row so its tiles stay near the
        // target height instead of stretching to fill the full width.
        '&::after': {
          content: '""',
          flexGrow: 1e4,
        },
      }}
    >
      {photos.map((photo) => {
        // Photos without dimensions can't be laid out, so they are skipped.
        const ratio = aspectRatio(photo)
        if (!ratio) return null
        return (
          <PhotoGridItem
            key={photo.id}
            photo={photo}
            aspectRatio={ratio}
            albumSlug={albumSlug}
          />
        )
      })}
    </Box>
  )
}
