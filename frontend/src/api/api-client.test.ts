import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { apiRequest, buildApiUrl } from './api-client'
import { ApiError } from './api-error'
import { server } from '../test/msw/server'

const API_BASE_URL = 'http://localhost:3000'

describe('api client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('serializes provided query parameters', () => {
    const url = buildApiUrl('/api/v1/products', {
      page: 2,
      search: 'mouse',
      active: true,
    })

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/products?page=2&search=mouse&active=true',
    )
  })

  it('omits optional query parameters that are undefined, null, or blank', () => {
    const url = buildApiUrl('/api/v1/products', {
      page: 1,
      search: '',
      active: undefined,
    })

    expect(url.toString()).toBe('http://localhost:3000/api/v1/products?page=1')
  })

  it('parses successful JSON responses', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/v1/products`, () =>
        HttpResponse.json({
          data: [],
          meta: {
            page: 1,
            per_page: 10,
            total_pages: 0,
            total_count: 0,
          },
        }),
      ),
    )

    const response = await apiRequest<{
      data: unknown[]
      meta: { page: number }
    }>('/api/v1/products')

    expect(response.meta.page).toBe(1)
    expect(response.data).toEqual([])
  })

  it('handles 204 responses without parsing JSON', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/api/v1/products/1`, () => new HttpResponse(null, { status: 204 })),
    )

    await expect(apiRequest<void>('/api/v1/products/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('normalizes general API errors', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/v1/products`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'bad_request',
              message: 'Invalid request parameters',
            },
          },
          { status: 400 },
        ),
      ),
    )

    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'bad_request',
      message: 'Invalid request parameters',
    } satisfies Partial<ApiError>)
  })

  it('normalizes 422 field validation errors', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/v1/products`, () =>
        HttpResponse.json(
          {
            errors: {
              name: ["can't be blank"],
              sku: ['has already been taken'],
            },
          },
          { status: 422 },
        ),
      ),
    )

    try {
      await apiRequest('/api/v1/products', {
        method: 'POST',
        body: { product: { name: '' } },
      })
      expect.unreachable('Expected apiRequest to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.status).toBe(422)
      expect(apiError.message).toBe('Validation failed')
      expect(apiError.errors).toEqual({
        name: ["can't be blank"],
        sku: ['has already been taken'],
      })
    }
  })
})
