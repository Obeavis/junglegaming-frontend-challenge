import type { Category, CatalogQuery, Network, Rarity } from '@/domain/catalog/schema'
import type { WalletProvider } from '@/domain/wallets/schema'
import type { CatalogSearch } from './search'

export const categoryLabels: Record<Category, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
}

export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const rarityLabels: Record<Exclude<Rarity, 'common'>, string> = {
  rare: 'Raro',
  epic: 'Épico',
}

export const sortLabels: Record<NonNullable<CatalogQuery['sort']>, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  rating: 'Mais bem avaliados',
}

export const tabLabels: Record<NonNullable<CatalogSearch['tab']>, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const providerLabels: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  'coinbase-wallet': 'Coinbase Wallet',
}
