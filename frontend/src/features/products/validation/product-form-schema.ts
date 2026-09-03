import { z } from 'zod'
import type { Product, ProductInput } from '../product-types'

const SKU_PATTERN = /^[A-Z0-9-]+$/
const PRICE_PATTERN = /^\d+(\.\d+)?$/
const STOCK_PATTERN = /^\d+$/

const PRODUCT_FORM_FIELDS = [
  'name',
  'description',
  'price',
  'stock',
  'sku',
  'active',
] as const

export type ProductFormField = (typeof PRODUCT_FORM_FIELDS)[number]

export function isProductFormField(field: string): field is ProductFormField {
  return (PRODUCT_FORM_FIELDS as readonly string[]).includes(field)
}

function isPositiveDecimalString(value: string): boolean {
  const trimmed = value.trim()
  if (!PRICE_PATTERN.test(trimmed)) {
    return false
  }

  const [integerPart, fractionPart = ''] = trimmed.split('.')
  const significantInteger = integerPart.replace(/^0+/, '') || '0'
  const isZero = significantInteger === '0' && /^0*$/.test(fractionPart)
  return !isZero
}

export const productFormSchema = z.object({
  name: z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Name is required' })
        return
      }
      if (trimmed.length < 3) {
        ctx.addIssue({ code: 'custom', message: 'Name must be at least 3 characters' })
        return
      }
      if (trimmed.length > 100) {
        ctx.addIssue({ code: 'custom', message: 'Name must be at most 100 characters' })
      }
    }),
  description: z.string().max(1000, 'Description must be at most 1000 characters'),
  price: z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Price is required' })
        return
      }
      if (!PRICE_PATTERN.test(trimmed)) {
        ctx.addIssue({ code: 'custom', message: 'Price must be a valid decimal number' })
        return
      }
      if (!isPositiveDecimalString(trimmed)) {
        ctx.addIssue({ code: 'custom', message: 'Price must be greater than 0' })
      }
    }),
  stock: z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Stock is required' })
        return
      }
      if (!STOCK_PATTERN.test(trimmed)) {
        ctx.addIssue({ code: 'custom', message: 'Stock must be a whole number' })
        return
      }
      const parsed = Number.parseInt(trimmed, 10)
      if (!Number.isFinite(parsed) || parsed < 0) {
        ctx.addIssue({ code: 'custom', message: 'Stock must be 0 or greater' })
      }
    }),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .regex(SKU_PATTERN, 'SKU must use uppercase letters, numbers, and hyphens only'),
  active: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const CREATE_PRODUCT_DEFAULTS: ProductFormValues = {
  name: '',
  description: '',
  price: '',
  stock: '',
  sku: '',
  active: true,
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    price: product.price,
    stock: String(product.stock),
    sku: product.sku,
    active: product.active,
  }
}

export function toProductInput(values: ProductFormValues): ProductInput {
  const trimmedStock = values.stock.trim()

  if (!STOCK_PATTERN.test(trimmedStock)) {
    throw new Error('Invalid stock value')
  }

  const stock = Number.parseInt(trimmedStock, 10)

  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new Error('Invalid stock value')
  }

  return {
    name: values.name.trim(),
    description: values.description.trim() === '' ? null : values.description,
    price: values.price.trim(),
    stock,
    sku: values.sku,
    active: values.active,
  }
}
