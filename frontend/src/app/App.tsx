import { Box } from '@mui/material'
import { ProductsPage } from '../features/products/components/ProductsPage'

export function App() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 3, md: 4 },
        bgcolor: 'background.default',
      }}
    >
      <ProductsPage />
    </Box>
  )
}
