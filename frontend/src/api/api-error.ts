export type ApiErrorBody = {
  status: number
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: Record<string, string[]>

  constructor({ status, message, code, errors }: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }

  static fromUnknown(status: number, body: unknown): ApiError {
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>

      if (isFieldErrors(record.errors)) {
        return new ApiError({
          status,
          message: 'Validation failed',
          errors: record.errors,
        })
      }

      if (record.error && typeof record.error === 'object') {
        const error = record.error as Record<string, unknown>
        const message =
          typeof error.message === 'string' && error.message.trim().length > 0
            ? error.message
            : 'Request failed'
        const code = typeof error.code === 'string' ? error.code : undefined

        return new ApiError({ status, message, code })
      }
    }

    return new ApiError({
      status,
      message: 'Something went wrong',
    })
  }
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (messages) =>
      Array.isArray(messages) && messages.every((message) => typeof message === 'string'),
  )
}
