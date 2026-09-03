import {
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'

type ProductsLoadingProps = {
  isBelowMd: boolean
}

export function ProductsLoading({ isBelowMd }: ProductsLoadingProps) {
  if (isBelowMd) {
    return (
      <Stack spacing={2} role="status" aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={148} />
        ))}
      </Stack>
    )
  }

  return (
    <TableContainer component={Paper} role="status" aria-busy="true" aria-label="Loading products">
      <Table>
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
          {Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={5}>
                <Skeleton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
