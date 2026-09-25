import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, font, radii } from '@/styles/tokens.stylex'
import { PersonIcon } from './Icon'

export interface AvatarProps {
  src?: string | undefined
  srcSet?: string | undefined
  alt?: string | undefined
  /** Default `circular`. */
  variant?: 'circular' | 'rounded' | 'square' | undefined
  /** Shown while the image loads, if it fails, or without `src`. Default: a person icon. */
  children?: ReactNode | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    fontFamily: font.family,
    fontSize: '1.25rem',
    lineHeight: 1,
    borderRadius: radii.circle,
    overflow: 'hidden',
    userSelect: 'none',
    verticalAlign: 'middle',
  },
  rounded: { borderRadius: radii.sm },
  square: { borderRadius: 0 },
  layer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    color: colors.backgroundDefault,
    backgroundColor: colors.grey400,
  },
  fallbackIcon: { width: '75%', height: '75%' },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    textAlign: 'center',
    color: 'transparent',
    textIndent: '10000px',
    // Hidden, not display:none, so `loading="lazy"` still fetches it.
    visibility: {
      default: 'visible',
      '[data-loading]': 'hidden',
      '[data-error]': 'hidden',
    },
  },
})

/**
 * Round (or rounded) thumbnail with a fallback (MUI `Avatar`), on Base UI
 * Avatar. The image is server-rendered and lazy-loadable (`keepMounted`),
 * stacked over the fallback until it loads.
 */
export function Avatar({
  src,
  srcSet,
  alt,
  variant = 'circular',
  children,
  xstyle,
}: AvatarProps) {
  return (
    <BaseAvatar.Root
      {...stylex.props(
        styles.root,
        variant === 'rounded' && styles.rounded,
        variant === 'square' && styles.square,
        xstyle,
      )}
    >
      <BaseAvatar.Fallback {...stylex.props(styles.layer, styles.fallback)}>
        {children ?? (
          <PersonIcon fontSize="inherit" xstyle={styles.fallbackIcon} />
        )}
      </BaseAvatar.Fallback>
      {src ? (
        <BaseAvatar.Image
          keepMounted
          src={src}
          srcSet={srcSet}
          alt={alt}
          {...stylex.props(styles.layer, styles.image)}
        />
      ) : null}
    </BaseAvatar.Root>
  )
}
