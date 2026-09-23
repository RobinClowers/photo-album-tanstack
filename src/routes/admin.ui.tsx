import * as stylex from '@stylexjs/stylex'
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { type ReactNode, useState } from 'react'
import {
  Alert,
  Anchor,
  ArrowBackIcon,
  ArrowBackIosNewIcon,
  ArrowDropDownIcon,
  ArrowForwardIosIcon,
  Avatar,
  Button,
  type ButtonVariant,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  CloseIcon,
  Container,
  DeleteIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ErrorOutlineIcon,
  GoogleIcon,
  HomeIcon,
  IconButton,
  InfoOutlinedIcon,
  LinearProgress,
  Link,
  Menu,
  MenuItem,
  OpenInNewIcon,
  Paper,
  PersonIcon,
  RefreshIcon,
  ReportProblemOutlinedIcon,
  Stack,
  StarBorderIcon,
  StarIcon,
  SuccessOutlinedIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
  TextField,
  type TextVariant,
  Toast,
  ToastProvider,
  type ToneColor,
  Tooltip,
  useToast,
} from '@/components/ui'
import { colors, space } from '@/styles/tokens.stylex'

/**
 * Kitchen sink for the StyleX + Base UI primitives in src/components/ui:
 * every component and variant on one page, for manual and visual testing.
 */
export const Route = createFileRoute('/admin/ui')({
  head: () => ({ meta: [{ title: 'UI primitives' }] }),
  component: KitchenSink,
})

const TEXT_VARIANTS: TextVariant[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'caption',
  'overline',
]
const BUTTON_VARIANTS: ButtonVariant[] = ['text', 'outlined', 'contained']
const COLORS: ToneColor[] = [
  'primary',
  'secondary',
  'error',
  'warning',
  'info',
  'success',
  'inherit',
]
const ICONS = {
  HomeIcon,
  ArrowBackIcon,
  ArrowBackIosNewIcon,
  ArrowForwardIosIcon,
  OpenInNewIcon,
  StarBorderIcon,
  StarIcon,
  RefreshIcon,
  GoogleIcon,
  DeleteIcon,
  ArrowDropDownIcon,
  CloseIcon,
  SuccessOutlinedIcon,
  InfoOutlinedIcon,
  ReportProblemOutlinedIcon,
  ErrorOutlineIcon,
  PersonIcon,
}

const styles = stylex.create({
  page: { paddingTop: space.s4, paddingBottom: space.s8 },
  section: { padding: space.s2 },
  swatch: {
    padding: space.s1,
    backgroundColor: colors.grey100,
    borderRadius: '4px',
  },
  dark: {
    padding: space.s1,
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: '4px',
  },
  grow: { flex: '1 1 240px' },
  card: { width: '240px' },
  cardTitle: { marginTop: space.s1, marginBottom: space.s1 },
  iconLabel: { width: '120px' },
  wide: { width: '100%' },
})

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper render={<section />} xstyle={styles.section}>
      <Text variant="h5" as="h2" gutterBottom>
        {title}
      </Text>
      <Stack gap={2}>{children}</Stack>
    </Paper>
  )
}

function KitchenSink() {
  return (
    <ToastProvider>
      <Container maxWidth="lg" xstyle={styles.page}>
        <Stack gap={4}>
          <div>
            <Text variant="h4" as="h1" gutterBottom>
              UI primitives
            </Text>
            <Text color="textSecondary">
              StyleX + Base UI replacements for the MUI components, in every
              variant. Compare against MUI's defaults.
            </Text>
          </div>
          <TypographySection />
          <ButtonSection />
          <IconButtonSection />
          <IconSection />
          <ChipSection />
          <AlertSection />
          <SurfaceSection />
          <LayoutSection />
          <TextFieldSection />
          <TableSection />
          <ProgressSection />
          <AvatarLinkSection />
          <OverlaySection />
          <ToastSection />
        </Stack>
      </Container>
    </ToastProvider>
  )
}

function TypographySection() {
  return (
    <Section title="Text">
      {TEXT_VARIANTS.map((variant) => (
        <Text key={variant} variant={variant} noWrap>
          {variant}: The quick brown fox jumps over the lazy dog
        </Text>
      ))}
      <Stack direction="row" gap={2} wrap>
        <Text color="textPrimary">textPrimary</Text>
        <Text color="textSecondary">textSecondary</Text>
        <Text color="textDisabled">textDisabled</Text>
        <Text color="primary">primary</Text>
        <Text color="secondary">secondary</Text>
        <Text color="error">error</Text>
        <Text color="warning">warning</Text>
        <Text color="info">info</Text>
        <Text color="success">success</Text>
      </Stack>
      <Text align="center" paragraph>
        Centered paragraph with 16px bottom margin.
      </Text>
      <Text variant="subtitle1" render={<RouterLink to="/admin" />}>
        Text rendered as a router Link
      </Text>
    </Section>
  )
}

function ButtonSection() {
  return (
    <Section title="Button">
      {BUTTON_VARIANTS.map((variant) => (
        <Stack key={variant} direction="row" gap={1} wrap align="center">
          {COLORS.map((color) => (
            <Button key={color} variant={variant} color={color}>
              {color}
            </Button>
          ))}
          <Button variant={variant} disabled>
            disabled
          </Button>
        </Stack>
      ))}
      <Stack direction="row" gap={1} wrap align="center">
        {BUTTON_VARIANTS.map((variant) => (
          <Stack key={variant} direction="row" gap={1} align="center">
            <Button variant={variant} size="small">
              small
            </Button>
            <Button variant={variant}>medium</Button>
            <Button variant={variant} size="large">
              large
            </Button>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" gap={1} wrap align="center">
        <Button variant="contained" startIcon={<GoogleIcon />}>
          Sign in with Google
        </Button>
        <Button endIcon={<OpenInNewIcon />} size="small">
          View public page
        </Button>
        <Button variant="outlined" endIcon={<ArrowDropDownIcon />}>
          Reprocess variants
        </Button>
        <Button render={<RouterLink to="/admin/imports" />} color="inherit">
          Router link
        </Button>
        <Button
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          variant="contained"
        >
          Anchor
        </Button>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <Button type="submit" size="small" variant="outlined">
            Submit
          </Button>
        </form>
      </Stack>
      <Button variant="contained" fullWidth>
        Full width
      </Button>
      <Stack direction="row" gap={1} align="center" xstyle={styles.dark}>
        <Button color="inherit">Inherit on primary</Button>
        <Button color="inherit" variant="outlined">
          Outlined inherit
        </Button>
      </Stack>
    </Section>
  )
}

function IconButtonSection() {
  return (
    <Section title="IconButton">
      <Stack direction="row" gap={1} wrap align="center">
        <IconButton aria-label="default">
          <DeleteIcon />
        </IconButton>
        {COLORS.map((color) => (
          <IconButton key={color} aria-label={color} color={color}>
            <StarIcon />
          </IconButton>
        ))}
        <IconButton aria-label="disabled" disabled>
          <DeleteIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" gap={1} align="center">
        <IconButton aria-label="small" size="small">
          <RefreshIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label="medium">
          <RefreshIcon />
        </IconButton>
        <IconButton aria-label="large" size="large">
          <ArrowForwardIosIcon fontSize="large" />
        </IconButton>
        <IconButton aria-label="Home" render={<RouterLink to="/" />} edge="end">
          <HomeIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" gap={1} align="center" xstyle={styles.dark}>
        <IconButton aria-label="Home" color="inherit" edge="start">
          <HomeIcon />
        </IconButton>
        <Text variant="h6" as="div">
          Header-style inherit icon button
        </Text>
      </Stack>
    </Section>
  )
}

function IconSection() {
  return (
    <Section title="Icons">
      <Stack direction="row" gap={2} wrap>
        {Object.entries(ICONS).map(([name, IconComponent]) => (
          <Stack key={name} align="center" gap={0.5} xstyle={styles.iconLabel}>
            <IconComponent />
            <Text variant="caption" color="textSecondary">
              {name.replace(/Icon$/, '')}
            </Text>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" gap={2} align="center">
        <StarIcon fontSize="small" />
        <StarIcon />
        <StarIcon fontSize="large" />
        <Text variant="h4" as="span">
          <StarIcon fontSize="inherit" /> inherit
        </Text>
      </Stack>
    </Section>
  )
}

function ChipSection() {
  const chipColors = [
    'default',
    'primary',
    'secondary',
    'error',
    'warning',
    'info',
    'success',
  ] as const
  return (
    <Section title="Chip">
      {(['filled', 'outlined'] as const).map((variant) => (
        <Stack key={variant} direction="row" gap={1} wrap align="center">
          {chipColors.map((color) => (
            <Chip key={color} label={color} color={color} variant={variant} />
          ))}
          {chipColors.map((color) => (
            <Chip
              key={`${color}-small`}
              label={color}
              color={color}
              variant={variant}
              size="small"
            />
          ))}
        </Stack>
      ))}
    </Section>
  )
}

function AlertSection() {
  const [open, setOpen] = useState(true)
  return (
    <Section title="Alert">
      <Alert severity="success">1 photo queued for import.</Alert>
      <Alert severity="info">Nothing new to import.</Alert>
      <Alert severity="warning">
        The Google picker session expired before any photos were chosen.
      </Alert>
      <Alert severity="error">
        That Google account is not an administrator.
      </Alert>
      {open ? (
        <Alert severity="error" onClose={() => setOpen(false)}>
          Closable alert
        </Alert>
      ) : (
        <Button onClick={() => setOpen(true)}>Show closable alert</Button>
      )}
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small">
            Undo
          </Button>
        }
      >
        Alert with an action
      </Alert>
      <Alert icon={false} severity="success">
        No icon
      </Alert>
    </Section>
  )
}

function SurfaceSection() {
  return (
    <Section title="Paper and Card">
      <Stack direction="row" gap={3} wrap>
        {([0, 1, 2, 4, 8, 16, 24] as const).map((level) => (
          <Paper key={level} elevation={level} xstyle={styles.section}>
            elevation {level}
          </Paper>
        ))}
        <Paper variant="outlined" xstyle={styles.section}>
          outlined
        </Paper>
        <Paper square xstyle={styles.section}>
          square
        </Paper>
      </Stack>
      <Stack direction="row" gap={3} wrap>
        <Card xstyle={styles.card}>
          <CardMedia
            src="/favicon.ico"
            alt="Placeholder"
            height={180}
            width={240}
          />
          <Text variant="h6" as="h3" align="center" xstyle={styles.cardTitle}>
            Album card
          </Text>
        </Card>
        <Card variant="outlined" xstyle={styles.card}>
          <CardContent>
            <Text variant="body2" color="textSecondary">
              Outlined card with content and actions.
            </Text>
          </CardContent>
          <CardActions>
            <IconButton aria-label="Use as cover" size="small">
              <StarBorderIcon />
            </IconButton>
            <Button size="small">Action</Button>
          </CardActions>
        </Card>
      </Stack>
    </Section>
  )
}

function LayoutSection() {
  return (
    <Section title="Container and Stack">
      {(['xs', 'sm', 'md'] as const).map((maxWidth) => (
        <Container key={maxWidth} maxWidth={maxWidth} xstyle={styles.swatch}>
          <Text variant="body2">Container maxWidth="{maxWidth}"</Text>
        </Container>
      ))}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1, md: 3 }}
        xstyle={styles.swatch}
      >
        <Text>Responsive stack:</Text>
        <Text>column on xs,</Text>
        <Text>row from sm,</Text>
        <Text>wider gap from md</Text>
      </Stack>
      <Stack
        direction="row"
        justify="space-between"
        align="center"
        xstyle={styles.swatch}
      >
        <Text>space-between</Text>
        <Text>centered</Text>
      </Stack>
    </Section>
  )
}

function TextFieldSection() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('Not A Slug')
  const [caption, setCaption] = useState('')
  const slugError = !/^[a-z0-9-]*$/.test(slug)
  return (
    <Section title="TextField">
      <Stack direction="row" gap={2} wrap>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="small"
          xstyle={styles.grow}
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          size="small"
          error={slugError}
          helperText={slugError ? 'Lowercase letters, numbers and dashes' : ' '}
          xstyle={styles.grow}
        />
      </Stack>
      <Stack direction="row" gap={2} wrap>
        <TextField label="Medium" xstyle={styles.grow} />
        <TextField
          label="With helper"
          helperText="Helper text"
          xstyle={styles.grow}
        />
        <TextField
          label="Disabled"
          defaultValue="Can't touch this"
          disabled
          xstyle={styles.grow}
        />
      </Stack>
      <TextField
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (multiline, 1-4 rows)"
        size="small"
        multiline
        minRows={1}
        maxRows={4}
        fullWidth
        maxLength={500}
      />
    </Section>
  )
}

function TableSection() {
  const rows = [
    { id: 1, title: 'Summer 2026', slug: 'summer-2026', photos: 42 },
    { id: 2, title: 'Winter', slug: 'winter', photos: 7 },
  ]
  return (
    <Section title="Table">
      <TableContainer paper="elevation">
        <Table size="small" aria-label="Example albums">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Title</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell align="right">Photos</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell padding="checkbox">
                  <Avatar variant="rounded" />
                </TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>
                  <Text variant="body2" color="textSecondary">
                    {row.slug}
                  </Text>
                </TableCell>
                <TableCell align="right">{row.photos}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined">
                    Unpublish
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer paper="outlined">
        <Table aria-label="Medium table">
          <TableBody>
            <TableRow hover>
              <TableCell>Medium size</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label="done"
                  color="success"
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}

function ProgressSection() {
  const [value, setValue] = useState(40)
  return (
    <Section title="Progress">
      <LinearProgress value={value} aria-label="Determinate" />
      <LinearProgress value={value} color="error" aria-label="Error" />
      <LinearProgress aria-label="Indeterminate" />
      <Stack direction="row" gap={3} align="center">
        <CircularProgress aria-label="Loading" />
        <CircularProgress size={24} aria-label="Small" />
        <CircularProgress size={20} color="secondary" aria-label="Secondary" />
        <CircularProgress value={value} aria-label="Determinate ring" />
        <Button
          size="small"
          variant="outlined"
          onClick={() => setValue((v) => (v >= 100 ? 0 : v + 20))}
        >
          Value: {value}
        </Button>
      </Stack>
    </Section>
  )
}

function AvatarLinkSection() {
  return (
    <Section title="Avatar and Link">
      <Stack direction="row" gap={2} align="center">
        <Avatar />
        <Avatar>RC</Avatar>
        <Avatar variant="rounded" src="/favicon.ico" alt="" />
        <Avatar variant="square" src="/missing.jpg" alt="" />
      </Stack>
      <Text>
        A <Link to="/admin/imports">router link</Link>, an{' '}
        <Anchor href="https://example.com" target="_blank" rel="noreferrer">
          external anchor
        </Anchor>
        , a{' '}
        <Link to="/admin" underline="hover" color="textSecondary">
          hover-underlined link
        </Link>{' '}
        and an{' '}
        <Anchor href="/privacy" color="inherit" underline="none">
          unstyled one
        </Anchor>
        .
      </Text>
    </Section>
  )
}

function OverlaySection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [choice, setChoice] = useState('nothing yet')
  return (
    <Section title="Dialog, Menu and Tooltip">
      <Stack direction="row" gap={2} align="center" wrap>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Menu
          trigger={
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowDropDownIcon />}
            >
              Reprocess variants
            </Button>
          }
        >
          <MenuItem onClick={() => setChoice('missing sizes')}>
            Generate missing sizes only
          </MenuItem>
          <MenuItem onClick={() => setChoice('every size')}>
            Regenerate every size
          </MenuItem>
          <MenuItem disabled>Disabled item</MenuItem>
        </Menu>
        <Text variant="body2" color="textSecondary">
          Menu choice: {choice}
        </Text>
        <Tooltip title="Use as cover">
          <IconButton aria-label="Use as cover" size="small" color="warning">
            <StarIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Regenerate size variants" placement="top">
          <IconButton aria-label="Regenerate size variants" size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tooltip on a text button">
          <Button>Hover me</Button>
        </Tooltip>
      </Stack>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import from Google Photos</DialogTitle>
        <DialogContent>
          <Stack gap={2}>
            <DialogContentText>
              Google Photos opens in a new tab where you choose the photos to
              add to this album.
            </DialogContentText>
            <Stack direction="row" gap={2} align="center">
              <CircularProgress size={20} aria-label="Waiting" />
              <Text>Waiting for you to finish picking.</Text>
            </Stack>
            <Alert severity="info">Nothing new to import.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Section>
  )
}

function ToastSection() {
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  return (
    <Section title="Toast">
      <Stack direction="row" gap={1} wrap>
        <Button
          variant="outlined"
          onClick={() =>
            toast.show({ message: 'Album saved.', severity: 'success' })
          }
        >
          Success toast (5s)
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={() =>
            toast.show({
              message: 'Google Photos was not connected.',
              severity: 'warning',
              timeout: 6000,
            })
          }
        >
          Warning toast (6s)
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setError('Failed to save the caption.')}
        >
          Declarative error toast (sticky)
        </Button>
      </Stack>
      <Toast
        open={Boolean(error)}
        severity="error"
        onClose={() => setError(null)}
      >
        {error}
      </Toast>
      <Text variant="body2" color="textSecondary">
        Declarative error state: {error ?? 'none'}
      </Text>
    </Section>
  )
}
