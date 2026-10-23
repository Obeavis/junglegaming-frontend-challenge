import { useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function MobilePageHeader({ title }: { title: string }) {
  const router = useRouter()

  return (
    <div className="relative flex items-center justify-center pb-4 md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Voltar"
        className="absolute left-0 rounded-full border-primary/60 bg-transparent text-text-accent"
        onClick={() => router.history.back()}
      >
        <ChevronLeft />
      </Button>
      <p aria-hidden className="text-base font-bold">
        {title}
      </p>
    </div>
  )
}

export default MobilePageHeader
