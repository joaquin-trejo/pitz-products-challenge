import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ApiError } from '../../../api/api-error'
import { useDeleteProductMutation } from '../api/product-mutations'
import { useProductsQuery } from '../api/product-queries'
import type { Product, ProductStatusFilter } from '../product-types'
import { ProductCards } from './ProductCards'
import { ProductDeleteConfirmationDialog } from './ProductDeleteConfirmationDialog'
import { ProductFilters } from './ProductFilters'
import { ProductFormDialog, type ProductFormMode } from './ProductFormDialog'
import { ProductTable } from './ProductTable'
import { ProductsLoading } from './ProductsLoading'
import { ProductsPagination } from './ProductsPagination'

const SEARCH_DEBOUNCE_MS = 300

function toActiveQueryParam(filter: ProductStatusFilter): boolean | undefined {
  if (filter === 'all') {
    return undefined
  }

  return filter === 'active'
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Unable to load products.'
}

function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Unable to delete product.'
}

export function ProductsPage() {
  const theme = useTheme()
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const deleteMutation = useDeleteProductMutation()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim()
      if (nextSearch === debouncedSearch) {
        return
      }

      setDebouncedSearch(nextSearch)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput, debouncedSearch])

  const { data, error, isPending, isFetching, isError, refetch } = useProductsQuery({
    page,
    search: debouncedSearch === '' ? undefined : debouncedSearch,
    active: toActiveQueryParam(statusFilter),
  })

  const hasActiveFilters = debouncedSearch !== '' || statusFilter !== 'all'

  function handleStatusFilterChange(nextFilter: ProductStatusFilter) {
    setStatusFilter(nextFilter)
    setPage(1)
  }

  function handleClearFilters() {
    setSearchInput('')
    setDebouncedSearch('')
    setStatusFilter('all')
    setPage(1)
  }

  function handleEdit(product: Product) {
    setFormMode({ type: 'edit', product })
  }

  function handleDeleteRequest(product: Product) {
    setDeleteError(null)
    setProductToDelete(product)
  }

  function handleCancelDelete() {
    if (deleteMutation.isPending) {
      return
    }

    setProductToDelete(null)
    setDeleteError(null)
  }

  async function handleConfirmDelete() {
    if (!productToDelete || deleteMutation.isPending) {
      return
    }

    setDeleteError(null)

    try {
      await deleteMutation.mutateAsync(productToDelete.id)
      setProductToDelete(null)
      setDeleteError(null)
      setSuccessMessage('Product deleted successfully.')
    } catch (error) {
      setDeleteError(deleteErrorMessage(error))
    }
  }

  const products = data?.data ?? []
  const meta = data?.meta
  const totalCount = meta?.total_count ?? 0
  const showProgress = isFetching && !isPending && data !== undefined

  useEffect(() => {
    if (!meta || meta.total_pages === 0) {
      return
    }

    if (page > meta.total_pages) {
      // Intentional recovery after an out-of-range API response shrinks total_pages.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- page correction belongs in an effect to avoid query loops during render
      setPage(meta.total_pages)
    }
  }, [meta, page])

  const showEmptyDatabase = !isPending && !isError && totalCount === 0 && !hasActiveFilters
  const showFilteredEmpty = !isPending && !isError && totalCount === 0 && hasActiveFilters
  const showResults = !isPending && products.length > 0

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="h1">
              Products
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 40 * 8 }}>
              Search, filter, and browse catalog products.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setFormMode({ type: 'create' })}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, flexShrink: 0 }}
          >
            Create Product
          </Button>
        </Stack>

        <ProductFilters
          searchValue={searchInput}
          statusFilter={statusFilter}
          onSearchChange={setSearchInput}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {showProgress ? <LinearProgress aria-label="Updating products" /> : null}

        {isPending ? <ProductsLoading isBelowMd={isBelowMd} /> : null}

        {isError ? (
          <Paper
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Alert
              severity="error"
              variant="outlined"
              sx={{ border: 0, borderRadius: 0 }}
              action={
                <Button color="inherit" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            >
              {errorMessage(error)}
            </Alert>
          </Paper>
        ) : null}

        {showEmptyDatabase ? (
          <Paper
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Alert severity="info" variant="outlined" sx={{ border: 0, borderRadius: 0 }}>
              No products yet.
            </Alert>
          </Paper>
        ) : null}

        {showFilteredEmpty ? (
          <Paper
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Alert
              severity="info"
              variant="outlined"
              sx={{ border: 0, borderRadius: 0 }}
              action={
                <Button color="inherit" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              }
            >
              No products match your current search or filter.
            </Alert>
          </Paper>
        ) : null}

        {showResults ? (
          <Stack spacing={2}>
            {isBelowMd ? (
              <ProductCards
                products={products}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ) : (
              <ProductTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            )}
            {meta ? <ProductsPagination meta={meta} onPageChange={setPage} /> : null}
          </Stack>
        ) : null}
      </Stack>

      <ProductFormDialog
        open={formMode !== null}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onSuccess={(message) => setSuccessMessage(message)}
      />

      <ProductDeleteConfirmationDialog
        product={productToDelete}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
      />

      <Snackbar
        open={successMessage !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)} variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}
