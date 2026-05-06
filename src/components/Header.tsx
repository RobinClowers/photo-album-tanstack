import { Typography, AppBar, Toolbar, IconButton } from '@mui/material'
import { Home } from '@mui/icons-material'
import { Link } from '@tanstack/react-router'

export function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton component={Link} to="/" edge="start" color="inherit" sx={{ mr: 2 }}>
          <Home />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Robin's Photos
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
