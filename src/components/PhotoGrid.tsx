import { Box } from '@mui/material'
import PhotoGridItem from './PhotoGridItem'
import type { PhotoWithVersions } from '@/utils/photo'

interface PhotoGridProps {
  photos: PhotoWithVersions[]
  albumSlug: string
}

export default function PhotoGrid({ photos, albumSlug }: PhotoGridProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1, // 8px gutter
        '&::after': {
          content: '""',
          flexGrow: 10,
        },
      }}
    >
      {photos.map((photo) => (
        <PhotoGridItem key={photo.id} photo={photo} albumSlug={albumSlug} />
      ))}
    </Box>
  )
}
