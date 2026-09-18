import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { adminCreateAlbum } from '@/api/admin-albums'
import { isValidSlug, slugify } from '@/utils/slug'
import { useAdminAction } from './useAdminAction'

export function NewAlbumForm() {
  const navigate = useNavigate()
  const { run, pending, error } = useAdminAction()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const handleTitle = (value: string) => {
    setTitle(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const album = await run(() =>
      adminCreateAlbum({ data: { title: title.trim(), slug } }),
    )
    if (album) {
      navigate({ to: '/admin/albums/$id', params: { id: String(album.id) } })
    }
  }

  const slugError = slug && !isValidSlug(slug)

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        New album
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => handleTitle(e.target.value)}
          required
          size="small"
          sx={{ flex: '1 1 240px' }}
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true)
            setSlug(e.target.value)
          }}
          required
          size="small"
          error={Boolean(slugError)}
          helperText={slugError ? 'Lowercase letters, numbers and dashes' : ' '}
          sx={{ flex: '1 1 240px' }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={pending || !title.trim() || !isValidSlug(slug)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Create
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Paper>
  )
}
