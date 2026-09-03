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

const outlinedPaperSx = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  bgcolor: 'background.paper',
} as const

export function ProductsLoading({ isBelowMd }: ProductsLoadingProps) {
  if (isBelowMd) {
    return (
      <Stack spacing={2} role="status" aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 3 }, (_, index) => (
          <Paper key={index} elevation={0} sx={{ ...outlinedPaperSx, p: 2 }}>
            <Skeleton variant="text" width="55%" height={28} />
            <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
            <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
            <Skeleton variant="text" width="35%" />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" width={72} height={28} />
              <Skeleton variant="rounded" width={80} height={28} />
            </Stack>
          </Paper>
        ))}
      </Stack>
    )
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      role="status"
      aria-busy="true"
      aria-label="Loading products"
      sx={outlinedPaperSx}
    >
      <Table>
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
          {Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={6}>
                <Skeleton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
