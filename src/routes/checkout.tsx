import { createFileRoute } from '@tanstack/react-router'
import PageShell from '@/components/layout/page-shell'
import { requireSession } from '@/features/auth/guard'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireSession,
  component: () => <PageShell title="Pagamento" />,
})
