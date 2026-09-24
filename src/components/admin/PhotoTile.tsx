import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  DeleteIcon,
  IconButton,
  RefreshIcon,
  StarBorderIcon,
  StarIcon,
  TextField,
  Tooltip,
} from '@/components/ui'
import type { AdminAlbumDetails } from '@/db/admin'
import { colors, space } from '@/styles/tokens.stylex'
import { buildPhotoPath, CAPTION_MAX_LENGTH } from '@/utils/photo'

export type AdminPhoto = AdminAlbumDetails['photos'][number]

const styles = stylex.create({
  card: { display: 'flex', flexDirection: 'column' },
  media: {
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    backgroundColor: colors.grey100,
  },
  content: { padding: space.s1_5, paddingBottom: 0, flexGrow: 1 },
  filename: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: space.s1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // MUI sizes the input root, so its em-based line height and letter
  // spacing scale with the 13px text too.
  caption: {
    fontSize: '13px',
    lineHeight: '1.4375em',
    letterSpacing: '0.00938em',
  },
  actions: {
    justifyContent: 'space-between',
    paddingLeft: space.s1,
    paddingRight: space.s1,
  },
})

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

  const coverLabel = isCover ? 'Cover photo' : 'Use as cover'

  return (
    <Card variant="outlined" xstyle={styles.card}>
      <CardMedia
        src={buildPhotoPath(photo, 'mobile_sm')}
        alt={photo.filename ?? ''}
        loading="lazy"
        xstyle={styles.media}
      />
      <CardContent xstyle={styles.content}>
        <div title={photo.filename ?? ''} {...stylex.props(styles.filename)}>
          {photo.filename}
        </div>
        <TextField
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={saveCaption}
          placeholder="Caption"
          aria-label={`Caption for ${photo.filename ?? 'photo'}`}
          size="small"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          disabled={disabled || saving}
          maxLength={CAPTION_MAX_LENGTH}
          inputXstyle={styles.caption}
        />
      </CardContent>
      <CardActions xstyle={styles.actions}>
        <Tooltip title={coverLabel}>
          <IconButton
            size="small"
            color={isCover ? 'warning' : 'default'}
            onClick={onSetCover}
            disabled={disabled || isCover}
            aria-label={coverLabel}
          >
            {isCover ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
        </Tooltip>
        <div>
          <Tooltip title="Regenerate size variants">
            <IconButton
              size="small"
              onClick={onReprocess}
              disabled={disabled}
              aria-label="Regenerate size variants"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete photo">
            <IconButton
              size="small"
              onClick={onDelete}
              disabled={disabled}
              aria-label="Delete photo"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </CardActions>
    </Card>
  )
}
