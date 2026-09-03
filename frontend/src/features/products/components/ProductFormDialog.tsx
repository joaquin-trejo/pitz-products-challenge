import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ApiError } from '../../../api/api-error'
import { useCreateProductMutation, useUpdateProductMutation } from '../api/product-mutations'
import type { Product, ProductInput } from '../product-types'
import {
  CREATE_PRODUCT_DEFAULTS,
  isProductFormField,
  productFormSchema,
  productToFormValues,
  toProductInput,
  type ProductFormValues,
} from '../validation/product-form-schema'
import { ProductSaveConfirmationDialog } from './ProductSaveConfirmationDialog'

export type ProductFormMode =
  | { type: 'create' }
  | { type: 'edit'; product: Product }

type ProductFormDialogProps = {
  open: boolean
  mode: ProductFormMode | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function ProductFormDialog({ open, mode, onClose, onSuccess }: ProductFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<ProductInput | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode?.type === 'edit'
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: 'onTouched',
    defaultValues: CREATE_PRODUCT_DEFAULTS,
  })

  useEffect(() => {
    if (!open || !mode) {
      return
    }

    /* Intentional dialog session reset when Create/Edit opens. */
    /* eslint-disable react-hooks/set-state-in-effect -- open/mode-driven form session reset */
    setConfirmOpen(false)
    setPendingPayload(null)
    setFormError(null)
    createMutation.reset()
    updateMutation.reset()

    if (mode.type === 'edit') {
      reset(productToFormValues(mode.product))
    } else {
      reset(CREATE_PRODUCT_DEFAULTS)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open/mode-driven reset
  }, [open, mode, reset])

  function handleValidSubmit(values: ProductFormValues) {
    setFormError(null)
    clearErrors()
    setPendingPayload(toProductInput(values))
    setConfirmOpen(true)
  }

  function handleCancelConfirmation() {
    if (isSubmitting) {
      return
    }

    setConfirmOpen(false)
    setPendingPayload(null)
  }

  function applyServerErrors(error: ApiError) {
    const fieldErrors = error.errors ?? {}
    let mappedKnown = false
    let hasUnknown = false

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const message = messages[0]
      if (!message) {
        continue
      }

      if (isProductFormField(field)) {
        setError(field, { type: 'server', message })
        mappedKnown = true
      } else {
        hasUnknown = true
      }
    }

    if (!mappedKnown || hasUnknown) {
      setFormError(
        hasUnknown
          ? 'Unable to save. Please review the form and try again.'
          : error.message || 'Unable to save product.',
      )
    }
  }

  async function handleConfirmSave() {
    if (!pendingPayload || !mode || isSubmitting) {
      return
    }

    setFormError(null)

    try {
      if (mode.type === 'create') {
        await createMutation.mutateAsync(pendingPayload)
        setConfirmOpen(false)
        setPendingPayload(null)
        onSuccess('Product created successfully.')
        onClose()
        return
      }

      await updateMutation.mutateAsync({
        id: mode.product.id,
        product: pendingPayload,
      })
      setConfirmOpen(false)
      setPendingPayload(null)
      onSuccess('Product updated successfully.')
      onClose()
    } catch (error) {
      setConfirmOpen(false)
      setPendingPayload(null)

      if (error instanceof ApiError && error.status === 422 && error.errors) {
        applyServerErrors(error)
        return
      }

      const message =
        error instanceof ApiError ? error.message : 'Unable to save product.'
      setFormError(message)
    }
  }

  function handleDialogClose() {
    if (isSubmitting) {
      return
    }

    setConfirmOpen(false)
    setPendingPayload(null)
    setFormError(null)
    onClose()
  }

  if (!mode) {
    return null
  }

  const title = isEdit ? 'Edit Product' : 'Create Product'
  const submitLabel = isEdit ? 'Save changes' : 'Create'

  return (
    <>
      <Dialog
        open={open}
        onClose={isSubmitting ? undefined : handleDialogClose}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="sm"
        aria-labelledby="product-form-dialog-title"
      >
        <DialogTitle id="product-form-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            id="product-form"
            spacing={2}
            sx={{ mt: 1 }}
            onSubmit={handleSubmit(handleValidSubmit)}
            noValidate
          >
            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (errors.name?.type === 'server') {
                      clearErrors('name')
                    }
                    if (formError) {
                      setFormError(null)
                    }
                  }}
                  label="Name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  fullWidth
                  autoFocus
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (errors.description?.type === 'server') {
                      clearErrors('description')
                    }
                    if (formError) {
                      setFormError(null)
                    }
                  }}
                  label="Description"
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                  fullWidth
                  multiline
                  minRows={3}
                />
              )}
            />

            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (errors.price?.type === 'server') {
                      clearErrors('price')
                    }
                    if (formError) {
                      setFormError(null)
                    }
                  }}
                  label="Price"
                  type="text"
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                  error={Boolean(errors.price)}
                  helperText={errors.price?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="stock"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (errors.stock?.type === 'server') {
                      clearErrors('stock')
                    }
                    if (formError) {
                      setFormError(null)
                    }
                  }}
                  label="Stock"
                  type="text"
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  error={Boolean(errors.stock)}
                  helperText={errors.stock?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (errors.sku?.type === 'server') {
                      clearErrors('sku')
                    }
                    if (formError) {
                      setFormError(null)
                    }
                  }}
                  label="SKU"
                  error={Boolean(errors.sku)}
                  helperText={errors.sku?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControl error={Boolean(errors.active)}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(_event, checked) => {
                          field.onChange(checked)
                          if (errors.active?.type === 'server') {
                            clearErrors('active')
                          }
                          if (formError) {
                            setFormError(null)
                          }
                        }}
                        slotProps={{ input: { ref: field.ref } }}
                      />
                    }
                    label="Active"
                  />
                  {errors.active?.message ? (
                    <FormHelperText>{errors.active.message}</FormHelperText>
                  ) : null}
                </FormControl>
              )}
            />
          </Stack>
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
          <Button onClick={handleDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="contained"
            disabled={isSubmitting}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <ProductSaveConfirmationDialog
        open={confirmOpen}
        mode={isEdit ? 'edit' : 'create'}
        isSubmitting={isSubmitting}
        onCancel={handleCancelConfirmation}
        onConfirm={() => {
          void handleConfirmSave()
        }}
      />
    </>
  )
}
