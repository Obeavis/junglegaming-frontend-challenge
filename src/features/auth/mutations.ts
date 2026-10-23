import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { login, logout, signup } from '@/domain/auth/api'
import { endSession, startSession } from './session'

export const useLogin = () => useMutation({ mutationFn: login, onSuccess: startSession })

export const useSignup = () => useMutation({ mutationFn: signup, onSuccess: startSession })

const privateRoutes = /^\/(profile|wallets|favorites|checkout|orders)(\/|$)/

// sair não pode travar por falha de rede: a sessão local termina de qualquer jeito
export function useLogout() {
  const router = useRouter()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => {
      // em página privada não sobra o que mostrar sem sessão, então volta para a home
      if (privateRoutes.test(router.state.location.pathname)) navigate({ to: '/', replace: true })
      endSession()
    },
  })
}
