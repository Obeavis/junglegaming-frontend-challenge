import { Link } from '@tanstack/react-router'
import { Heart, House, ShoppingCart, User } from 'lucide-react'
import { useCartCount } from '@/features/cart/use-cart-count'

function MobileTabBar() {
  const count = useCartCount()

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Link to="/" className="relative flex flex-1 flex-col items-center gap-1 py-3 text-tiny text-muted-foreground outline-none focus-visible:text-text-accent [&.active]:text-text-accent" activeOptions={{ exact: true }}>
        <House className="size-5" />
        Início
      </Link>
      <Link to="/favorites" className="relative flex flex-1 flex-col items-center gap-1 py-3 text-tiny text-muted-foreground outline-none focus-visible:text-text-accent [&.active]:text-text-accent">
        <Heart className="size-5" />
        Favoritos
      </Link>
      <Link to="/cart" className="relative flex flex-1 flex-col items-center gap-1 py-3 text-tiny text-muted-foreground outline-none focus-visible:text-text-accent [&.active]:text-text-accent" aria-label={count ? `Carrinho, ${count} itens` : 'Carrinho'}>
        <span className="relative">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute -top-2 -right-3 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-bold text-primary-foreground"
            >
              {count}
            </span>
          )}
        </span>
        Carrinho
      </Link>
      <Link to="/profile" className="relative flex flex-1 flex-col items-center gap-1 py-3 text-tiny text-muted-foreground outline-none focus-visible:text-text-accent [&.active]:text-text-accent">
        <User className="size-5" />
        Perfil
      </Link>
    </nav>
  )
}

export default MobileTabBar
