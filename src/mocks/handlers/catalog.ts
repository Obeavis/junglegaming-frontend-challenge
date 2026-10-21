import { http, HttpResponse } from 'msw'
import { compareEth } from '@/lib/eth'
import {
  catalogQuery,
  categories,
  networks,
  nftSummary,
  review,
  type CatalogPage,
  type CatalogQuery,
  type Nft,
  type ReviewsPage,
} from '@/domain/catalog/schema'
import { MOCK_NOW } from '@/mocks/clock'
import { getFeatured, trendingIds } from '@/mocks/data/catalog'
import { getDb } from '@/mocks/db'
import { apiError, notFound } from '@/mocks/responses'
import { getScenario, simulate } from '@/mocks/scenarios'

const PAGE_SIZE = 9
const REVIEWS_PAGE_SIZE = 5
const DAY_MS = 86_400_000

function plain(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function list(params: URLSearchParams, key: string) {
  const raw = params.get(key)
  return raw ? raw.split(',').filter(Boolean) : undefined
}

function readQuery(url: URL) {
  const p = url.searchParams
  const page = p.get('page')
  const trending = p.get('trending')
  const listedWithinDays = p.get('listedWithinDays')
  return catalogQuery.safeParse({
    q: p.get('q') || undefined,
    categories: list(p, 'categories'),
    networks: list(p, 'networks'),
    collection: p.get('collection') || undefined,
    exclude: p.get('exclude') || undefined,
    minPrice: p.get('minPrice') || undefined,
    maxPrice: p.get('maxPrice') || undefined,
    trending: trending ? trending === 'true' : undefined,
    listedWithinDays: listedWithinDays ? Number(listedWithinDays) : undefined,
    sort: p.get('sort') || undefined,
    page: page ? Number(page) : undefined,
  })
}

type Facet = 'categories' | 'networks'

// ao contar as opções de um filtro, o próprio filtro fica de fora (senão marcar
// "music" zeraria o contador das outras categorias)
function matches(item: Nft, query: CatalogQuery, skip?: Facet) {
  if (query.q) {
    const haystack = plain(
      [item.name, item.collection.name, item.tokenId, ...item.traits.map((t) => t.value)].join(' '),
    )
    if (!haystack.includes(plain(query.q))) return false
  }
  if (skip !== 'categories' && query.categories?.length && !query.categories.includes(item.category)) return false
  if (skip !== 'networks' && query.networks?.length && !query.networks.includes(item.network)) return false
  if (query.collection && item.collection.id !== query.collection) return false
  if (query.exclude && item.id === query.exclude) return false
  if (query.minPrice && compareEth(item.price, query.minPrice) < 0) return false
  if (query.maxPrice && compareEth(item.price, query.maxPrice) > 0) return false
  if (query.trending && !trendingIds.has(item.id)) return false
  if (query.listedWithinDays) {
    if (Date.parse(item.createdAt) < MOCK_NOW - query.listedWithinDays * DAY_MS) return false
  }
  return true
}

function sortNfts(items: Nft[], sort: CatalogQuery['sort'] = 'recent') {
  const sorted = [...items]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.price, b.price))
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.price, a.price))
    case 'rating':
      return sorted.sort((a, b) => b.rating.average - a.rating.average)
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

function buildPage(all: Nft[], query: CatalogQuery): CatalogPage {
  const filtered = sortNfts(all.filter((n) => matches(n, query)), query.sort)
  const page = query.page ?? 1
  const start = (page - 1) * PAGE_SIZE

  const countBy = <K extends string>(keys: readonly K[], facet: Facet, pick: (n: Nft) => K) => {
    const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
    for (const item of all) if (matches(item, query, facet)) counts[pick(item)]++
    return counts
  }

  return {
    items: filtered.slice(start, start + PAGE_SIZE).map((n) => nftSummary.parse(n)),
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
    facets: {
      categories: countBy(categories, 'categories', (n) => n.category),
      networks: countBy(networks, 'networks', (n) => n.network),
    },
  }
}

export const catalogHandlers = [
  http.get('/api/nfts/featured', async () => {
    const failure = await simulate('featured')
    if (failure) return failure

    const items = getFeatured(getScenario('featured') === 'empty' ? [] : getDb().nfts).map(({ nft, badge }) => ({ nft: nftSummary.parse(nft), badge }))
    return HttpResponse.json(items)
  }),

  http.get('/api/nfts', async ({ request }) => {
    const failure = await simulate('nfts')
    if (failure) return failure

    const parsed = readQuery(new URL(request.url))
    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? 'query'), i.message]),
      )
      return apiError(422, 'VALIDATION', 'Parâmetros de busca inválidos.', { fields })
    }

    const all = getScenario('nfts') === 'empty' ? [] : getDb().nfts
    return HttpResponse.json(buildPage(all, parsed.data))
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const failure = await simulate('detail')
    if (failure) return failure

    const found = getScenario('detail') === 'empty' ? undefined : getDb().nfts.find((n) => n.id === params.id)
    return found ? HttpResponse.json(found) : notFound('NFT')
  }),

  http.get('/api/nfts/:id/reviews', async ({ params, request }) => {
    const failure = await simulate('reviews')
    if (failure) return failure

    const db = getDb()
    if (!db.nfts.some((n) => n.id === params.id)) return notFound('NFT')

    const page = Math.max(1, Number(new URL(request.url).searchParams.get('page')) || 1)
    const all = getScenario('reviews') === 'empty' ? [] : db.reviews
      .filter((r) => r.nftId === params.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * REVIEWS_PAGE_SIZE

    const body: ReviewsPage = {
      items: all.slice(start, start + REVIEWS_PAGE_SIZE).map((r) => review.parse(r)),
      page,
      pageSize: REVIEWS_PAGE_SIZE,
      total: all.length,
      totalPages: Math.ceil(all.length / REVIEWS_PAGE_SIZE),
    }
    return HttpResponse.json(body)
  }),
]
