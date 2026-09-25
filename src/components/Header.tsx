import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { HomeIcon, IconButton, Text } from '@/components/ui'
import { breakpoints } from '@/styles/breakpoints.stylex'
import { colors, elevation, space, zIndex } from '@/styles/tokens.stylex'

// MUI `AppBar position="static"` + `Toolbar`: primary bar with elevation 4,
// 56px tall on phones (48px in landscape), 64px from sm up.
const styles = stylex.create({
  bar: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
    // `position="static"`: the z-index is inert, so a following element with
    // a background (the admin bar) paints over the shadow, as with MUI.
    position: 'static',
    zIndex: zIndex.appBar,
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    boxShadow: elevation.e4,
  },
  toolbar: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: {
      default: '56px',
      '@media (max-width: 599.95px) and (orientation: landscape)': '48px',
      [breakpoints.smUp]: '64px',
    },
    paddingLeft: { default: space.s2, [breakpoints.smUp]: space.s3 },
    paddingRight: { default: space.s2, [breakpoints.smUp]: space.s3 },
  },
  home: { marginRight: space.s2 },
  title: { flexGrow: 1 },
})

export function Header() {
  return (
    <header {...stylex.props(styles.bar)}>
      <div {...stylex.props(styles.toolbar)}>
        <IconButton
          render={<Link to="/" />}
          edge="start"
          color="inherit"
          aria-label="Home"
          xstyle={styles.home}
        >
          <HomeIcon />
        </IconButton>
        <Text variant="h6" as="div" xstyle={styles.title}>
          Robin's Photos
        </Text>
      </div>
    </header>
  )
}
