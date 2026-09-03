import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
} from '@mui/material'

type ProductSaveConfirmationDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  productName: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ProductSaveConfirmationDialog({
  open,
  mode,
  productName,
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
      <DialogTitle id="product-save-confirmation-title" sx={{ pb: 1.5 }}>
        {isCreate ? 'Confirm Create Product' : 'Confirm Save Changes'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <DialogContentText id="product-save-confirmation-description">
          {isCreate
            ? `Create "${productName}"?`
            : `Save changes to "${productName}"?`}
        </DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
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
