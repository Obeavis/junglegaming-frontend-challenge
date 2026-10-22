import { HttpResponse } from 'msw'
import { storage } from '@/lib/storage'
import { apiError } from './responses'

export const scenarios = [
  'default',
  'empty',
  'slow',
  'jitter',
  'server-error',
  'offline',
  'timeout',
  'session-expired',
  'wallet-rejected',
] as const

export type ScenarioName = (typeof scenarios)[number]

export type Endpoint =
  | 'nfts'
  | 'featured'
  | 'detail'
  | 'reviews'
  | 'articles'
  | 'auth'
  | 'favorites'
  | 'profile'
  | 'wallets'

const KEY = 'kurio.mock.scenario'
const ON_KEY = 'kurio.mock.scenario.on'

function isScenario(value: string | null): value is ScenarioName {
  return scenarios.includes(value as ScenarioName)
}

// ?scenario=empty&on=featured escolhe o cenário e fica salvo
// o `on` limita aos endpoints listados, sem ele vale para todos
export function getScenario(endpoint?: Endpoint): ScenarioName {
  const params = new URLSearchParams(globalThis.location?.search)
  const fromUrl = params.get('scenario')
  if (isScenario(fromUrl)) {
    storage.set(KEY, fromUrl)
    storage.set(ON_KEY, params.get('on') ?? '')
  }

  const stored = storage.get(KEY)
  const name = isScenario(stored) ? stored : 'default'
  const on = (storage.get(ON_KEY) ?? '').split(',').filter(Boolean)
  if (endpoint && on.length && !on.includes(endpoint)) return 'default'
  return name
}

export function setScenario(name: ScenarioName, on: Endpoint[] = []) {
  storage.set(KEY, name)
  storage.set(ON_KEY, on.join(','))
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// atrasos (ms) usados em ordem, um por requisição
const normalDelays = [90, 150, 120, 200]
// no jitter uma resposta lenta pode chegar depois de uma mais nova
const jitterDelays = [1800, 150, 2400, 300, 900, 2100, 120, 1500]

let requestCount = 0

export async function simulate(endpoint?: Endpoint): Promise<Response | undefined> {
  const n = requestCount++

  switch (getScenario(endpoint)) {
    case 'offline':
      return HttpResponse.error()
    case 'server-error':
      await sleep(300)
      return apiError(503, 'UNAVAILABLE', 'Serviço temporariamente indisponível.')
    case 'timeout':
      // mais que o timeout do cliente (10s)
      await sleep(15_000)
      return undefined
    case 'slow':
      await sleep(3000)
      return undefined
    case 'jitter':
      await sleep(jitterDelays[n % jitterDelays.length])
      return undefined
    default:
      await sleep(normalDelays[n % normalDelays.length])
      return undefined
  }
}
