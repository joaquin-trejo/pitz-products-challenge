export type Product = {
  id: number
  name: string
  description: string | null
  price: string
  stock: number
  sku: string
  active: boolean
  created_at: string
  updated_at: string
}

export type ProductsMeta = {
  page: number
  per_page: number
  total_pages: number
  total_count: number
}

export type ProductsResponse = {
  data: Product[]
  meta: ProductsMeta
}

export type ProductResponse = {
  data: Product
}

export type ProductInput = {
  name: string
  description?: string | null
  price: string
  stock: number
  sku: string
  active: boolean
}

export type ProductsListParams = {
  page?: number
  search?: string
  active?: boolean
}

export type ProductStatusFilter = 'all' | 'active' | 'inactive'

export type ApiValidationErrors = {
  errors: Record<string, string[]>
}

export type ApiGeneralError = {
  error: {
    code: string
    message: string
  }
}
