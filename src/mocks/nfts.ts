import Big from 'big.js'
import type { Nft } from '@/domain/catalog/schema'
import { compareEth, normalizeEth } from '@/lib/eth'
import { saveDb } from '@/mocks/db'
import { publishNft } from '@/mocks/realtime'

// toda mudança de preço ou estoque passa por aqui, para o REST e o evento mostrarem o mesmo
export function touchNft(nft: Nft) {
  nft.soldOut = nft.editions.every((e) => e.available === 0)
  nft.version++
  saveDb()
  publishNft(nft)
}

// as edições mantêm a proporção que tinham com o preço-base
export function repriceNft(nft: Nft, price: string) {
  const ratio = new Big(price).div(nft.price)
  for (const edition of nft.editions) {
    edition.price = normalizeEth(new Big(edition.price).times(ratio))
  }
  nft.previousPrice = compareEth(price, nft.price) < 0 ? nft.price : null
  nft.price = normalizeEth(price)
  touchNft(nft)
}
