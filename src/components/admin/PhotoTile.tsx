import { Delete, Star, StarBorder } from '@mui/icons-material'
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material'
import { useState } from 'react'
import type { AdminAlbumDetails } from '@/db/admin'
import { buildPhotoPath } from '@/utils/photo'

export type AdminPhoto = AdminAlbumDetails['photos'][number]

export function PhotoTile({
  photo,
  isCover,
  disabled,
  onSaveCaption,
  onSetCover,
  onDelete,
}: {
  photo: AdminPhoto
  isCover: boolean
  disabled: boolean
  onSaveCaption: (caption: string) => void
  onSetCover: () => void
  onDelete: () => void
}) {
  const [caption, setCaption] = useState(photo.caption ?? '')
  const dirty = caption !== (photo.caption ?? '')

  return (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        image={buildPhotoPath(photo, 'mobile_sm')}
        alt={photo.filename ?? ''}
        loading="lazy"
        sx={{ aspectRatio: '4 / 3', objectFit: 'cover', bgcolor: 'grey.100' }}
      />
      <CardContent sx={{ p: 1.5, pb: 0, flexGrow: 1 }}>
        <Box
          sx={{
            fontSize: 12,
            color: 'text.secondary',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={photo.filename ?? ''}
        >
          {photo.filename}
        </Box>
        <TextField
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => dirty && onSaveCaption(caption)}
          placeholder="Caption"
          size="small"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          disabled={disabled}
          slotProps={{ input: { sx: { fontSize: 13 } } }}
        />
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
        <Tooltip title={isCover ? 'Cover photo' : 'Use as cover'}>
          <IconButton
            size="small"
            color={isCover ? 'warning' : 'default'}
            onClick={onSetCover}
            disabled={disabled || isCover}
            aria-label={isCover ? 'Cover photo' : 'Use as cover'}
          >
            {isCover ? <Star /> : <StarBorder />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete photo">
          <IconButton
            size="small"
            onClick={onDelete}
            disabled={disabled}
            aria-label="Delete photo"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}
