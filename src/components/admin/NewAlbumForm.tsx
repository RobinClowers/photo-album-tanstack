import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { adminCreateAlbum } from '@/api/admin-albums'
import { Button, Paper, Text, TextField } from '@/components/ui'
import { space } from '@/styles/tokens.stylex'
import { isValidSlug, slugify } from '@/utils/slug'
import { useAdminAction } from './useAdminAction'

const styles = stylex.create({
  paper: { padding: space.s2 },
  fields: { display: 'flex', gap: space.s2, flexWrap: 'wrap' },
  field: { flex: '1 1 240px' },
  submit: { alignSelf: 'flex-start' },
})

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
    <Paper render={<form onSubmit={handleSubmit} />} xstyle={styles.paper}>
      <Text variant="h6" as="h2" gutterBottom>
        New album
      </Text>
      <div {...stylex.props(styles.fields)}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => handleTitle(e.target.value)}
          required
          size="small"
          xstyle={styles.field}
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
          xstyle={styles.field}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={pending || !title.trim() || !isValidSlug(slug)}
          xstyle={styles.submit}
        >
          Create
        </Button>
      </div>
      {error && (
        <Text color="error" variant="body2" role="alert">
          {error}
        </Text>
      )}
    </Paper>
  )
}
