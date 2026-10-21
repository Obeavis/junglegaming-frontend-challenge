import type { ArticleSummary } from '@/domain/articles/schema'
import type { Nft, Review } from '@/domain/catalog/schema'
import { storage } from '@/lib/storage'
import { buildArticles } from '@/mocks/data/articles'
import { buildCatalog } from '@/mocks/data/catalog'
import { createUsers, type StoredUser } from '@/mocks/fixtures/users'

// sobe o número quando o formato do banco muda, para ignorar dados antigos do navegador
const KEY = 'kurio.mock.db.v7'

export type ReviewRecord = Review & { nftId: string }

export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

export interface Db {
  nfts: Nft[]
  reviews: ReviewRecord[]
  articles: ArticleSummary[]
  users: StoredUser[]
  sessions: StoredSession[]
}

let cache: Db | null = null

function seed(): Db {
  return {
    ...buildCatalog(),
    articles: buildArticles(),
    users: createUsers(),
    sessions: [],
  }
}

function load(): Db {
  const raw = storage.get(KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Db
    } catch {
      // dado corrompido, volta para o seed
    }
  }
  return seed()
}

export function getDb(): Db {
  cache ??= load()
  return cache
}

export function saveDb() {
  storage.set(KEY, JSON.stringify(getDb()))
}

export function resetDb() {
  cache = seed()
  saveDb()
}
