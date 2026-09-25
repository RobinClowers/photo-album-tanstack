import * as stylex from '@stylexjs/stylex'
import {
  createFileRoute,
  notFound,
  Link as RouterLink,
} from '@tanstack/react-router'
import { adminGetImport, adminRetryImport } from '@/api/admin-imports'
import {
  formatTimestamp,
  IMPORT_KIND_LABEL,
  ImportProgress,
  StatusChip,
} from '@/components/admin/ImportStatus'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { usePollWhile } from '@/components/admin/usePollWhile'
import {
  Alert,
  ArrowBackIcon,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
  Toast,
} from '@/components/ui'
import { breakpoints } from '@/styles/breakpoints.stylex'
import { colors, space } from '@/styles/tokens.stylex'
import { parseRecordId } from '@/utils/id'

export const Route = createFileRoute('/admin/imports/$id')({
  loader: async ({ params }) => {
    const id = parseRecordId(params.id)
    const record = id === null ? null : await adminGetImport({ data: { id } })
    if (!record) throw notFound()
    return { record }
  },
  notFoundComponent: () => (
    <Container xstyle={styles.notFound}>
      <Text>Import not found.</Text>
    </Container>
  ),
  component: ImportPage,
})

const styles = stylex.create({
  notFound: { paddingTop: space.s4, paddingBottom: space.s4 },
  page: { paddingTop: space.s3, paddingBottom: space.s3 },
  toolbar: { display: 'flex', alignItems: 'center', gap: space.s2 },
  grow: { flexGrow: 1 },
  summaryBox: { padding: space.s2 },
  summary: {
    alignItems: { default: null, [breakpoints.smUp]: 'center' },
  },
  error: { marginTop: space.s2 },
  lastError: {
    color: colors.error,
    fontFamily: 'monospace',
    fontSize: '12px',
    maxWidth: '480px',
    overflowWrap: 'anywhere',
  },
  nowrap: { whiteSpace: 'nowrap' },
})

function ImportPage() {
  const { record } = Route.useLoaderData()
  const { run, pending, error, clearError } = useAdminAction()
  usePollWhile(record.status === 'running')

  return (
    <Container maxWidth="lg" xstyle={styles.page}>
      <Stack gap={3}>
        <div {...stylex.props(styles.toolbar)}>
          <Button
            render={<RouterLink to="/admin/imports" />}
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            All imports
          </Button>
          <div {...stylex.props(styles.grow)} />
          {record.counts.failed > 0 && (
            <Button
              variant="contained"
              size="small"
              disabled={pending}
              onClick={() =>
                run(() => adminRetryImport({ data: { id: record.id } }))
              }
            >
              Retry {record.counts.failed} failed
            </Button>
          )}
        </div>

        <Paper variant="outlined" xstyle={styles.summaryBox}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={3}
            xstyle={styles.summary}
          >
            <div {...stylex.props(styles.grow)}>
              <Text variant="h6" as="h1">
                {IMPORT_KIND_LABEL[record.kind] ?? record.kind}
                {record.album && (
                  <>
                    {' · '}
                    <Link
                      to="/admin/albums/$id"
                      params={{ id: String(record.album.id) }}
                      color="inherit"
                    >
                      {record.album.title || record.album.slug}
                    </Link>
                  </>
                )}
              </Text>
              <Text variant="body2" color="textSecondary">
                Started {formatTimestamp(record.createdAt)}
                {record.finishedAt &&
                  `, finished ${formatTimestamp(record.finishedAt)}`}
              </Text>
            </div>
            <StatusChip status={record.status} />
            <ImportProgress counts={record.counts} />
          </Stack>
          {record.error && (
            <Alert severity="error" xstyle={styles.error}>
              {record.error}
            </Alert>
          )}
        </Paper>

        <TableContainer paper="elevation">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Attempts</TableCell>
                <TableCell>Last error</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {record.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.filename ?? item.photoId ?? '—'}</TableCell>
                  <TableCell>
                    <StatusChip status={item.status} />
                  </TableCell>
                  <TableCell align="right">{item.attempts}</TableCell>
                  <TableCell xstyle={styles.lastError}>
                    {item.lastError}
                  </TableCell>
                  <TableCell xstyle={styles.nowrap}>
                    {formatTimestamp(item.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Toast open={Boolean(error)} severity="error" onClose={clearError}>
        {error}
      </Toast>
    </Container>
  )
}
