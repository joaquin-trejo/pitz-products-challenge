import { apiRequest } from '../../../api/api-client'
import type {
  ProductInput,
  ProductResponse,
  ProductsListParams,
  ProductsResponse,
} from '../product-types'

const PRODUCTS_PATH = '/api/v1/products'

export function getProducts(params: ProductsListParams = {}): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(PRODUCTS_PATH, {
    method: 'GET',
    query: {
      page: params.page,
      search: params.search,
      active: params.active,
    },
  })
}

export function createProduct(product: ProductInput): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(PRODUCTS_PATH, {
    method: 'POST',
    body: { product },
  })
}

export function updateProduct(
  id: number,
  product: ProductInput,
): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`${PRODUCTS_PATH}/${id}`, {
    method: 'PUT',
    body: { product },
  })
}

export function deleteProduct(id: number): Promise<void> {
  return apiRequest<void>(`${PRODUCTS_PATH}/${id}`, {
    method: 'DELETE',
  })
}
