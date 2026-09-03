import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, deleteProduct, updateProduct } from './products-api'
import { productQueryKeys } from './product-query-keys'
import type { ProductInput } from '../product-types'

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: ProductInput) => createProduct(product),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, product }: { id: number; product: ProductInput }) =>
      updateProduct(id, product),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
    },
  })
}
