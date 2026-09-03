import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ApiError } from '../../../api/api-error'
import { useProductsQuery } from '../api/product-queries'
import type { Product, ProductStatusFilter } from '../product-types'
import { ProductCards } from './ProductCards'
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

export function ProductsPage() {
  const theme = useTheme()
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null)
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
          }}
        >
          <Box>
            <Typography component="h1" variant="h1">
              Products
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Search, filter, and browse catalog products.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setFormMode({ type: 'create' })}>
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
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            {errorMessage(error)}
          </Alert>
        ) : null}

        {showEmptyDatabase ? (
          <Alert severity="info">No products yet.</Alert>
        ) : null}

        {showFilteredEmpty ? (
          <Alert
            severity="info"
            action={
              <Button color="inherit" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          >
            No products match your current search or filter.
          </Alert>
        ) : null}

        {showResults ? (
          <Stack spacing={2}>
            {isBelowMd ? (
              <ProductCards products={products} onEdit={handleEdit} />
            ) : (
              <ProductTable products={products} onEdit={handleEdit} />
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
