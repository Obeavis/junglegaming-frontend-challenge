import { setupWorker } from 'msw/browser'
import { resetDb } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios'

const worker = setupWorker(...handlers)

// ?mock-reset volta o banco e o cenário ao estado inicial e tira o parâmetro da URL
function resetFromUrl() {
  const url = new URL(location.href)
  if (!url.searchParams.has('mock-reset')) return

  resetDb()
  setScenario('default')
  url.searchParams.delete('mock-reset')
  history.replaceState(null, '', url)
}

export async function startMocks() {
  resetFromUrl()
  await worker.start({ onUnhandledRequest: 'bypass' })
}
