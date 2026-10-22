import { toast } from 'sonner'
import { sessionKey } from '@/domain/auth/queries'
import type { AuthResponse } from '@/domain/auth/schema'
import { mergeGuestCart } from '@/features/cart/guest-cart'
import { queryClient } from '@/lib/query-client'
import { clearToken, setToken } from '@/lib/session-token'

// tudo que é do usuário usa a chave ['user', id, ...]; o dado público e a query da sessão ficam
function clearPrivateData() {
  queryClient.cancelQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user'] })
}

export async function startSession({ token, user, expiresAt }: AuthResponse) {
  setToken(token)
  clearPrivateData()

  // o merge vem antes de publicar a sessão, senão o carrinho é lido vazio e fica assim no cache
  try {
    await mergeGuestCart()
  } catch {
    toast.warning('Não foi possível juntar os itens do carrinho de visitante.')
  }
  queryClient.setQueryData(sessionKey, { user, expiresAt })
}

export function endSession() {
  clearToken()
  clearPrivateData()
  queryClient.setQueryData(sessionKey, null)
}
