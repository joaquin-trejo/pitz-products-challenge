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
      variant="outlined"
      aria-label={`Status: ${label}`}
      sx={{
        bgcolor: active ? 'rgba(46, 125, 50, 0.08)' : 'action.hover',
        borderColor: active ? 'success.light' : 'divider',
        color: active ? 'success.dark' : 'text.secondary',
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  )
}
