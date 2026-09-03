import {
  Paper,
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

type ProductTableProps = {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Products">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                {product.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell align="right">{product.price}</TableCell>
              <TableCell align="right">{product.stock}</TableCell>
              <TableCell>
                <ProductStatusChip active={product.active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
