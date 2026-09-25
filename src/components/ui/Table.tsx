import * as stylex from '@stylexjs/stylex'
import { type ComponentProps, createContext, useContext } from 'react'
import {
  colors,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from '@/styles/tokens.stylex'
import { paperStyles } from './Paper'

type Section = 'head' | 'body'
type Size = 'small' | 'medium'

const SizeContext = createContext<Size>('medium')
const SectionContext = createContext<Section>('body')

type Props<Tag extends keyof React.JSX.IntrinsicElements> = Omit<
  ComponentProps<Tag>,
  'className' | 'style'
> & { xstyle?: stylex.StyleXStyles }

const styles = stylex.create({
  container: { width: '100%', overflowX: 'auto' },
  table: {
    display: 'table',
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },
  row: {
    color: 'inherit',
    display: 'table-row',
    verticalAlign: 'middle',
    outlineWidth: 0,
  },
  rowHover: {
    backgroundColor: { default: null, ':hover': colors.actionHover },
  },
  cell: {
    fontFamily: font.family,
    fontSize: fontSize.body2,
    lineHeight: lineHeight.body2,
    letterSpacing: letterSpacing.body2,
    fontWeight: fontWeight.body2,
    display: 'table-cell',
    verticalAlign: 'inherit',
    textAlign: 'left',
    padding: '16px',
    color: colors.textPrimary,
    // MUI: lighten(alpha(divider, 1), 0.88)
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.grey300,
  },
  head: { lineHeight: '1.5rem', fontWeight: font.weightMedium },
  small: { padding: '6px 16px' },
  checkbox: { width: '48px', padding: '0 0 0 4px' },
  // MUI's small-size `&.MuiTableCell-paddingCheckbox` rule, which beats the
  // plain checkbox rule. (MUI also zeroes its children's padding; the app's
  // checkbox cells hold an Avatar, which has none.)
  checkboxSmall: { width: '24px', padding: '0 12px 0 16px' },
  none: { padding: 0 },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
})

export interface TableContainerProps extends Props<'div'> {
  /**
   * Draw it as a Paper (MUI `<TableContainer component={Paper}>`):
   * `elevation` casts a shadow, `outlined` draws a border. Default: plain.
   */
  paper?: 'elevation' | 'outlined' | undefined
}

/** Horizontally scrollable wrapper for a Table. */
export function TableContainer({
  paper,
  xstyle,
  ...props
}: TableContainerProps) {
  return (
    <div
      {...props}
      {...stylex.props(paper && paperStyles(paper), styles.container, xstyle)}
    />
  )
}

export interface TableProps extends Props<'table'> {
  /** `small` uses 6px vertical cell padding. Default `medium`. */
  size?: Size | undefined
}

/** Plain HTML table styled like MUI `Table`. */
export function Table({ size = 'medium', xstyle, ...props }: TableProps) {
  return (
    <SizeContext.Provider value={size}>
      <table {...props} {...stylex.props(styles.table, xstyle)} />
    </SizeContext.Provider>
  )
}

export function TableHead({ xstyle, ...props }: Props<'thead'>) {
  return (
    <SectionContext.Provider value="head">
      <thead {...props} {...stylex.props(xstyle)} />
    </SectionContext.Provider>
  )
}

export function TableBody({ xstyle, ...props }: Props<'tbody'>) {
  return (
    <SectionContext.Provider value="body">
      <tbody {...props} {...stylex.props(xstyle)} />
    </SectionContext.Provider>
  )
}

export interface TableRowProps extends Props<'tr'> {
  /** Highlight on hover. */
  hover?: boolean | undefined
}

export function TableRow({ hover = false, xstyle, ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      {...stylex.props(styles.row, hover && styles.rowHover, xstyle)}
    />
  )
}

export interface TableCellProps
  extends Props<'td'>,
    Pick<ComponentProps<'th'>, 'scope'> {
  align?: 'left' | 'center' | 'right' | undefined
  /** `checkbox`: a 48px column for a leading control or thumbnail. */
  padding?: 'normal' | 'checkbox' | 'none' | undefined
}

/** `<th>` inside TableHead, `<td>` in TableBody. */
export function TableCell({
  align,
  padding = 'normal',
  xstyle,
  ...props
}: TableCellProps) {
  const size = useContext(SizeContext)
  const section = useContext(SectionContext)
  const Tag = section === 'head' ? 'th' : 'td'
  return (
    <Tag
      scope={section === 'head' ? 'col' : undefined}
      {...props}
      {...stylex.props(
        styles.cell,
        section === 'head' && styles.head,
        size === 'small' && styles.small,
        padding === 'checkbox' && styles.checkbox,
        padding === 'checkbox' && size === 'small' && styles.checkboxSmall,
        padding === 'none' && styles.none,
        align && styles[align],
        xstyle,
      )}
    />
  )
}
