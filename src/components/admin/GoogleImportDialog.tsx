import { OpenInNew } from '@mui/icons-material'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { Link, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  adminCancelGooglePick,
  adminGoogleStatus,
  adminPollGooglePick,
  adminStartGooglePick,
  type PollPickResult,
} from '@/api/admin-google'
import type { PickPlan } from '@/server/pipeline/google-plan'

type Phase =
  | { kind: 'loading' }
  | { kind: 'disconnected' }
  | { kind: 'ready'; expiresAt: string }
  | { kind: 'starting' }
  | { kind: 'picking'; importId: number; pickerUri: string }
  | {
      kind: 'finished'
      importId: number
      result: Extract<PollPickResult, { status: 'running' | 'done' }>
    }
  | { kind: 'ended'; importId: number; message: string }
  | { kind: 'error'; message: string }

const connectUrl = (albumId: number) =>
  `/api/auth/google/photos?returnTo=${encodeURIComponent(`/admin/albums/${albumId}`)}`

/**
 * Drives a Google Photos import: connect the account if needed, open
 * Google's picker in a new tab, poll until the admin has finished choosing,
 * then hand off to the imports page once the items are queued.
 */
export function GoogleImportDialog({
  albumId,
  open,
  onClose,
}: {
  albumId: number
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current)
    pollTimer.current = null
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setPhase({ kind: 'loading' })
    adminGoogleStatus()
      .then((status) => {
        if (cancelled) return
        setPhase(
          status.status === 'connected'
            ? { kind: 'ready', expiresAt: status.expiresAt }
            : { kind: 'disconnected' },
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) setPhase({ kind: 'error', message: String(error) })
      })
    return () => {
      cancelled = true
      stopPolling()
    }
  }, [open, stopPolling])

  const poll = useCallback(
    (importId: number, pickerUri: string, delayMs: number) => {
      stopPolling()
      pollTimer.current = setTimeout(async () => {
        try {
          const result = await adminPollGooglePick({ data: { importId } })
          switch (result.status) {
            case 'picking':
              poll(importId, pickerUri, result.pollIntervalMs)
              return
            case 'running':
            case 'done':
              setPhase({ kind: 'finished', importId, result })
              void router.invalidate()
              return
            case 'reauth':
              setPhase({ kind: 'disconnected' })
              return
            case 'expired':
              setPhase({
                kind: 'ended',
                importId,
                message:
                  'The Google picker session expired before any photos were chosen.',
              })
              return
            default:
              setPhase({
                kind: 'ended',
                importId,
                message: `Import ${result.status}.`,
              })
          }
        } catch (error) {
          setPhase({ kind: 'error', message: String(error) })
        }
      }, delayMs)
    },
    [router, stopPolling],
  )

  const start = async () => {
    // Open the tab synchronously in the click handler so popup blockers allow
    // it; the picker URL is filled in once the server has created the session.
    const tab = window.open('', '_blank')
    setPhase({ kind: 'starting' })
    try {
      const result = await adminStartGooglePick({ data: { albumId } })
      if (result.status === 'reauth') {
        tab?.close()
        setPhase({ kind: 'disconnected' })
        return
      }
      if (tab) tab.location.href = result.pickerUri
      setPhase({
        kind: 'picking',
        importId: result.importId,
        pickerUri: result.pickerUri,
      })
      poll(result.importId, result.pickerUri, result.pollIntervalMs)
    } catch (error) {
      tab?.close()
      setPhase({ kind: 'error', message: String(error) })
    }
  }

  const cancel = async () => {
    if (phase.kind === 'picking') {
      stopPolling()
      await adminCancelGooglePick({ data: { importId: phase.importId } }).catch(
        () => {},
      )
      void router.invalidate()
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={cancel} maxWidth="sm" fullWidth>
      <DialogTitle>Import from Google Photos</DialogTitle>
      <DialogContent>
        {phase.kind === 'loading' && <CircularProgress size={24} />}

        {phase.kind === 'disconnected' && (
          <Stack spacing={2}>
            <DialogContentText>
              Connect your Google account with permission to read the photos you
              pick. Google will ask you to confirm; you are sent back here
              afterwards.
            </DialogContentText>
            <Button
              variant="contained"
              component="a"
              href={connectUrl(albumId)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Connect Google Photos
            </Button>
          </Stack>
        )}

        {(phase.kind === 'ready' || phase.kind === 'starting') && (
          <Stack spacing={2}>
            <DialogContentText>
              Google Photos opens in a new tab where you choose the photos to
              add to this album. Videos and duplicates of photos already in the
              album are skipped. Come back to this tab when you are done.
            </DialogContentText>
            <Button
              variant="contained"
              onClick={start}
              disabled={phase.kind === 'starting'}
              endIcon={<OpenInNew />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Choose photos in Google Photos
            </Button>
          </Stack>
        )}

        {phase.kind === 'picking' && (
          <Stack spacing={2} direction="row" alignItems="center">
            <CircularProgress size={20} />
            <Typography>
              Waiting for you to finish picking in the Google Photos tab.{' '}
              <MuiLink href={phase.pickerUri} target="_blank" rel="noreferrer">
                Open it again
              </MuiLink>{' '}
              if it did not appear.
            </Typography>
          </Stack>
        )}

        {phase.kind === 'finished' && (
          <Stack spacing={1}>
            <Alert severity={phase.result.queued ? 'success' : 'info'}>
              {phase.result.queued
                ? `${phase.result.queued} photo${phase.result.queued === 1 ? '' : 's'} queued for import.`
                : 'Nothing new to import.'}
            </Alert>
            <SkippedSummary skipped={phase.result.skipped} />
            <Typography variant="body2">
              Progress is on the{' '}
              <Link
                to="/admin/imports/$id"
                params={{ id: String(phase.importId) }}
              >
                import page
              </Link>
              .
            </Typography>
          </Stack>
        )}

        {phase.kind === 'ended' && (
          <Alert severity="warning">{phase.message}</Alert>
        )}
        {phase.kind === 'error' && (
          <Alert severity="error">{phase.message}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel}>
          {phase.kind === 'picking' ? 'Cancel import' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SkippedSummary({ skipped }: { skipped: PickPlan['skipped'] }) {
  const parts = [
    skipped.existingById
      ? `${skipped.existingById} already in the album (same Google id)`
      : null,
    skipped.existingByFilename
      ? `${skipped.existingByFilename} already in the album (same filename)`
      : null,
    skipped.unsupported ? `${skipped.unsupported} not a supported photo` : null,
    skipped.duplicateFilename
      ? `${skipped.duplicateFilename} duplicate filename${skipped.duplicateFilename === 1 ? '' : 's'}`
      : null,
  ].filter((p): p is string => p !== null)
  if (parts.length === 0) return null
  return (
    <Typography variant="body2" color="text.secondary">
      Skipped: {parts.join(', ')}.
    </Typography>
  )
}
