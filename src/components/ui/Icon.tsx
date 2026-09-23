import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'
import { motion } from '@/styles/tokens.stylex'
import { iconSize } from './icon.stylex'

export type IconFontSize = 'inherit' | 'small' | 'medium' | 'large'

export interface IconProps
  extends Omit<ComponentProps<'svg'>, 'className' | 'style' | 'children'> {
  /** MUI SvgIcon sizes: small 20px, medium 24px (default), large 35px. */
  fontSize?: IconFontSize | undefined
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  titleAccess?: string | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  root: {
    userSelect: 'none',
    width: '1em',
    height: '1em',
    display: 'inline-block',
    flexShrink: 0,
    fill: 'currentColor',
    transitionProperty: 'fill',
    transitionDuration: motion.durationShorter,
    transitionTimingFunction: motion.easeInOut,
  },
  inherit: { fontSize: 'inherit' },
  small: { fontSize: iconSize.small },
  medium: { fontSize: iconSize.medium },
  large: { fontSize: iconSize.large },
})

/** Builds an icon component from a 24x24 Material icon path. */
function createIcon(path: string, displayName: string) {
  function IconComponent({
    fontSize = 'medium',
    titleAccess,
    xstyle,
    ...props
  }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative (aria-hidden) unless titleAccess adds a <title>
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        aria-hidden={titleAccess ? undefined : true}
        role={titleAccess ? 'img' : undefined}
        data-icon={displayName}
        {...props}
        {...stylex.props(styles.root, styles[fontSize], xstyle)}
      >
        {titleAccess ? <title>{titleAccess}</title> : null}
        <path d={path} />
      </svg>
    )
  }
  IconComponent.displayName = `${displayName}Icon`
  return IconComponent
}

/*
 * Paths are the Material icon SVGs from @mui/icons-material (and
 * @mui/material's internal icons for Alert / Avatar), so icons look the same
 * as before the migration.
 */

export const HomeIcon = createIcon(
  'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'Home',
)
export const ArrowBackIcon = createIcon(
  'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  'ArrowBack',
)
export const ArrowBackIosNewIcon = createIcon(
  'M17.77 3.77 16 2 6 12l10 10 1.77-1.77L9.54 12z',
  'ArrowBackIosNew',
)
export const ArrowForwardIosIcon = createIcon(
  'M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z',
  'ArrowForwardIos',
)
export const OpenInNewIcon = createIcon(
  'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z',
  'OpenInNew',
)
export const StarBorderIcon = createIcon(
  'm22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28z',
  'StarBorder',
)
export const StarIcon = createIcon(
  'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  'Star',
)
export const RefreshIcon = createIcon(
  'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',
  'Refresh',
)
export const GoogleIcon = createIcon(
  'M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z',
  'Google',
)
export const DeleteIcon = createIcon(
  'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
  'Delete',
)
export const ArrowDropDownIcon = createIcon('m7 10 5 5 5-5z', 'ArrowDropDown')
export const CloseIcon = createIcon(
  'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  'Close',
)

// Used inside Alert and Avatar, as in MUI.
export const SuccessOutlinedIcon = createIcon(
  'M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z',
  'SuccessOutlined',
)
export const ReportProblemOutlinedIcon = createIcon(
  'M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z',
  'ReportProblemOutlined',
)
export const ErrorOutlineIcon = createIcon(
  'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
  'ErrorOutline',
)
export const InfoOutlinedIcon = createIcon(
  'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z',
  'InfoOutlined',
)
export const PersonIcon = createIcon(
  'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  'Person',
)

export type IconComponent = typeof HomeIcon
