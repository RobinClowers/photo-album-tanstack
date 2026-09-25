import * as stylex from '@stylexjs/stylex'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/api/auth'
import {
  Alert,
  Button,
  Container,
  GoogleIcon,
  Paper,
  Text,
} from '@/components/ui'
import { space } from '@/styles/tokens.stylex'
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

const styles = stylex.create({
  page: { paddingTop: space.s8, paddingBottom: space.s8 },
  card: { padding: space.s4, textAlign: 'center' },
  intro: { marginBottom: space.s3 },
  alert: { marginBottom: space.s3, textAlign: 'left' },
})

function LoginPage() {
  const { error } = Route.useSearch()
  const message = error ? ERROR_MESSAGES[error] : undefined

  return (
    <Container maxWidth="xs" xstyle={styles.page}>
      <Paper xstyle={styles.card}>
        <Text variant="h5" as="h1" gutterBottom>
          Admin sign in
        </Text>
        <Text variant="body2" color="textSecondary" xstyle={styles.intro}>
          Only the site administrator can sign in.
        </Text>
        {message && (
          <Alert severity="error" xstyle={styles.alert}>
            {message}
          </Alert>
        )}
        <Button
          href="/api/auth/google/login"
          variant="contained"
          startIcon={<GoogleIcon />}
          fullWidth
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  )
}
