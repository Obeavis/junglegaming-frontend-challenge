import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import PasswordField from '@/components/form/password-field'
import TextField from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { loginRequest, type LoginRequest } from '@/domain/auth/schema'
import { applyApiError } from '@/lib/form-errors'
import { outOfScope } from '@/lib/out-of-scope'
import { useLogin } from '@/features/auth/mutations'
import SocialButtons from './social-buttons'

function LoginForm({ onDone }: { onDone: () => void }) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginRequest) })

  const submit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: onDone, onError: (error) => applyApiError(setError, error) }),
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...register('password')}
      />
      <button
        type="button"
        onClick={outOfScope}
        className="justify-self-end text-xs text-text-accent underline-offset-4 hover:underline focus-visible:underline"
      >
        Esqueceu a senha?
      </button>
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
      <SocialButtons />
    </form>
  )
}

export default LoginForm
