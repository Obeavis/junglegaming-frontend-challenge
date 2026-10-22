import { createFileRoute } from '@tanstack/react-router'
import PageShell from '@/components/layout/page-shell'

export const Route = createFileRoute('/cart')({
  component: () => <PageShell title="Carrinho de NFTs" />,
})
