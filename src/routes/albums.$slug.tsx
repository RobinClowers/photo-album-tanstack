import { Box } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/albums/$slug')({
  component: Album,
})

function Album() {
  return <Box sx={{ flexGrow: 1 }}>TODO</Box>
}
