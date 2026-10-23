import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import SummaryRows from '@/components/cart/summary-rows'
import Breadcrumb from '@/components/layout/breadcrumb'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cartKey } from '@/domain/cart/queries'
import { createOrder } from '@/domain/orders/api'
import type { CreateOrderRequest } from '@/domain/orders/schema'
import { quoteQuery } from '@/domain/quote/queries'
import { connectWallet, createWallet, updateWallet } from '@/domain/wallets/api'
import { walletsKey, walletsQuery } from '@/domain/wallets/queries'
import { walletFields, walletInput, walletProviders, type Wallet, type WalletInput } from '@/domain/wallets/schema'
import { useSession } from '@/features/auth/use-session'
import { useCart } from '@/features/cart/use-cart'
import { providerLabels } from '@/features/catalog/labels'
import { formatEth } from '@/lib/eth'
import { applyApiError } from '@/lib/form-errors'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import WalletFields from '@/components/wallet/wallet-fields'
import WalletCards from './wallet-cards'

const staleCodes = ['QUOTE_STALE', 'QUOTE_EXPIRED', 'AVAILABILITY_CONFLICT']

const toInput = (wallet: Wallet): WalletInput => walletFields.parse(wallet)

function Checkout() {
  const { data: session } = useSession()
  const userId = session?.user.id ?? ''
  const cart = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const lines = cart.items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity }))
  const quote = useQuery({
    ...quoteQuery({ items: lines, coupon: cart.coupon ?? undefined }),
    enabled: lines.length > 0,
  })
  const wallets = useQuery({ ...walletsQuery(userId), enabled: !!session })

  const [walletId, setWalletId] = useState<string>()
  const [note, setNote] = useState('')
  const [changed, setChanged] = useState(false)
  const attempt = useRef<{ fingerprint: string; key: string }>(undefined)

  const wallet = wallets.data?.find((w) => w.id === walletId) ?? wallets.data?.[0]
  const form = useForm<WalletInput>({ resolver: zodResolver(walletInput), values: wallet && toInput(wallet) })
  const network = form.watch('network') ?? wallet?.network ?? 'ethereum'
  const provider = form.watch('provider')
  const connected = !wallet || wallet.connection?.network === network

  const current = quote.data
  const hasIssue = !!current?.items.some((item) => item.issue)

  const place = useMutation({
    mutationFn: async (values: WalletInput) => {
      if (!current) throw new Error('Pedido incompleto.')
      let target = wallet
      if (!target) {
        target = await createWallet({ ...values, role: 'primary' })
        await connectWallet(target.id, values.network)
      } else if (form.formState.isDirty) {
        await updateWallet(target.id, values)
      }
      queryClient.invalidateQueries({ queryKey: walletsKey(userId) })
      const body: CreateOrderRequest = {
        quoteId: current.id,
        walletId: target.id,
        network: values.network,
        note: note.trim() || undefined,
      }
      const fingerprint = JSON.stringify(body)
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() }
      return createOrder(body, attempt.current.key)
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      if (error instanceof ApiError && staleCodes.includes(error.code)) {
        setChanged(true)
        quote.refetch()
      } else if (error instanceof ApiError && error.code === 'TIMEOUT') {
        toast.error('A conexão demorou. Confirme de novo: o pedido não será duplicado.')
      } else if (error instanceof ApiError && error.fields && Object.keys(error.fields).length) {
        applyApiError(form.setError, error)
      } else {
        toast.error(error.message)
      }
    },
  })

  const submit = form.handleSubmit((values) => {
    setChanged(false)
    place.mutate(values)
  })

  if (!cart.isPending && cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-300 flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link to="/" hash="catalogo">
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 max-md:pb-8 md:py-10 xl:px-0">
      <Breadcrumb current="Pagamento" />
      <MobilePageHeader title="Pagamento com carteira" />

      <form onSubmit={submit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <section aria-labelledby="collector" className="space-y-4">
            <h1 id="collector" className="text-sm font-bold max-md:sr-only">
              Perfil do colecionador
            </h1>
            <div className={wallet ? 'max-md:hidden' : undefined}>
              <WalletFields form={form} />
            </div>
          </section>

          <section aria-label="Carteira" className="space-y-4">
            {wallets.isPending ? (
              <Skeleton className="h-28 w-full" />
            ) : wallets.isError ? (
              <div role="alert" className="flex flex-col items-start gap-3">
                <p className="text-sm">Não foi possível carregar as carteiras.</p>
                <Button type="button" onClick={() => wallets.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : wallet ? (
              <WalletCards userId={userId} wallets={wallets.data} selected={wallet} network={network} onSelect={setWalletId} />
            ) : (
              <p className="text-xs text-text-secondary">
                Você ainda não tem carteiras. Preencha o perfil: a carteira será cadastrada e conectada ao confirmar a compra.
              </p>
            )}
          </section>

          <section aria-labelledby="note-title" className="space-y-2 max-md:hidden">
            <h2 id="note-title" className="text-xs font-bold">
              Observação do colecionador (opcional)
            </h2>
            <Textarea
              aria-labelledby="note-title"
              value={note}
              maxLength={280}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-28 max-w-sm"
            />
          </section>
        </div>

        <aside aria-label="Revisão do pedido" className="space-y-5">
          <h2 className="text-sm font-bold max-md:hidden">Seus NFTs</h2>
          <ul className="space-y-2 max-md:hidden">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-2">
                <img src={item.image.variants[0]?.url ?? item.image.url} alt="" width={36} height={36} className="size-9 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{item.name}</span>
                <span className="text-tiny text-text-secondary">(x {item.quantity})</span>
                <span className="text-xs font-bold text-text-accent">{formatEth(item.unitPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="max-md:hidden">
            <SummaryRows totals={current} />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">Carteira e rede</legend>
            {walletProviders.map((item) => (
              <label
                key={item}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  provider === item && 'border-primary',
                )}
              >
                <input type="radio" value={item} className="sr-only" {...form.register('provider')} />
                <span aria-hidden className={cn('size-3 shrink-0 rounded-full border-2 border-primary', provider === item && 'bg-primary')} />
                {providerLabels[item]}
              </label>
            ))}
          </fieldset>

          <p className="flex items-center justify-between text-sm font-bold md:hidden">
            Total:
            <span className="text-text-accent">{current ? formatEth(current.total, { minDecimals: 3 }) : '…'}</span>
          </p>

          {changed && (
            <p role="alert" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              Os valores ou a disponibilidade mudaram. Revise o total e confirme novamente.
            </p>
          )}
          {hasIssue && (
            <p role="alert" className="text-sm text-destructive">
              Alguns itens não estão mais disponíveis. Ajuste o carrinho para continuar.
            </p>
          )}
          {!connected && (
            <p role="status" className="text-xs text-text-secondary">
              Conecte a carteira na rede selecionada para enviar o pedido.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full max-md:rounded-full max-md:bg-linear-to-br max-md:from-primary max-md:to-[color-mix(in_oklab,var(--primary),black_30%)] max-md:font-bold md:h-9"
            disabled={!current || !connected || hasIssue || place.isPending || quote.isFetching}
          >
            {place.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
          </Button>
        </aside>
      </form>
    </div>
  )
}

export default Checkout
