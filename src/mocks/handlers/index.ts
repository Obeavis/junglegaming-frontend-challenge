import { http, HttpResponse } from 'msw'
import { articlesHandlers } from './articles'
import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...authHandlers,
  ...articlesHandlers,
  ...catalogHandlers,
]
