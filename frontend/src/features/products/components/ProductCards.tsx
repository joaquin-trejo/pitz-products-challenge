import { Box, Paper, Stack, Typography } from '@mui/material'
import type { Product } from '../product-types'
import { ProductStatusChip } from './ProductStatusChip'

type ProductCardsProps = {
  products: Product[]
}

export function ProductCards({ products }: ProductCardsProps) {
  return (
    <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {products.map((product) => (
        <Box key={product.id} component="li">
          <Paper component="article" sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Typography component="h2" variant="h6">
                {product.name}
              </Typography>
              <ProductStatusChip active={product.active} />
            </Stack>
            {product.description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {product.description}
              </Typography>
            ) : null}
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              <Typography variant="body2">SKU: {product.sku}</Typography>
              <Typography variant="body2">Price: {product.price}</Typography>
              <Typography variant="body2">Stock: {product.stock}</Typography>
            </Stack>
          </Paper>
        </Box>
      ))}
    </Stack>
  )
}
