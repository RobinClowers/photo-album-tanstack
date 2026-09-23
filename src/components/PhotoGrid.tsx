import { Box } from '@mui/material'
import type { GridPhoto } from '@/utils/publicPhoto'
import PhotoGridItem from './PhotoGridItem'

// Enough to fill the first screen on a large desktop: the grid is capped at
// the xl container width (~4 tiles per row) and rows are 320-480px tall, so a
// 1440px-tall viewport shows about three rows.
const PRIORITY_COUNT = 12

interface PhotoGridProps {
  photos: GridPhoto[]
  albumSlug: string
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
      {photos.map((photo, index) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          albumSlug={albumSlug}
          priority={index < PRIORITY_COUNT}
        />
      ))}
    </Box>
  )
}
