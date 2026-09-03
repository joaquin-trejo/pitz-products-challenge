import { Paper, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { ProductStatusFilter } from '../product-types'

type ProductFiltersProps = {
  searchValue: string
  statusFilter: ProductStatusFilter
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: ProductStatusFilter) => void
}

export function ProductFilters({
  searchValue,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: ProductFiltersProps) {
  return (
    <Paper
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
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' } }}
      >
        <TextField
          label="Search products"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          fullWidth
          size="small"
          sx={{ flex: 1 }}
        />
        <ToggleButtonGroup
          exclusive
          color="primary"
          size="small"
          value={statusFilter}
          onChange={(_event, value: ProductStatusFilter | null) => {
            if (value == null) {
              return
            }

            onStatusFilterChange(value)
          }}
          aria-label="Filter by status"
          sx={{
            width: { xs: '100%', sm: 'auto' },
            '& .MuiToggleButton-root': {
              flex: { xs: 1, sm: 'none' },
              px: 1.5,
              py: 0.75,
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Paper>
  )
}
