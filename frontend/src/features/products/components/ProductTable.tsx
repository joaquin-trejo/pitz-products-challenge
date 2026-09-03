import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { Product } from '../product-types'
import { ProductStatusChip } from './ProductStatusChip'

const skuSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  color: 'text.secondary',
} as const

type ProductTableProps = {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Table aria-label="Products">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              hover
              sx={{ '&:last-child td': { borderBottom: 0 } }}
            >
              <TableCell>
                <Typography component="span" sx={{ fontWeight: 600, display: 'block' }}>
                  {product.name}
                </Typography>
                {product.description ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {product.description}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>
                <Typography component="span" sx={skuSx}>
                  {product.sku}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {product.price}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {product.stock}
                </Typography>
              </TableCell>
              <TableCell>
                <ProductStatusChip active={product.active} />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
