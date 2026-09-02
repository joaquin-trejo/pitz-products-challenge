import { ApiError } from './api-error'

export type QueryValue = string | number | boolean | null | undefined

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, QueryValue>
  body?: unknown
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!baseUrl) {
    throw new ApiError({
      status: 0,
      message: 'API base URL is not configured',
      code: 'configuration_error',
    })
  }

  return baseUrl
}

export function buildApiUrl(path: string, query?: Record<string, QueryValue>): URL {
  const baseUrl = getApiBaseUrl()
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(normalizedPath, normalizedBase)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return url
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError({
      status: response.status,
      message: 'Something went wrong',
      code: 'invalid_json',
    })
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, body, headers, ...rest } = options
  const url = buildApiUrl(path, query)
  const requestHeaders = new Headers(headers)

  requestHeaders.set('Accept', 'application/json')

  let requestBody: BodyInit | undefined
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
    })
  } catch {
    throw new ApiError({
      status: 0,
      message: 'Unable to reach the server',
      code: 'network_error',
    })
  }

  const parsedBody = await parseResponseBody(response)

  if (!response.ok) {
    throw ApiError.fromUnknown(response.status, parsedBody)
  }

  return parsedBody as T
}
