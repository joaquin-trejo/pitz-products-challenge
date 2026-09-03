import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '../../../test/msw/server'
import { renderWithProviders } from '../../../test/render-with-providers'
import { ProductFormDialog } from './ProductFormDialog'
import type { Product, ProductInput } from '../product-types'

const API_BASE_URL = 'http://localhost:3000'

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 7,
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

async function fillValidCreateForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<Record<'name' | 'description' | 'price' | 'stock' | 'sku', string>> = {},
) {
  await user.clear(screen.getByLabelText('Name'))
  await user.type(screen.getByLabelText('Name'), overrides.name ?? 'Brake Pad')
  await user.clear(screen.getByLabelText('Description'))
  if (overrides.description !== undefined) {
    if (overrides.description !== '') {
      await user.type(screen.getByLabelText('Description'), overrides.description)
    }
  } else {
    await user.type(screen.getByLabelText('Description'), 'Front brake pad')
  }
  await user.clear(screen.getByLabelText('Price'))
  await user.type(screen.getByLabelText('Price'), overrides.price ?? '45.50')
  await user.clear(screen.getByLabelText('Stock'))
  await user.type(screen.getByLabelText('Stock'), overrides.stock ?? '8')
  await user.clear(screen.getByLabelText('SKU'))
  await user.type(screen.getByLabelText('SKU'), overrides.sku ?? 'BRAKE-PAD-001')
}

describe('ProductFormDialog', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const recordedBodies: unknown[] = []
  const recordedMethods: string[] = []
  const recordedUrls: string[] = []

  beforeEach(() => {
    recordedBodies.length = 0
    recordedMethods.length = 0
    recordedUrls.length = 0
    onClose.mockReset()
    onSuccess.mockReset()
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function mockWriteHandlers(options?: {
    createStatus?: number
    createBody?: unknown
    updateStatus?: number
    updateBody?: unknown
    delayMs?: number
  }) {
    server.use(
      http.post(`${API_BASE_URL}/api/v1/products`, async ({ request }) => {
        recordedMethods.push('POST')
        recordedUrls.push(request.url)
        recordedBodies.push(await request.json())

        if (options?.delayMs) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, options.delayMs)
          })
        }

        if ((options?.createStatus ?? 201) >= 400) {
          return HttpResponse.json(options?.createBody ?? { error: { message: 'Request failed' } }, {
            status: options?.createStatus ?? 500,
          })
        }

        return HttpResponse.json(
          options?.createBody ?? { data: buildProduct({ id: 99, name: 'Brake Pad', sku: 'BRAKE-PAD-001' }) },
          { status: 201 },
        )
      }),
      http.put(`${API_BASE_URL}/api/v1/products/:id`, async ({ request, params }) => {
        recordedMethods.push('PUT')
        recordedUrls.push(request.url)
        recordedBodies.push(await request.json())

        if ((options?.updateStatus ?? 200) >= 400) {
          return HttpResponse.json(options?.updateBody ?? { error: { message: 'Request failed' } }, {
            status: options?.updateStatus ?? 500,
          })
        }

        return HttpResponse.json(
          options?.updateBody ?? {
            data: buildProduct({ id: Number(params.id), name: 'Updated Mouse' }),
          },
        )
      }),
    )
  }

  it('initializes Create with blank fields and Active on', async () => {
    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    expect(screen.getByRole('heading', { name: 'Create Product' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Price')).toHaveValue('')
    expect(screen.getByLabelText('Stock')).toHaveValue('')
    expect(screen.getByLabelText('SKU')).toHaveValue('')
    expect(screen.getByRole('switch', { name: /Product Active/i })).toBeChecked()
  })

  it('initializes Edit from the existing Product', async () => {
    const product = buildProduct({ active: false, description: null, stock: 3 })

    renderWithProviders(
      <ProductFormDialog
        open
        mode={{ type: 'edit', product }}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Wireless Mouse')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Price')).toHaveValue('29.99')
    expect(screen.getByLabelText('Stock')).toHaveValue('3')
    expect(screen.getByLabelText('SKU')).toHaveValue('MOUSE-001')
    expect(screen.getByRole('switch', { name: /Product Active/i })).not.toBeChecked()
  })

  it('blocks invalid submission without opening confirmation or calling the API', async () => {
    const user = userEvent.setup()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Create Product', hidden: false })).toBeTruthy()
    expect(screen.queryByText('Create "Brake Pad"?')).not.toBeInTheDocument()
    expect(recordedMethods).toHaveLength(0)
  })

  it('rejects lowercase SKU without auto-uppercasing', async () => {
    const user = userEvent.setup()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user, { sku: 'brake-pad-001' })
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(
      await screen.findByText('SKU must use uppercase letters, numbers, and hyphens only'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('SKU')).toHaveValue('brake-pad-001')
    expect(screen.queryByText('Create "Brake Pad"?')).not.toBeInTheDocument()
    expect(recordedMethods).toHaveLength(0)
  })

  it('opens confirmation after valid Create and preserves values when cancelled', async () => {
    const user = userEvent.setup()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Create "Brake Pad"?')).toBeInTheDocument()
    expect(recordedMethods).toHaveLength(0)

    const confirmation = screen.getByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Confirm Create Product' })).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText('Name')).toHaveValue('Brake Pad')
    expect(screen.getByLabelText('SKU')).toHaveValue('BRAKE-PAD-001')
    expect(recordedMethods).toHaveLength(0)
  })

  it('confirms Create with the expected POST payload contract', async () => {
    const user = userEvent.setup()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user, { description: '   ' })
    await user.click(screen.getByRole('switch', { name: /Product Active/i }))
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Create "Brake Pad"?')).toBeInTheDocument()

    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    await waitFor(() => {
      expect(recordedMethods).toEqual(['POST'])
    })

    const body = recordedBodies[0] as { product: ProductInput }
    expect(body.product).toEqual({
      name: 'Brake Pad',
      description: null,
      price: '45.50',
      stock: 8,
      sku: 'BRAKE-PAD-001',
      active: false,
    })
    expect(typeof body.product.price).toBe('string')
    expect(typeof body.product.stock).toBe('number')
    expect(onSuccess).toHaveBeenCalledWith('Product created successfully.')
    expect(onClose).toHaveBeenCalled()
  })

  it('preserves non-empty description whitespace on Create', async () => {
    const user = userEvent.setup()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user, { description: '  padded description  ' })
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    await waitFor(() => {
      expect(recordedMethods).toEqual(['POST'])
    })

    const body = recordedBodies[0] as { product: ProductInput }
    expect(body.product.description).toBe('  padded description  ')
  })

  it('confirms Edit with PUT to the Product id', async () => {
    const user = userEvent.setup()
    const product = buildProduct()
    mockWriteHandlers()

    renderWithProviders(
      <ProductFormDialog
        open
        mode={{ type: 'edit', product }}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    )

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Updated Mouse')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Save changes to "Updated Mouse"?')).toBeInTheDocument()

    const confirmation = screen.getByRole('dialog', { name: 'Confirm Save Changes' })
    await user.click(within(confirmation).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(recordedMethods).toEqual(['PUT'])
    })
    expect(recordedUrls[0]).toContain('/api/v1/products/7')
    expect(onSuccess).toHaveBeenCalledWith('Product updated successfully.')
    expect(onClose).toHaveBeenCalled()
  })

  it('maps duplicate SKU 422 errors onto the SKU field', async () => {
    const user = userEvent.setup()
    mockWriteHandlers({
      createStatus: 422,
      createBody: { errors: { sku: ['has already been taken'] } },
    })

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('has already been taken')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Brake Pad')
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Confirm Create Product' })).not.toBeInTheDocument()
    })
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('maps another 422 field error onto the matching field', async () => {
    const user = userEvent.setup()
    mockWriteHandlers({
      createStatus: 422,
      createBody: { errors: { name: ['is too short (minimum is 3 characters)'] } },
    })

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('is too short (minimum is 3 characters)')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('keeps form values available after a generic mutation failure', async () => {
    const user = userEvent.setup()
    mockWriteHandlers({
      createStatus: 500,
      createBody: { error: { code: 'internal_server_error', message: 'Something went wrong' } },
    })

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByLabelText('SKU')).toHaveValue('BRAKE-PAD-001')
    expect(onClose).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('maps Active 422 errors onto the Active field', async () => {
    const user = userEvent.setup()
    mockWriteHandlers({
      createStatus: 422,
      createBody: { errors: { active: ['is invalid'] } },
    })

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    await user.click(within(confirmation).getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('is invalid')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Confirm Create Product' })).not.toBeInTheDocument()
    })
    const formDialog = screen.getByRole('dialog', { name: 'Create Product' })
    expect(within(formDialog).getByRole('switch', { name: /Product Active/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Brake Pad')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables confirmation while a save is pending', async () => {
    const user = userEvent.setup()
    mockWriteHandlers({ delayMs: 300 })

    renderWithProviders(
      <ProductFormDialog open mode={{ type: 'create' }} onClose={onClose} onSuccess={onSuccess} />,
    )

    await fillValidCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Confirm Create Product' })
    const confirmButton = within(confirmation).getByRole('button', { name: 'Create Product' })
    await user.click(confirmButton)

    expect(within(confirmation).getByRole('button', { name: /Saving/ })).toBeDisabled()

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
    expect(recordedMethods).toEqual(['POST'])
  })
})
