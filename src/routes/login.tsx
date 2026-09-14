import { Google } from '@mui/icons-material'
import { Alert, Button, Container, Paper, Typography } from '@mui/material'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/api/auth'
import { type LoginError, parseLoginError } from '@/utils/loginErrors'

const ERROR_MESSAGES: Record<LoginError, string> = {
  oauth: 'Google sign-in failed. Please try again.',
  state: 'Sign-in session expired. Please try again.',
  not_admin: 'That Google account is not an administrator of this site.',
  unverified: 'That Google account has no verified email address.',
}

type LoginSearch = { error?: LoginError }

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    // Narrowed to the known codes: an arbitrary `?error=` key would otherwise
    // read straight off Object.prototype.
    const error = parseLoginError(search.error)
    return error ? { error } : {}
  },
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (user) throw redirect({ to: '/admin' })
  },
  head: () => ({ meta: [{ title: 'Sign in' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { error } = Route.useSearch()
  const message = error ? ERROR_MESSAGES[error] : undefined

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Admin sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Only the site administrator can sign in.
        </Typography>
        {message && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {message}
          </Alert>
        )}
        <Button
          component="a"
          href="/api/auth/google/login"
          variant="contained"
          startIcon={<Google />}
          fullWidth
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  )
}
