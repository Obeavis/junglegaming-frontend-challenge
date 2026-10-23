import { useState } from 'react'
import Reveal from '@/components/motion/reveal'
import ArticlesSection from './articles'
import CatalogSection from './catalog'
import Hero from './hero'
import MobileSearchBar from './mobile-search-bar'
import PromoBanners from './promo-banners'

function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      <MobileSearchBar onOpenFilters={() => setFiltersOpen(true)} />
      <Hero />
      <Reveal>
        <CatalogSection filtersOpen={filtersOpen} onFiltersOpenChange={setFiltersOpen} />
      </Reveal>
      <PromoBanners />
      <ArticlesSection />
    </>
  )
}

export default Home
