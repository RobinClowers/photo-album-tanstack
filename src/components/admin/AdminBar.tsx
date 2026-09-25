import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Button, Container, Text } from '@/components/ui'
import type { AdminUser } from '@/server/auth'
import { colors, font, space } from '@/styles/tokens.stylex'

const styles = stylex.create({
  bar: {
    backgroundColor: colors.grey100,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.divider,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: space.s2,
    paddingTop: space.s1,
    paddingBottom: space.s1,
  },
  brand: {
    fontWeight: font.weightMedium,
    color: 'inherit',
    textDecoration: 'none',
  },
  spacer: { flexGrow: 1 },
})

export function AdminBar({ user }: { user: AdminUser }) {
  return (
    <div {...stylex.props(styles.bar)}>
      <Container maxWidth="lg" xstyle={styles.inner}>
        <Text
          variant="subtitle1"
          render={<Link to="/admin" />}
          xstyle={styles.brand}
        >
          Admin
        </Text>
        <Button render={<Link to="/admin" />} size="small" color="inherit">
          Albums
        </Button>
        <Button
          render={<Link to="/admin/imports" />}
          size="small"
          color="inherit"
        >
          Imports
        </Button>
        <div {...stylex.props(styles.spacer)} />
        <Text variant="body2" color="textSecondary">
          {user.email}
        </Text>
        <form method="post" action="/api/auth/logout">
          <Button type="submit" size="small" variant="outlined">
            Sign out
          </Button>
        </form>
      </Container>
    </div>
  )
}
