import { http, HttpResponse } from 'msw'
import { articlesHandlers } from './articles'
import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'
import { profileHandlers } from './profile'
import { walletsHandlers } from './wallets'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...authHandlers,
  ...articlesHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...profileHandlers,
  ...walletsHandlers,
]
