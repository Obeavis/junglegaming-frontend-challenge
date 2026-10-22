import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'
import { getToken } from '@/lib/session-token'

let onSessionLost: (() => void) | undefined

export function setSessionLostHandler(handler: () => void) {
  onSessionLost = handler
}

// sem token não há sessão para perder, então erros de visitante passam batido
function handleError(error: unknown) {
  if (!(error instanceof ApiError) || !getToken()) return
  if (error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHENTICATED') onSessionLost?.()
}

// só falhas transitórias tentam de novo; erro de validação ou de permissão não muda ao repetir
const retry = (failures: number, error: Error) =>
  error instanceof ApiError && error.isTransient && failures < 2

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})
