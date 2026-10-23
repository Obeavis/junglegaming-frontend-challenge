import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addCartItem } from '@/domain/cart/api'
import { cartKey } from '@/domain/cart/queries'
import type { CartLine } from '@/domain/cart/schema'
import { useSession } from '@/features/auth/use-session'
import { guestCart } from './guest-cart'

export function useAddToCart() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (line: CartLine) => {
      if (!session) {
        guestCart.add(line)
        return null
      }
      return addCartItem(line)
    },
    onSuccess: (cart) => {
      if (cart && session) queryClient.setQueryData(cartKey(session.user.id), cart)
      toast.success('Adicionado ao carrinho')
    },
    onError: (error) => toast.error(error.message),
  })
}
