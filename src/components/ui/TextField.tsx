import { Field } from '@base-ui/react/field'
import * as stylex from '@stylexjs/stylex'
import {
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'
import { colors, font, motion, radii } from '@/styles/tokens.stylex'

export interface TextFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'className' | 'style' | 'size' | 'onChange' | 'children'
  > {
  label?: ReactNode | undefined
  /** Text below the field; `' '` reserves its height, as in MUI. */
  helperText?: ReactNode | undefined
  /** Paints the outline, label and helper text red and marks the control invalid. */
  error?: boolean | undefined
  /** small: 40px tall, medium: 56px. Default `medium`. */
  size?: 'small' | 'medium' | undefined
  fullWidth?: boolean | undefined
  /** Renders an auto-growing `<textarea>`. */
  multiline?: boolean | undefined
  /** Visible rows of a multiline field. Default 1. */
  minRows?: number | undefined
  /** Rows a multiline field grows to before it scrolls. */
  maxRows?: number | undefined
  onChange?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined
  /** Styles for the outer field element (layout: flex, margins, width). */
  xstyle?: stylex.StyleXStyles | undefined
  /** Styles for the input / textarea itself (e.g. font size). */
  inputXstyle?: stylex.StyleXStyles | undefined
}

/** Invisible characters, spelled out because formatters inline escapes. */
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b)
const THIN_SPACE = String.fromCodePoint(0x2009)

const SHRUNK = 'translate(14px, -9px) scale(0.75)'

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    position: 'relative',
    minWidth: 0,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    verticalAlign: 'top',
  },
  fullWidth: { width: '100%' },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    padding: 0,
    pointerEvents: 'none',
    transformOrigin: 'top left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: font.family,
    fontWeight: font.weightRegular,
    fontSize: '1rem',
    lineHeight: '1.4375em',
    letterSpacing: '0.00938em',
    color: { default: colors.textSecondary, '[data-focused]': colors.primary },
    maxWidth: {
      default: 'calc(100% - 24px)',
      '[data-filled]': 'calc(133% - 32px)',
      '[data-focused]': 'calc(133% - 32px)',
    },
    transform: {
      default: 'translate(14px, 16px) scale(1)',
      '[data-filled]': SHRUNK,
      '[data-focused]': SHRUNK,
    },
    transitionProperty: 'color, transform, max-width',
    transitionDuration: motion.durationShorter,
    transitionTimingFunction: motion.easeOut,
  },
  labelSmall: {
    transform: {
      default: 'translate(14px, 9px) scale(1)',
      '[data-filled]': SHRUNK,
      '[data-focused]': SHRUNK,
    },
  },
  labelError: { color: colors.error },
  labelDisabled: { color: colors.textDisabled },
  inputBase: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    cursor: 'text',
    color: colors.textPrimary,
    fontFamily: font.family,
    fontWeight: font.weightRegular,
    fontSize: '1rem',
    lineHeight: '1.4375em',
    letterSpacing: '0.00938em',
    borderRadius: radii.sm,
  },
  inputBaseMultiline: { padding: '16.5px 14px' },
  inputBaseMultilineSmall: { padding: '8.5px 14px' },
  inputBaseDisabled: { color: colors.textDisabled, cursor: 'default' },
  input: {
    font: 'inherit',
    letterSpacing: 'inherit',
    color: 'currentColor',
    padding: '16.5px 14px',
    borderWidth: 0,
    // MUI uses content-box with a 1.4375em height. border-box plus the
    // padding is the same box, and does not depend on the global reset
    // (MUI CssBaseline's unlayered `* { box-sizing: inherit }` beats StyleX).
    boxSizing: 'border-box',
    background: 'none',
    height: 'calc(1.4375em + 33px)',
    margin: 0,
    display: 'block',
    minWidth: 0,
    width: '100%',
    outlineStyle: 'none',
    WebkitTapHighlightColor: 'transparent',
    '::placeholder': { color: 'currentColor', opacity: 0.42 },
  },
  inputSmall: { padding: '8.5px 14px', height: 'calc(1.4375em + 17px)' },
  // With a label, the placeholder only shows once the label has moved up.
  placeholderWithLabel: {
    '::placeholder': {
      color: 'currentColor',
      opacity: { default: 0, ':focus': 0.42 },
    },
  },
  textarea: { padding: 0, height: 'auto', resize: 'none' },
  outline: {
    position: 'absolute',
    textAlign: 'left',
    top: '-5px',
    right: 0,
    bottom: 0,
    left: 0,
    margin: 0,
    padding: '0 8px',
    pointerEvents: 'none',
    borderRadius: 'inherit',
    borderStyle: 'solid',
    borderWidth: {
      default: '1px',
      [stylex.when.ancestor('[data-focused]')]: '2px',
    },
    borderColor: {
      default: 'rgba(0, 0, 0, 0.23)',
      [stylex.when.ancestor(':hover:not([data-focused])')]: colors.textPrimary,
      [stylex.when.ancestor('[data-focused]')]: colors.primary,
    },
    overflow: 'hidden',
    minWidth: '0%',
  },
  outlineError: { borderColor: colors.error },
  outlineDisabled: { borderColor: colors.actionDisabled },
  legend: {
    float: 'none',
    width: 'auto',
    overflow: 'hidden',
    display: 'block',
    padding: 0,
    height: '11px',
    fontSize: '0.75em',
    visibility: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: {
      default: '0.01px',
      [stylex.when.ancestor('[data-filled]')]: '100%',
      [stylex.when.ancestor('[data-focused]')]: '100%',
    },
    transitionProperty: 'max-width',
    transitionDuration: '50ms',
    transitionTimingFunction: motion.easeOut,
  },
  legendEmpty: { lineHeight: '11px', height: 'auto', maxWidth: 'none' },
  legendText: {
    paddingLeft: '5px',
    paddingRight: '5px',
    display: 'inline-block',
    opacity: 0,
    visibility: 'visible',
  },
  helper: {
    color: colors.textSecondary,
    fontFamily: font.family,
    fontWeight: font.weightRegular,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
    textAlign: 'left',
    margin: '3px 14px 0',
  },
  helperError: { color: colors.error },
  helperDisabled: { color: colors.textDisabled },
})

/**
 * Outlined text field with a floating label (MUI `TextField`), on Base UI
 * Field: the label, helper text and invalid state are wired to the control
 * for assistive tech.
 */
export function TextField({
  label,
  helperText,
  error = false,
  required = false,
  disabled = false,
  size = 'medium',
  fullWidth = false,
  multiline = false,
  minRows = 1,
  maxRows,
  placeholder,
  xstyle,
  inputXstyle,
  value,
  onInput,
  ...inputProps
}: TextFieldProps) {
  const small = size === 'small'
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight)
    el.style.height = 'auto'
    let height = el.scrollHeight
    if (Number.isFinite(lineHeight)) {
      height = Math.max(height, lineHeight * minRows)
      if (maxRows) height = Math.min(height, lineHeight * maxRows)
    }
    el.style.height = `${height}px`
    el.style.overflowY = maxRows && el.scrollHeight > height ? 'auto' : 'hidden'
  }, [minRows, maxRows])

  // Grow with controlled value changes (uncontrolled typing goes via onInput).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the value changes
  useLayoutEffect(() => {
    if (multiline) resize()
  }, [multiline, resize, value])

  const labelText = label ? (
    <>
      {label}
      {required ? `${THIN_SPACE}*` : null}
    </>
  ) : null

  return (
    <Field.Root
      invalid={error}
      disabled={disabled}
      {...stylex.props(
        stylex.defaultMarker(),
        styles.root,
        fullWidth && styles.fullWidth,
        xstyle,
      )}
    >
      {labelText ? (
        <Field.Label
          {...stylex.props(
            styles.label,
            small && styles.labelSmall,
            error && styles.labelError,
            disabled && styles.labelDisabled,
          )}
        >
          {labelText}
        </Field.Label>
      ) : null}
      <div
        {...stylex.props(
          styles.inputBase,
          multiline &&
            (small
              ? styles.inputBaseMultilineSmall
              : styles.inputBaseMultiline),
          disabled && styles.inputBaseDisabled,
        )}
      >
        <Field.Control
          {...inputProps}
          value={value}
          required={required}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          onInput={(event) => {
            if (multiline) resize()
            onInput?.(event)
          }}
          render={
            multiline ? (
              <textarea ref={textareaRef} rows={minRows} />
            ) : undefined
          }
          {...stylex.props(
            styles.input,
            small && styles.inputSmall,
            Boolean(labelText) && styles.placeholderWithLabel,
            multiline && styles.textarea,
            inputXstyle,
          )}
        />
        <fieldset
          aria-hidden
          {...stylex.props(
            styles.outline,
            error && styles.outlineError,
            disabled && styles.outlineDisabled,
          )}
        >
          <legend
            {...stylex.props(styles.legend, !labelText && styles.legendEmpty)}
          >
            {labelText ? (
              <span {...stylex.props(styles.legendText)}>{labelText}</span>
            ) : (
              // No padding: keeps the legend's line box without a notch.
              <span>{ZERO_WIDTH_SPACE}</span>
            )}
          </legend>
        </fieldset>
      </div>
      {helperText ? (
        <Field.Description
          {...stylex.props(
            styles.helper,
            error && styles.helperError,
            disabled && styles.helperDisabled,
          )}
        >
          {helperText === ' ' ? ZERO_WIDTH_SPACE : helperText}
        </Field.Description>
      ) : null}
    </Field.Root>
  )
}
