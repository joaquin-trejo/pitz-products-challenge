import { Pagination, Stack, Typography } from '@mui/material'
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
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
      }}
    >
      <Typography color="text.secondary">
        Showing {start}–{end} of {total_count}
      </Typography>
      <Pagination
        page={page}
        count={total_pages}
        onChange={(_event, nextPage) => onPageChange(nextPage)}
        aria-label="Product pagination"
        color="primary"
        shape="rounded"
      />
    </Stack>
  )
}
