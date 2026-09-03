import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { Product } from '../product-types'

type ProductDeleteConfirmationDialogProps = {
  product: Product | null
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

const skuValueSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  color: 'text.secondary',
  fontWeight: 500,
} as const

export function ProductDeleteConfirmationDialog({
  product,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: ProductDeleteConfirmationDialogProps) {
  const open = product !== null

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onCancel}
      fullWidth
      maxWidth="xs"
      aria-labelledby="product-delete-confirmation-title"
      aria-describedby="product-delete-confirmation-description"
      slotProps={{
        paper: {
          sx: {
            m: 2,
            width: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <DialogTitle
        id="product-delete-confirmation-title"
        sx={{
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'error.main',
        }}
      >
        <WarningAmberOutlinedIcon aria-hidden fontSize="small" color="error" />
        Delete Product
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {product ? (
          <DialogContentText
            id="product-delete-confirmation-description"
            component="div"
          >
            <Typography component="p" variant="body1" color="text.primary" sx={{ m: 0 }}>
              Delete &quot;{product.name}&quot;?
            </Typography>
            <Typography component="p" variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0 }}>
              This action cannot be undone. The product will be permanently removed.
            </Typography>
          </DialogContentText>
        ) : null}

        {product ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontWeight: 500 }}
                >
                  SKU
                </Typography>
                <Typography component="span" sx={{ display: 'block', mt: 0.25, ...skuValueSx }}>
                  {product.sku}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', fontWeight: 500 }}
                >
                  Stock
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    display: 'block',
                    mt: 0.25,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {product.stock}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <Divider />
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isDeleting ? 'Deleting…' : 'Delete Product'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
