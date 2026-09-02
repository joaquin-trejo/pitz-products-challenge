import type { ProductsListParams } from '../product-types'

export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (params: ProductsListParams) =>
    [
      ...productQueryKeys.lists(),
      {
        page: params.page,
        search: params.search,
        active: params.active,
      },
    ] as const,
}
