import { Chip } from '@mui/material'

type ProductStatusChipProps = {
  active: boolean
}

export function ProductStatusChip({ active }: ProductStatusChipProps) {
  const label = active ? 'Active' : 'Inactive'

  return (
    <Chip
      size="small"
      label={label}
      color={active ? 'success' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      aria-label={`Status: ${label}`}
    />
  )
}
