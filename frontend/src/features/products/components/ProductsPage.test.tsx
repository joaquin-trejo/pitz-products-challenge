import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/react'
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

  it('opens Create Product from the page header', async () => {
    const user = userEvent.setup()
    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create Product' }))
    expect(await screen.findByRole('heading', { name: 'Create Product' })).toBeInTheDocument()
    expect(screen.getByLabelText('Active')).toBeChecked()
  })

  it('opens Edit from the Product table action', async () => {
    const user = userEvent.setup()
    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Wireless Mouse' }))
    expect(await screen.findByRole('heading', { name: 'Edit Product' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Wireless Mouse')
    expect(screen.getByLabelText('SKU')).toHaveValue('MOUSE-001')
  })

  it('shows success feedback and refreshes the Product list after Create', async () => {
    const user = userEvent.setup()
    let includeCreated = false

    mockIndex(() => {
      if (includeCreated) {
        return HttpResponse.json(
          buildResponse([
            buildProduct({ id: 99, name: 'Brake Pad', sku: 'BRAKE-PAD-001' }),
            buildProduct(),
          ]),
        )
      }

      return HttpResponse.json(buildResponse([buildProduct()]))
    })

    server.use(
      http.post(`${API_BASE_URL}/api/v1/products`, async ({ request }) => {
        const body = (await request.json()) as { product: { name: string; sku: string } }
        includeCreated = true
        return HttpResponse.json(
          {
            data: buildProduct({
              id: 99,
              name: body.product.name,
              sku: body.product.sku,
            }),
          },
          { status: 201 },
        )
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create Product' }))
    await user.type(screen.getByLabelText('Name'), 'Brake Pad')
    await user.type(screen.getByLabelText('Price'), '45.50')
    await user.type(screen.getByLabelText('Stock'), '8')
    await user.type(screen.getByLabelText('SKU'), 'BRAKE-PAD-001')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const createConfirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(createConfirmation).getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Product created successfully.')).toBeInTheDocument()
    expect(await screen.findByText('Brake Pad')).toBeInTheDocument()
  })

  it('shows success feedback and refreshes the Product list after Edit', async () => {
    const user = userEvent.setup()
    let updatedName = 'Wireless Mouse'

    mockIndex(() =>
      HttpResponse.json(buildResponse([buildProduct({ name: updatedName })])),
    )

    server.use(
      http.put(`${API_BASE_URL}/api/v1/products/:id`, async ({ request }) => {
        const body = (await request.json()) as { product: { name: string } }
        updatedName = body.product.name
        return HttpResponse.json({
          data: buildProduct({ name: updatedName }),
        })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Wireless Mouse' }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Pro Wireless Mouse')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    const editConfirmation = await screen.findByRole('dialog', { name: 'Confirm Save Changes' })
    await user.click(within(editConfirmation).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Product updated successfully.')).toBeInTheDocument()
    expect(await screen.findByText('Pro Wireless Mouse')).toBeInTheDocument()
  })

  it('opens Delete confirmation for the selected Product and cancels without DELETE', async () => {
    const user = userEvent.setup()
    const deleteCalls: string[] = []

    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))
    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/:id`, ({ request }) => {
        deleteCalls.push(request.url)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Wireless Mouse' }))
    expect(await screen.findByRole('dialog', { name: 'Delete Product' })).toBeInTheDocument()
    expect(screen.getByText(/Delete "Wireless Mouse"\?/)).toBeInTheDocument()

    const confirmation = screen.getByRole('dialog', { name: 'Delete Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Delete Product' })).not.toBeInTheDocument()
    })
    expect(deleteCalls).toHaveLength(0)
  })

  it('deletes a Product, shows success feedback, and removes it from the list', async () => {
    const user = userEvent.setup()
    let deleted = false
    const deleteCalls: string[] = []

    mockIndex(() => {
      if (deleted) {
        return HttpResponse.json(
          buildResponse([], { page: 1, per_page: 10, total_pages: 0, total_count: 0 }),
        )
      }

      return HttpResponse.json(buildResponse([buildProduct()]))
    })

    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/:id`, ({ params }) => {
        deleteCalls.push(String(params.id))
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Wireless Mouse' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Delete Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Delete Product' }))

    expect(await screen.findByText('Product deleted successfully.')).toBeInTheDocument()
    expect(deleteCalls).toEqual(['1'])
    await waitFor(() => {
      expect(screen.queryByText('Wireless Mouse')).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog', { name: 'Delete Product' })).not.toBeInTheDocument()
    })
  })

  it('keeps Delete confirmation open after failure and succeeds on retry', async () => {
    const user = userEvent.setup()
    let attempts = 0
    let deleted = false

    mockIndex(() => {
      if (deleted) {
        return HttpResponse.json(
          buildResponse([], { page: 1, per_page: 10, total_pages: 0, total_count: 0 }),
        )
      }

      return HttpResponse.json(buildResponse([buildProduct()]))
    })

    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/:id`, () => {
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

        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Wireless Mouse' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Delete Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Delete Product' }))

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Delete Product' })).toBeInTheDocument()
    expect(screen.getByText(/Delete "Wireless Mouse"\?/)).toBeInTheDocument()
    expect(screen.queryByText('Product deleted successfully.')).not.toBeInTheDocument()

    await user.click(within(confirmation).getByRole('button', { name: 'Delete Product' }))

    expect(await screen.findByText('Product deleted successfully.')).toBeInTheDocument()
    expect(attempts).toBe(2)
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Delete Product' })).not.toBeInTheDocument()
    })
  })

  it('disables Delete confirmation while a delete is pending', async () => {
    const user = userEvent.setup()

    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))
    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/:id`, async () => {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 300)
        })
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Wireless Mouse' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Delete Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Delete Product' }))

    expect(within(confirmation).getByRole('button', { name: /Deleting/ })).toBeDisabled()
    expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(await screen.findByText('Product deleted successfully.')).toBeInTheDocument()
  })

  it('exposes Delete on Product cards below md', async () => {
    stubMatchMedia(true)
    mockIndex(() => HttpResponse.json(buildResponse([buildProduct()])))

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByRole('heading', { level: 2, name: 'Wireless Mouse' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Wireless Mouse' })).toBeInTheDocument()
  })

  it('reuses pagination recovery after deleting the last Product on the last page', async () => {
    const user = userEvent.setup()
    let deleted = false

    mockIndex((url) => {
      const page = Number(url.searchParams.get('page') ?? '1')

      if (!deleted) {
        if (page === 2) {
          return HttpResponse.json(
            buildResponse([buildProduct({ id: 11, name: 'HDMI Cable' })], {
              page: 2,
              per_page: 10,
              total_pages: 2,
              total_count: 11,
            }),
          )
        }

        return HttpResponse.json(
          buildResponse([buildProduct()], {
            page: 1,
            per_page: 10,
            total_pages: 2,
            total_count: 11,
          }),
        )
      }

      if (page === 2) {
        return HttpResponse.json(
          buildResponse([], {
            page: 2,
            per_page: 10,
            total_pages: 1,
            total_count: 10,
          }),
        )
      }

      return HttpResponse.json(
        buildResponse([buildProduct()], {
          page: 1,
          per_page: 10,
          total_pages: 1,
          total_count: 10,
        }),
      )
    })

    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/:id`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<ProductsPage />)
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(await screen.findByText('HDMI Cable')).toBeInTheDocument()
    expect(lastParams().get('page')).toBe('2')

    await user.click(screen.getByRole('button', { name: 'Delete HDMI Cable' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Delete Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Delete Product' }))

    expect(await screen.findByText('Product deleted successfully.')).toBeInTheDocument()
    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument()
    expect(screen.queryByText('HDMI Cable')).not.toBeInTheDocument()
    expect(screen.queryByText('No products yet.')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(lastParams().get('page')).toBe('1')
    })
  })
})
