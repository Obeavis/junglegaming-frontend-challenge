import type { Socket } from 'socket.io-client'
import { socketUrl } from '@/lib/socket-url'

// o cliente guarda a referência do WebSocket ao ser carregado; importado cedo demais ele pega o nativo
// e o MSW (que troca o WebSocket ao iniciar) não intercepta a conexão
// só WebSocket: o long-polling padrão do Socket.IO também não passaria pelo MSW
export async function createSocket(token: string | null): Promise<Socket> {
  const { io } = await import('socket.io-client')
  return io(socketUrl, {
    transports: ['websocket'],
    query: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
  })
}
