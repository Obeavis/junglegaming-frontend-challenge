# Kurio — NFT Marketplace

[![Deploy with Vercel](https://vercel.com/button)](https://junglegaming-frontend-challenge-eight.vercel.app/)

🚀 **Deploy em produção:** https://junglegaming-frontend-challenge-eight.vercel.app/

Enunciado original: [docs/ENUNCIADO.md](docs/ENUNCIADO.md) · Decisões técnicas: [ARCHITECTURE.md](ARCHITECTURE.md) · Lighthouse: [lighthouse/RESULTS.md](lighthouse/RESULTS.md) e [lighthouse/ANALISE.md](lighthouse/ANALISE.md)

Marketplace de NFTs em React + TypeScript (desafio frontend Jungle Gaming): descoberta, compra e conta do colecionador, em desktop e mobile. Todas as APIs, a autenticação, as carteiras, os pagamentos e o tempo real são simulados na camada de rede com MSW. Não há backend nem blockchain.

## Destaques

- **Mocks que se comportam como um backend.** Handlers REST e um servidor Socket.IO simulado (`wss://realtime.kurio.mock`) rodando no navegador, com banco persistido em `localStorage`, validação, erros com código (`QUOTE_STALE`, `SESSION_EXPIRED`...) e senhas só como hash SHA-256 com sal. A interface não sabe que fala com um mock.
- **15 cenários de falha reproduzíveis**, por URL ou pelo painel de mocks: latência, respostas fora de ordem, 503, offline, timeout, sessão expirada, preço e estoque mudando no meio da compra, pagamento recusado, pedido pendente, socket fora do ar.
- **Compra idempotente.** Cada pedido leva uma `Idempotency-Key`: se a resposta se perde por timeout, "Confirmar compra" reenvia o mesmo corpo e recupera o pedido já criado, sem duplicar. Clique repetido também não duplica.
- **Tempo real com reconciliação.** `nft.updated` e `order.updated` chegam por Socket.IO só com WebSocket, com deduplicação por id e versão (duplicados e eventos antigos são descartados). Ao reconectar, o app invalida as queries e se reconcilia com a REST; recarregar a página com pedido pendente também recupera o estado.
- **Cache pensado por recurso.** Chaves de query por usuário, `staleTime` por tipo de dado, retry só em erro transitório, favoritos otimistas com rollback, carrinho do visitante em `localStorage` que se mescla ao do servidor no login.
- **Sessão tratada de ponta a ponta.** Rota privada sem sessão abre o login e, depois de entrar, volta ao destino; sessão expirada avisa e retoma a tela em que o usuário estava.
- **Acessibilidade verificada em teste.** Navegação por teclado, foco preso e devolvido em diálogos e drawers, erros ligados por `aria-describedby`, `prefers-reduced-motion`, textos alternativos e zoom.
- **Estados de carregamento sem salto.** Skeletons com as dimensões do conteúdo e shimmer (CLS ≤ 0,017).
- **256 execuções E2E** (desktop e mobile) contra os mocks reais, sem interceptar rede no Playwright, mais regressão visual com baselines versionadas.
- **Arquitetura em camadas** com dependências só para baixo (`routes` → `pages` → `components` → `features` → `domain`), detalhada no [ARCHITECTURE.md](ARCHITECTURE.md).

## Stack

React 19 · TypeScript 5.9 · Vite 7 · TanStack Router (rotas por arquivo) · TanStack Query 5 · Axios · Socket.IO Client 4 · Tailwind CSS 4 · shadcn/ui (Radix) · MSW 2.12 + `@mswjs/socket.io-binding` · Zod 4 · React Hook Form · big.js · Playwright · Lighthouse.

## Setup

Requisitos: Node 20.19+ e npm 10.

```bash
npm ci
npx playwright install chromium   # navegador dos testes E2E e do Lighthouse
npm run dev                       # http://localhost:5173 (mocks ativos)
```

### Variáveis de ambiente

Ficam versionadas em `.env`, `.env.example` e `.env.production`, porque não são segredos (variáveis `VITE_*` vão para o bundle de qualquer forma) e a demo publicada também usa os mocks. Valores locais ou secretos ficam em `.env.local`, que o git ignora.

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW (REST + Socket.IO simulados) e o painel de mocks. Obrigatória na demo. |
| `VITE_SOCKET_URL` | `wss://realtime.kurio.mock` | Servidor Socket.IO (fictício, interceptado pelo MSW). |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Typecheck + build otimizado (`dist/`) |
| `npm run preview` | Serve o build em http://localhost:4173 |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (sobe o dev server sozinho; projetos `desktop` e `mobile`) |
| `npm run test:e2e:mobile` | Só o projeto mobile |
| `npm run test:e2e:visual:update` | Atualiza as baselines de regressão visual |
| `npm run test:e2e:report` | Abre o relatório HTML (traces das falhas incluídos) |
| `npm run lighthouse` | Build + 3 execuções do Lighthouse por página e perfil (relatórios em `lighthouse/reports`, mediana em `lighthouse/RESULTS.md`) |

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
|---|---|---|---|
| Juliana | `juliana@kurio.dev` | `Kurio@2026` | Carteiras principal e secundária, 2 favoritos |
| Theo | `theo@kurio.dev` | `Kurio@2026` | Nada cadastrado: serve para o fluxo "sem carteira" e para o cadastro de carteiras |

As senhas são guardadas como hash SHA-256 com sal no banco simulado. Nenhuma fica em texto claro.

Cupons: `WELCOME10` (10%), `COLLECTOR5` (5%) e `SUMMER25` (expirado). Qualquer outro código é inválido.

## Cenários de simulação

Três formas de ativar:

- **URL:** `/?scenario=<nome>&on=<endpoint,endpoint>` (sem `on`, vale para todos os endpoints).
- **Painel de mocks:** botão de fogo no canto inferior direito, com três abas: **Cenários**, **Tempo real** (altera preço ou estoque, reenvia eventos duplicados e antigos, liquida pedido pendente, derruba o socket) e **Dados** (restaura o estado inicial).
- **Testes:** rotas de apoio em `/api/__mock/*`, usadas pelo painel e pelo Playwright.

| Cenário | Efeito |
|---|---|
| `default` | Tudo funciona, com 90 a 200 ms de latência |
| `empty` | Listas vazias |
| `slow` | 3 s de atraso por requisição |
| `jitter` | Latência variável: respostas chegam fora de ordem |
| `server-error` | 503 (falha transitória; o cliente tenta de novo até 2 vezes) |
| `offline` | Falha de conexão |
| `timeout` | Resposta depois do tempo limite do cliente (10 s) |
| `session-expired` | `SESSION_EXPIRED` nas rotas afetadas |
| `wallet-rejected` | A carteira recusa a conexão |
| `price-changed` | O preço sobe 10% durante a compra (409 e nova revisão) |
| `sold-out` | A edição esgota durante a compra |
| `order-timeout` | O pedido é criado, mas a resposta chega depois do timeout |
| `payment-refused` | O pagamento é recusado |
| `manual-settlement` | O pedido fica pendente até ser liquidado pelo painel |
| `socket-offline` | O servidor de socket não aceita conexões |

**Reset:** acesse `/?mock-reset` ou use a aba **Dados** do painel. O banco volta às fixtures e o cenário é limpo.

### Reproduzindo os fluxos de falha

1. **Pagamento recusado:** cenário `payment-refused` em `orders` e finalize uma compra. A tela mostra a recusa e o carrinho continua intacto.
2. **Timeout com recuperação:** `order-timeout` em `orders` e confirme. Depois do aviso, "Confirmar compra" reenvia o mesmo corpo com a mesma chave de idempotência e recupera o pedido já criado, sem duplicar.
3. **Preço alterado durante a compra:** `price-changed` em `orders`, ou mude o preço pela aba Tempo real com o pagamento aberto. A confirmação fica bloqueada até "Aceitar novos valores".
4. **Pedido pendente e queda do socket:** `manual-settlement` em `orders`, finalize, derrube a conexão e liquide o pedido pelo painel. Ao reconectar a tela se reconcilia com a API; recarregar também recupera o estado.
5. **Sessão expirada:** `session-expired` em `wallets`, `profile` ou `orders`. O login abre com o aviso e, depois de entrar, você volta à tela em que estava.
6. **Erro e recuperação:** `server-error` (ou `offline`/`timeout`) em `nfts`, `detail`, `cart` ou `reviews`, e "Tentar novamente" depois de voltar ao `default`.

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Início (destaques, catálogo, busca, filtros, ordenação, paginação na URL) | público |
| `/nft/:id` | Detalhe do NFT | público |
| `/cart` | Carrinho (visitante ou usuário) | público |
| `/checkout` | Pagamento | autenticado |
| `/orders/:orderId` | Pedido pendente, recibo confirmado ou recusado | autenticado |
| `/profile`, `/wallets`, `/favorites` | Conta do colecionador | autenticado |

O login abre em diálogo, e o `?redirect=` devolve o usuário ao fluxo de origem.

## Testes

12 arquivos Playwright em `e2e/`, todos contra o app com os mocks reais (sem interceptar rede). Cada teste roda num contexto novo e, como o banco do mock fica no `localStorage`, parte sempre do estado inicial. O projeto `desktop` (1440 px) roda tudo; o `mobile` (390 px) roda os fluxos marcados com `@mobile`. Alguns testes pulam no layout em que o fluxo não existe (por exemplo, o drawer de filtros só existe no mobile).

| Arquivo | Cobre |
|---|---|
| `catalog` | busca, filtros combinados, ordenação, paginação, histórico, URL inválida, faixa de preço da API |
| `detail` | acesso direto, NFT inexistente, edições, limites de quantidade, zoom, avaliações |
| `auth` | cadastro (validação e conflito), login, sessão, expiração, logout e troca de usuário |
| `favorites` | favoritar, falha da mutation com rollback e recuperação, persistência |
| `cart` | quantidades, remoção, cupom, persistência no refresh e no login, aviso de preço |
| `checkout` | compra completa, recibo, pagamento recusado, clique repetido, timeout com idempotência, preço e estoque durante a compra, pedido pendente |
| `realtime` | `nft.updated` e `order.updated` pelo Socket.IO, eventos duplicados e antigos, queda e reconexão, um socket por sessão |
| `account` | perfil, avatar, senha e carteiras, com erros de validação |
| `a11y` | teclado, foco em diálogos e drawers, rótulos e erros, alternativas textuais, movimento reduzido, zoom |
| `loading` | skeletons com shimmer, falhas, recuperação, latência variável e respostas fora de ordem |
| `responsive` | 390, 768 e 1440 px sem rolagem horizontal |
| `visual` | regressão visual de início, detalhe, carrinho, pagamento, confirmação, login, carteiras e perfil |

O relatório HTML da última execução completa está versionado em `e2e/report` (abra `e2e/report/index.html` ou rode `npm run test:e2e:report`). Os traces são gravados em `e2e/.results` só quando um teste falha, por isso não vão para o git. As baselines visuais estão versionadas em `e2e/__screenshots__`.

## Lighthouse

Mediana de 3 medições por página e perfil, contra o build de produção com os mocks ligados:

| Página | Perfil | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Início | desktop | 99 | 96 | 100 | 92 |
| Detalhe | desktop | 99 | 100 | 100 | 92 |
| Início | mobile | **84** | 96 | 100 | 92 |
| Detalhe | mobile | **86** | 100 | 100 | 92 |

Tudo atinge a meta, exceto **Performance no mobile** (84 e 86 contra 90). A causa é estrutural: SPA com os mocks no navegador, então as imagens só são descobertas depois de HTML → JS → MSW → API simulada → render. Decidimos manter as animações e a entrega completa em vez de simplificar a página só para a nota. A [análise](lighthouse/ANALISE.md) detalha as causas, o que já foi feito e o que ainda daria ganho. Relatórios HTML e JSON de cada medição estão em `lighthouse/reports/`.

## Uso de IA

Usei o Claude Code como assistente durante o desenvolvimento, principalmente na suíte E2E, nos scripts do Lighthouse e na documentação. Revisei e adaptei o que foi gerado, e as decisões de arquitetura estão registradas no [ARCHITECTURE.md](ARCHITECTURE.md).

## Deploy (Vercel)

Produção: https://junglegaming-frontend-challenge-eight.vercel.app/

- Importe o repositório na Vercel (framework Vite, build `npm run build`, saída `dist`).
- Não é preciso configurar variáveis: `.env.production` já liga os mocks.
- O `vercel.json` reescreve todas as rotas para `index.html`, então acesso direto e refresh funcionam.
