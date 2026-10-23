import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

const MIN = 0.02
const MAX = 12.3

const fmt = (value: number) => value.toFixed(2)

function PriceFilter() {
  const { search, update } = useCatalogSearch()
  const titleId = useId()
  const applied: [number, number] = [Number(search.minPrice ?? MIN), Number(search.maxPrice ?? MAX)]
  const [draft, setDraft] = useState(applied)

  // voltar no histórico muda a URL por fora do slider
  const [seen, setSeen] = useState(applied.join())
  if (seen !== applied.join()) {
    setSeen(applied.join())
    setDraft(applied)
  }

  const apply = () =>
    update({
      minPrice: draft[0] > MIN ? fmt(draft[0]) : undefined,
      maxPrice: draft[1] < MAX ? fmt(draft[1]) : undefined,
    })

  return (
    <section aria-labelledby={titleId} className="mt-8">
      <h2 id={titleId} className="text-sm font-bold">
        Faixa de preço
      </h2>
      <Slider
        min={MIN}
        max={MAX}
        step={0.01}
        minStepsBetweenThumbs={1}
        value={draft}
        onValueChange={(value) => setDraft([value[0], value[1]])}
        aria-label="Faixa de preço em ETH"
        className="mt-4"
      />
      <p className="mt-3 text-xs">
        Preço: {fmt(draft[0])} - {fmt(draft[1])} ETH
      </p>
      <Button size="sm" onClick={apply} className="mt-3">
        Aplicar
      </Button>
    </section>
  )
}

export default PriceFilter
