import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import type { Product } from '../product-types'

type ProductDeleteConfirmationDialogProps = {
  product: Product | null
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

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
    >
      <DialogTitle id="product-delete-confirmation-title">Delete Product</DialogTitle>
      <DialogContent>
        {product ? (
          <DialogContentText id="product-delete-confirmation-description">
            Delete &quot;{product.name}&quot;?
            <br />
            This action cannot be undone.
          </DialogContentText>
        ) : null}
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
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
