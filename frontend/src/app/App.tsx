import { Box, Container, Typography } from '@mui/material'

export function App() {
  return (
    <Box component="main" sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography component="h1" variant="h1">
          PITZ Products
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Frontend foundation is ready.
        </Typography>
      </Container>
    </Box>
  )
}
