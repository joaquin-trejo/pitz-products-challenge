import { Pagination, Paper, Stack, Typography } from '@mui/material'
import type { ProductsMeta } from '../product-types'

type ProductsPaginationProps = {
  meta: ProductsMeta
  onPageChange: (page: number) => void
}

export function ProductsPagination({ meta, onPageChange }: ProductsPaginationProps) {
  const { page, per_page, total_pages, total_count } = meta

  if (total_count === 0 || total_pages === 0) {
    return null
  }

  const start = (page - 1) * per_page + 1
  const end = Math.min(page * per_page, total_count)

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {start}–{end} of {total_count}
        </Typography>
        <Pagination
          page={page}
          count={total_pages}
          onChange={(_event, nextPage) => onPageChange(nextPage)}
          aria-label="Product pagination"
          color="primary"
          shape="rounded"
          size="small"
        />
      </Stack>
    </Paper>
  )
}
