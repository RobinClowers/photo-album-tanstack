import { Delete, Refresh, Star, StarBorder } from '@mui/icons-material'
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
import { buildPhotoPath, CAPTION_MAX_LENGTH } from '@/utils/photo'

export type AdminPhoto = AdminAlbumDetails['photos'][number]

export function PhotoTile({
  photo,
  isCover,
  disabled,
  onSaveCaption,
  onSetCover,
  onDelete,
  onReprocess,
}: {
  photo: AdminPhoto
  isCover: boolean
  disabled: boolean
  onSaveCaption: (caption: string) => Promise<unknown>
  onSetCover: () => void
  onDelete: () => void
  onReprocess: () => void
}) {
  const saved = photo.caption ?? ''
  const [caption, setCaption] = useState(saved)
  const [syncedWith, setSyncedWith] = useState(saved)
  const [saving, setSaving] = useState(false)

  // The server trims the caption and stores '' as null, so pick up what it
  // actually saved instead of staying dirty forever and re-POSTing on blur.
  if (syncedWith !== saved) {
    setSyncedWith(saved)
    setCaption(saved)
  }

  const dirty = caption.trim() !== saved.trim()

  const saveCaption = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await onSaveCaption(caption)
    } finally {
      setSaving(false)
    }
  }

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
          onBlur={saveCaption}
          placeholder="Caption"
          size="small"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          disabled={disabled || saving}
          slotProps={{
            input: { sx: { fontSize: 13 } },
            htmlInput: { maxLength: CAPTION_MAX_LENGTH },
          }}
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
        <Box>
          <Tooltip title="Regenerate size variants">
            <IconButton
              size="small"
              onClick={onReprocess}
              disabled={disabled}
              aria-label="Regenerate size variants"
            >
              <Refresh fontSize="small" />
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
        </Box>
      </CardActions>
    </Card>
  )
}
