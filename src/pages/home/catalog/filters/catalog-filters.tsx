import type { CatalogPage } from '@/domain/catalog/schema'
import FilterGroup from './filter-group'
import { categoryLabels, networkLabels } from '@/features/catalog/labels'
import PriceFilter from './price-filter'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

function CatalogFilters({ facets }: { facets?: CatalogPage['facets'] }) {
  const { search, update } = useCatalogSearch()

  return (
    <>
      <FilterGroup
        title="Coleções"
        options={categoryLabels}
        counts={facets?.categories}
        selected={search.categories}
        onChange={(categories) => update({ categories })}
      />
      <PriceFilter />
      <FilterGroup
        title="Rede"
        options={networkLabels}
        counts={facets?.networks}
        selected={search.networks}
        onChange={(networks) => update({ networks })}
      />
    </>
  )
}

export default CatalogFilters
