import { Box, Typography } from '@mui/material'
import { buildPhotoPath, type PhotoWithVersions } from '@/utils/photo'

interface PhotoGridItemProps {
  photo: PhotoWithVersions
}

export default function PhotoGridItem({ photo }: PhotoGridItemProps) {
  const originalVersion =
    photo.versions.find((v) => v.size === 'original') || photo.versions[0]

  const width = originalVersion?.width || 1
  const height = originalVersion?.height || 1
  const aspectRatio = width / height

  return (
    <Box
      sx={{
        height: { xs: 150, sm: 200, md: 250 },
        flexGrow: aspectRatio,
        position: 'relative',
        overflow: 'hidden',
        // Optional rounding for modern aesthetic
        borderRadius: 1,
      }}
    >
      <Box
        component="img"
        src={buildPhotoPath(photo, 'tablet')} // Using 'tablet' or 'mobile_sm' based on reasonable resolution
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
    </Box>
  )
}
