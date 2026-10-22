import { useMutation } from '@tanstack/react-query'
import { login, logout, signup } from '@/domain/auth/api'
import { endSession, startSession } from './session'

export const useLogin = () => useMutation({ mutationFn: login, onSuccess: startSession })

export const useSignup = () => useMutation({ mutationFn: signup, onSuccess: startSession })

// sair não pode travar por falha de rede: a sessão local termina de qualquer jeito
export const useLogout = () =>
  useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: endSession,
  })
