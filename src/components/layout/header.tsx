import { Link, useLocation } from '@tanstack/react-router'
import { SquareArrowRightExit, LogOut, Search, ShoppingCart, User, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/features/auth/mutations'
import { useSession } from '@/features/auth/use-session'
import { useCartCount } from '@/features/cart/use-cart-count'
import { outOfScope } from '@/lib/out-of-scope'
import { cn } from '@/lib/utils'

function Header() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { data: session } = useSession()
  const count = useCartCount()
  const logout = useLogout()

  return (
    <header className="hidden md:block">
      <div className="mx-auto max-w-300 px-6 pt-6 xl:px-0">
        <div className="flex h-14 items-center justify-between border-b border-border">
          <Link
            to="/"
            className="rounded-sm text-xs font-bold tracking-widest outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="flex gap-8">
            <Link to="/" className={cn(
                'relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent',
                pathname === '/' &&
                  'text-text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-text-accent',
              )}>
              Início
            </Link>
            <Link to="/" hash="catalogo" className={cn(
                'relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent',
                pathname !== '/' &&
                  'text-text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-text-accent',
              )}>
              Mercado
            </Link>
            <button type="button" onClick={outOfScope} className="relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent">
              Criadores
            </button>
            <button type="button" onClick={outOfScope} className="relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent">
              Aprenda
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              hash="catalogo"
              aria-label="Buscar NFTs"
              className="rounded-sm outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Search className="size-5" />
            </Link>

            <Link
              to="/cart"
              aria-label={count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}
              className="relative rounded-sm outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-bold text-primary-foreground"
                >
                  {count}
                </span>
              )}
            </Link>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User />
                    {session.user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User />
                      Meu perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wallets">
                      <Wallet />
                      Carteiras
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => logout.mutate()}>
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="lg">
                <Link to="." search={(prev) => ({ ...prev, auth: 'login' })}>
                  <SquareArrowRightExit />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
