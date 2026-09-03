import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import type { Product } from '../product-types'
import { ProductStatusChip } from './ProductStatusChip'

const skuValueSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  color: 'text.secondary',
  fontWeight: 500,
} as const

const numericValueSx = {
  fontVariantNumeric: 'tabular-nums',
  fontSize: '0.875rem',
  fontWeight: 500,
} as const

type ProductCardsProps = {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

function MetadataItem({
  label,
  value,
  valueSx,
}: {
  label: string
  value: string | number
  valueSx?: object
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ display: 'block', mt: 0.25, ...valueSx }}>
        {value}
      </Typography>
    </Box>
  )
}

export function ProductCards({ products, onEdit, onDelete }: ProductCardsProps) {
  return (
    <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {products.map((product) => (
        <Box key={product.id} component="li">
          <Paper
            component="article"
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {product.description}
              </Typography>
            ) : null}

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr 1fr',
                  sm: '1fr 1fr 1fr',
                },
              }}
            >
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                <MetadataItem label="SKU" value={product.sku} valueSx={skuValueSx} />
              </Box>
              <MetadataItem label="Price" value={product.price} valueSx={numericValueSx} />
              <MetadataItem label="Stock" value={product.stock} valueSx={numericValueSx} />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                size="small"
                startIcon={<EditOutlinedIcon fontSize="small" />}
                onClick={() => onEdit(product)}
                aria-label={`Edit ${product.name}`}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlinedIcon fontSize="small" />}
                onClick={() => onDelete(product)}
                aria-label={`Delete ${product.name}`}
              >
                Delete
              </Button>
            </Stack>
          </Paper>
        </Box>
      ))}
    </Stack>
  )
}
