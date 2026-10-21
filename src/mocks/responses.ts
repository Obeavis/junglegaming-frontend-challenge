import { HttpResponse } from 'msw'
import type { ErrorCode } from '@/lib/http'

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  extra: { fields?: Record<string, string>; details?: unknown } = {},
) {
  return HttpResponse.json({ status, code, message, ...extra }, { status })
}

export const notFound = (what = 'Recurso') =>
  apiError(404, 'NOT_FOUND', `${what} não encontrado.`)
