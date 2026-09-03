import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

type ProductSaveConfirmationDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ProductSaveConfirmationDialog({
  open,
  mode,
  isSubmitting,
  onCancel,
  onConfirm,
}: ProductSaveConfirmationDialogProps) {
  const isCreate = mode === 'create'

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onCancel}
      aria-labelledby="product-save-confirmation-title"
      aria-describedby="product-save-confirmation-description"
    >
      <DialogTitle id="product-save-confirmation-title">
        {isCreate ? 'Confirm Create Product' : 'Confirm Save Changes'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="product-save-confirmation-description">
          {isCreate
            ? 'Create this product?'
            : 'Save changes to this product?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Saving…' : isCreate ? 'Create Product' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
