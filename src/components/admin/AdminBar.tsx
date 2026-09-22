import { Box, Button, Container, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { AdminUser } from '@/server/auth'

export function AdminBar({ user }: { user: AdminUser }) {
  return (
    <Box sx={{ bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}
      >
        <Typography
          component={Link}
          to="/admin"
          variant="subtitle1"
          sx={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}
        >
          Admin
        </Typography>
        <Button component={Link} to="/admin" size="small" color="inherit">
          Albums
        </Button>
        <Button
          component={Link}
          to="/admin/imports"
          size="small"
          color="inherit"
        >
          Imports
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
        <form method="post" action="/api/auth/logout">
          <Button type="submit" size="small" variant="outlined">
            Sign out
          </Button>
        </form>
      </Container>
    </Box>
  )
}
