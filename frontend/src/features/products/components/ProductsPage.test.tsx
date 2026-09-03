import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { server } from '../../../test/msw/server'
import { renderWithProviders } from '../../../test/render-with-providers'
import { stubMatchMedia } from '../../../test/match-media'
import { ProductsPage } from './ProductsPage'
import type { Product, ProductsMeta, ProductsResponse } from '../product-types'

const API_BASE_URL = 'http://localhost:3000'

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Wireless Mouse',
    description: 'Ergonomic mouse',
    price: '29.99',
    stock: 12,
    sku: 'MOUSE-001',
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildResponse(data: Product[], meta: Partial<ProductsMeta> = {}): ProductsResponse {
  return {
    data,
    meta: {
      page: 1,
      per_page: 10,
      total_pages: data.length === 0 ? 0 : 1,
      total_count: data.length,
      ...meta,
    },
  }
}

describe('ProductsPage', () => {
  const recordedRequests: URL[] = []

  beforeEach(() => {
    recordedRequests.length = 0
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    stubMatchMedia(false)
  })

  function mockIndex(responder: (url: URL) => Response | Promise<Response>) {
    server.use(
      http.get(`${API_BASE_URL}/api/v1/products`, async ({ request }) => {
        const url = new URL(request.url)
        recordedRequests.push(url)
        return responder(url)
      }),
    )
  }

  function lastParams() {
    const url = recordedRequests.at(-1)
    expect(url).toBeDefined()
    return url!.searchParams
  }

  it('shows a loading state then Product results', async () => {
    const product = buildProduct()
    let resolveResponse: (response: ProductsResponse) => void = () => {}
    const pendingResponse = new Promise<ProductsResponse>((resolve) => {
      resolveResponse = resolve
    })

    mockIndex(async () => HttpResponse.json(await pendingResponse))

    renderWithProviders(<ProductsPage />)

    expect(screen.getByLabelText('Loading products')).toBeInTheDocument()
    expect(screen.queryByText('No products yet.')).not.toBeInTheDocument()

    resolveResponse(buildResponse([product, buildProduct({ id: 2, name: 'USB Hub', price: '15.00', active: false })]))

    expect(await screen.findByRole('table', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: Active')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: Inactive')).toBeInTheDocument()
    expect(screen.getByText('29.99')).toBeInTheDocument()
    expect(screen.queryByText(/\$|USD|COP/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Loading products')).not.toBeInTheDocument()
  })

  it('shows a safe error and retries the request', async () => {
    const user = userEvent.setup()
    const product = buildProduct()
    let attempts = 0

    mockIndex(() => {
      attempts += 1
      if (attempts === 1) {
        return HttpResponse.json(
          {
            error: {
              code: 'internal_server_error',
              message: 'Something went wrong',
            },
          },
          { status: 500 },
        )
      }

      return HttpResponse.json(buildResponse([product]))
    })

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(attempts).toBe(2)
  })

  it('shows the unfiltered empty database state', async () => {
    mockIndex(() =>
      HttpResponse.json(
        buildResponse([], { page: 1, per_page: 10, total_pages: 0, total_count: 0 }),
      ),
    )

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByText('No products yet.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('shows the filtered-empty state and clears filters', async () => {
    const user = userEvent.setup()
    const product = buildProduct()

    mockIndex((url) => {
      if (url.searchParams.get('active') === 'false') {
        return HttpResponse.json(
          buildResponse([], { page: 1, per_page: 10, total_pages: 0, total_count: 0 }),
        )
      }

      return HttpResponse.json(buildResponse([product], { total_count: 1, total_pages: 1 }))
    })

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Inactive' }))

    expect(
      await screen.findByText('No products match your current search or filter.'),
    ).toBeInTheDocument()
    expect(lastParams().get('active')).toBe('false')
    expect(lastParams().has('search')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(lastParams().has('active')).toBe(false)
    expect(lastParams().get('page')).toBe('1')
  })

  it('maps the active filter to Rails query params', async () => {
    const user = userEvent.setup()

    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(lastParams().has('active')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Active' }))
    await waitFor(() => {
      expect(lastParams().get('active')).toBe('true')
    })

    await user.click(screen.getByRole('button', { name: 'Inactive' }))
    await waitFor(() => {
      expect(lastParams().get('active')).toBe('false')
    })

    await user.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => {
      expect(lastParams().has('active')).toBe(false)
    })

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(lastParams().has('active')).toBe(false)
  })

  it('requests the selected backend page', async () => {
    const user = userEvent.setup()

    mockIndex((url) => {
      const page = Number(url.searchParams.get('page') ?? '1')
      const product =
        page === 2
          ? buildProduct({ id: 11, name: 'HDMI Cable' })
          : buildProduct()

      return HttpResponse.json(
        buildResponse([product], {
          page,
          per_page: 10,
          total_pages: 2,
          total_count: 15,
        }),
      )
    })

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–10 of 15')).toBeInTheDocument()
    expect(lastParams().get('page')).toBe('1')

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))

    expect(await screen.findByText('HDMI Cable')).toBeInTheDocument()
    expect(lastParams().get('page')).toBe('2')
    expect(screen.getByText('Showing 11–15 of 15')).toBeInTheDocument()
  })

  it('debounces search and sends the trimmed query', async () => {
    const user = userEvent.setup({ delay: null })

    mockIndex((url) => {
      if (url.searchParams.get('search') === 'mouse') {
        return HttpResponse.json(buildResponse([buildProduct()]))
      }

      return HttpResponse.json(buildResponse([buildProduct(), buildProduct({ id: 2, name: 'USB Hub' })]))
    })

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    const requestsAfterLoad = recordedRequests.length

    await user.type(screen.getByLabelText('Search products'), '  mouse  ')

    expect(recordedRequests.length).toBe(requestsAfterLoad)

    await waitFor(
      () => {
        expect(lastParams().get('search')).toBe('mouse')
      },
      { timeout: 1500 },
    )

    expect(lastParams().get('page')).toBe('1')
  })

  it('omits whitespace-only search from the API query', async () => {
    const user = userEvent.setup({ delay: null })

    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    const requestsAfterLoad = recordedRequests.length

    await user.type(screen.getByLabelText('Search products'), '   ')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 400)
    })

    expect(recordedRequests.length).toBe(requestsAfterLoad)
    expect(lastParams().has('search')).toBe(false)
  })

  it('resets pagination to page 1 when search or filter changes', async () => {
    const user = userEvent.setup({ delay: null })

    mockIndex((url) => {
      const page = Number(url.searchParams.get('page') ?? '1')
      const search = url.searchParams.get('search')
      const name = search === 'mouse' ? 'Wireless Mouse' : page === 2 ? 'HDMI Cable' : 'USB Hub'

      return HttpResponse.json(
        buildResponse([buildProduct({ id: page, name })], {
          page,
          per_page: 10,
          total_pages: 2,
          total_count: 15,
        }),
      )
    })

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('USB Hub')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(await screen.findByText('HDMI Cable')).toBeInTheDocument()
    expect(lastParams().get('page')).toBe('2')

    await user.click(screen.getByRole('button', { name: 'Active' }))
    await waitFor(() => {
      expect(lastParams().get('page')).toBe('1')
      expect(lastParams().get('active')).toBe('true')
    })

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(await screen.findByText('HDMI Cable')).toBeInTheDocument()
    expect(lastParams().get('page')).toBe('2')

    await user.type(screen.getByLabelText('Search products'), 'mouse')
    await waitFor(
      () => {
        expect(lastParams().get('search')).toBe('mouse')
        expect(lastParams().get('page')).toBe('1')
      },
      { timeout: 1500 },
    )
  })

  it('recovers from an out-of-range page when the dataset shrinks', async () => {
    const user = userEvent.setup()
    const product = buildProduct()
    let datasetShrunk = false

    mockIndex((url) => {
      const page = Number(url.searchParams.get('page') ?? '1')

      if (page === 2) {
        datasetShrunk = true
        return HttpResponse.json(
          buildResponse([], {
            page: 2,
            per_page: 10,
            total_pages: 1,
            total_count: 7,
          }),
        )
      }

      if (datasetShrunk) {
        return HttpResponse.json(
          buildResponse([product], {
            page: 1,
            per_page: 10,
            total_pages: 1,
            total_count: 7,
          }),
        )
      }

      return HttpResponse.json(
        buildResponse([product], {
          page: 1,
          per_page: 10,
          total_pages: 2,
          total_count: 15,
        }),
      )
    })

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))

    await waitFor(() => {
      expect(recordedRequests.some((url) => url.searchParams.get('page') === '2')).toBe(true)
    })

    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(screen.queryByText('No products yet.')).not.toBeInTheDocument()
    expect(lastParams().get('page')).toBe('1')
  })

  it('renders Product cards below the md breakpoint', async () => {
    stubMatchMedia(true)
    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByRole('heading', { level: 2, name: 'Wireless Mouse' })).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Products' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status: Active')).toBeInTheDocument()
    expect(screen.getByText(/SKU: MOUSE-001/)).toBeInTheDocument()
  })
})
