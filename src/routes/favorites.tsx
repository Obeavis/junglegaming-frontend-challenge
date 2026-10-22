import { createFileRoute } from '@tanstack/react-router'
import PageShell from '@/components/layout/page-shell'
import { requireSession } from '@/features/auth/guard'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireSession,
  component: () => <PageShell title="Favoritos" />,
})
