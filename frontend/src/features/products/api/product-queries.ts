import { useQuery } from '@tanstack/react-query'
import { getProducts } from './products-api'
import { productQueryKeys } from './product-query-keys'
import type { ProductsListParams } from '../product-types'

export function useProductsQuery(params: ProductsListParams = {}) {
  return useQuery({
    queryKey: productQueryKeys.list(params),
    queryFn: () => getProducts(params),
  })
}
