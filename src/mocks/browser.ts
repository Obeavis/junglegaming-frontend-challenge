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

// o MSW chama registration.update() sem tratar a rejeição; o erro é inofensivo
function ignoreWorkerUpdateFailure() {
  window.addEventListener('unhandledrejection', (event) => {
    if (String(event.reason?.message).includes('Failed to update a ServiceWorker')) event.preventDefault()
  })
}

export async function startMocks() {
  ignoreWorkerUpdateFailure()
  resetFromUrl()
  await worker.start({ onUnhandledRequest: 'bypass' })
}
