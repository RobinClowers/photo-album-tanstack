import { Box, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { buildPhotoPath, type PhotoWithVersions } from '@/utils/photo'

interface PhotoGridItemProps {
  photo: PhotoWithVersions
  dimensions: {
    top: number
    left: number
    width: number
    height: number
  }
  albumSlug: string
}

export default function PhotoGridItem({
  photo,
  dimensions,
  albumSlug,
}: PhotoGridItemProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: dimensions.top,
        left: dimensions.left,
        width: dimensions.width,
        height: dimensions.height,
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
