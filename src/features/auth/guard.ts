import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { sessionQuery } from '@/domain/auth/queries'
import { ApiError } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { withoutAuthParams } from '@/lib/redirect'

// sem sessão volta para o início com o login aberto e o destino guardado para retomar depois
export async function requireSession({ location }: { location: ParsedLocation }) {
  // a sessão pode já ter sido encerrada por quem detectou a expiração, então o aviso também vem da URL
  let expired = new URLSearchParams(location.searchStr).get('reason') === 'expired'
  const session = await queryClient.ensureQueryData(sessionQuery).catch((error) => {
    expired ||= error instanceof ApiError && error.code === 'SESSION_EXPIRED'
    return null
  })

  if (!session) {
    throw redirect({
      to: '/',
      search: {
        auth: 'login',
        redirect: withoutAuthParams(location.href),
        reason: expired ? 'expired' : undefined,
      },
    })
  }
}
