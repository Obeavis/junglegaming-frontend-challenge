import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import LoginForm from './login-form'
import SignupForm from './signup-form'

type Mode = 'login' | 'signup'

const tabs: { mode: Mode; label: string }[] = [
  { mode: 'login', label: 'Entrar' },
  { mode: 'signup', label: 'Criar conta' },
]

const descriptions: Record<Mode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  signup: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

// o login vive na URL (?auth=login) para abrir por cima de qualquer tela e voltar ao fluxo depois
function AuthDialog() {
  const { auth, redirect, reason } = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()

  const close = () =>
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, auth: undefined, redirect: undefined, reason: undefined }),
      replace: true,
    })

  const switchTo = (mode: Mode) =>
    navigate({ to: '.', search: (prev) => ({ ...prev, auth: mode }), replace: true })

  const done = () => (redirect ? router.history.push(redirect) : close())

  return (
    <Dialog open={!!auth} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="max-h-dvh content-start gap-6 overflow-y-auto border-border-soft bg-card p-6 sm:max-w-125 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        <DialogTitle className="sr-only">{auth === 'signup' ? 'Criar conta' : 'Entrar'}</DialogTitle>
        {auth && (
          <>
            <div role="tablist" aria-label="Acesso à conta" className="flex gap-4 text-lg font-bold">
              {tabs.map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={auth === mode}
                  onClick={() => switchTo(mode)}
                  className={cn(
                    'rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    auth === mode ? 'text-foreground' : 'text-text-accent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {descriptions[auth]}
            </DialogDescription>
            {reason === 'expired' && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sua sessão expirou. Entre novamente para continuar.
              </p>
            )}
            <div role="tabpanel">
              {auth === 'login' ? <LoginForm onDone={done} /> : <SignupForm onDone={done} />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
