import { Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { outOfScope } from '@/lib/out-of-scope'

function SocialButtons() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Ou continue com
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="h-10" onClick={outOfScope}>
        <span aria-hidden className="font-bold">
          G
        </span>
        Continuar com Google
      </Button>
      <Button type="button" variant="outline" className="h-10" onClick={outOfScope}>
        <Facebook aria-hidden />
        Continuar com Facebook
      </Button>
    </div>
  )
}

export default SocialButtons
