import { Progress } from '@base-ui/react/progress'
import * as stylex from '@stylexjs/stylex'
import { type PaletteColor, toneStyles } from './tone'
import { tone } from './tone.stylex'

interface ProgressProps {
  /** 0-100. Omit (or `null`) for an indeterminate animation. */
  value?: number | null | undefined
  /** Default `primary`. */
  color?: PaletteColor | 'inherit' | undefined
  'aria-label'?: string | undefined
  'aria-labelledby'?: string | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

// MUI LinearProgress keyframes.
const indeterminate1 = stylex.keyframes({
  '0%': { left: '-35%', right: '100%' },
  '60%': { left: '100%', right: '-90%' },
  '100%': { left: '100%', right: '-90%' },
})
const indeterminate2 = stylex.keyframes({
  '0%': { left: '-200%', right: '100%' },
  '60%': { left: '107%', right: '-8%' },
  '100%': { left: '107%', right: '-8%' },
})
// MUI CircularProgress keyframes.
const rotate = stylex.keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
})
const dash = stylex.keyframes({
  '0%': { strokeDasharray: '1px, 200px', strokeDashoffset: 0 },
  '50%': { strokeDasharray: '100px, 200px', strokeDashoffset: '-15px' },
  '100%': { strokeDasharray: '1px, 200px', strokeDashoffset: '-126px' },
})

const styles = stylex.create({
  linear: {
    position: 'relative',
    overflow: 'hidden',
    display: 'block',
    height: '4px',
    zIndex: 0,
    // MUI: lighten(main, 0.62)
    backgroundColor: `color-mix(in srgb, ${tone.main} 38%, white)`,
  },
  bar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 'auto',
    backgroundColor: tone.main,
    transformOrigin: 'left',
  },
  determinateBar: {
    transitionProperty: 'width',
    transitionDuration: '0.4s',
    transitionTimingFunction: 'linear',
  },
  bar1Indeterminate: {
    animationName: indeterminate1,
    animationDuration: '2.1s',
    animationTimingFunction: 'cubic-bezier(0.65, 0.815, 0.735, 0.395)',
    animationIterationCount: 'infinite',
  },
  bar2Indeterminate: {
    animationName: indeterminate2,
    animationDuration: '2.1s',
    animationTimingFunction: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    animationDelay: '1.15s',
    animationIterationCount: 'infinite',
  },
  circular: {
    display: 'inline-block',
    color: tone.main,
    lineHeight: 0,
  },
  circularIndeterminate: {
    animationName: rotate,
    animationDuration: '1.4s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  circularDeterminate: { transform: 'rotate(-90deg)' },
  svg: { display: 'block' },
  circle: { stroke: 'currentColor' },
  circleDeterminate: {
    transitionProperty: 'stroke-dashoffset',
    transitionDuration: '300ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  circleIndeterminate: {
    strokeDasharray: '80px, 200px',
    strokeDashoffset: 0,
    animationName: dash,
    animationDuration: '1.4s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  size: (size: string) => ({ width: size, height: size }),
})

/** 4px progress bar (MUI `LinearProgress`) on Base UI Progress. */
export function LinearProgress({
  value = null,
  color = 'primary',
  xstyle,
  ...aria
}: ProgressProps) {
  const determinate = value !== null
  return (
    <Progress.Root
      value={value}
      {...aria}
      {...stylex.props(toneStyles[color], styles.linear, xstyle)}
    >
      {determinate ? (
        <Progress.Track>
          <Progress.Indicator
            {...stylex.props(styles.bar, styles.determinateBar)}
          />
        </Progress.Track>
      ) : (
        <Progress.Track>
          <span
            data-bar=""
            {...stylex.props(styles.bar, styles.bar1Indeterminate)}
          />
          <span
            data-bar=""
            {...stylex.props(styles.bar, styles.bar2Indeterminate)}
          />
        </Progress.Track>
      )}
    </Progress.Root>
  )
}

const SIZE = 44
const THICKNESS = 3.6
const RADIUS = (SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface CircularProgressProps extends ProgressProps {
  /** Diameter in px. Default 40. */
  size?: number | undefined
}

/** Spinner / progress ring (MUI `CircularProgress`) on Base UI Progress. */
export function CircularProgress({
  value = null,
  color = 'primary',
  size = 40,
  xstyle,
  ...aria
}: CircularProgressProps) {
  const determinate = value !== null
  return (
    <Progress.Root
      value={value}
      render={<span />}
      {...aria}
      {...stylex.props(
        toneStyles[color],
        styles.circular,
        determinate ? styles.circularDeterminate : styles.circularIndeterminate,
        styles.size(`${size}px`),
        xstyle,
      )}
    >
      <svg
        viewBox={`${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`}
        aria-hidden="true"
        {...stylex.props(styles.svg, styles.size('100%'))}
      >
        <circle
          cx={SIZE}
          cy={SIZE}
          r={RADIUS}
          fill="none"
          strokeWidth={THICKNESS}
          strokeDasharray={determinate ? CIRCUMFERENCE.toFixed(3) : undefined}
          strokeDashoffset={
            determinate
              ? `${(((100 - value) / 100) * CIRCUMFERENCE).toFixed(3)}px`
              : undefined
          }
          {...stylex.props(
            styles.circle,
            determinate ? styles.circleDeterminate : styles.circleIndeterminate,
          )}
        />
      </svg>
    </Progress.Root>
  )
}
