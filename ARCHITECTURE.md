# Arquitetura

## Organização

```
src/
  routes/       configuração das rotas (TanStack Router, por arquivo) e guards
  pages/        telas e as seções de cada tela
  components/   interface compartilhada (ui = shadcn/ui, layout, nft, cart, wallet, auth)
  features/     lógica sem interface: sessão, carrinho, favoritos, tempo real, busca do catálogo
  domain/       contratos (zod), chamadas Axios e query options de cada recurso
  mocks/        camada de rede simulada: handlers, banco, cenários, Socket.IO
  lib/          http (Axios), eth (big.js), storage, utilitários
e2e/            testes Playwright
```

Dependências só descem: `pages` → `components`/`features`/`domain`; `components` → `features`/`domain`/`lib`; `features` → `domain`/`lib`. Nada importa de `pages`. Componentes, hooks e o cliente Axios não têm resposta fictícia nem caminho alternativo de negócio: tudo o que é simulado vive em `mocks/`.

## Contratos REST

Cada recurso tem um schema zod em `domain/<recurso>/schema.ts`; o cliente valida a resposta com ele, então transporte, estado e interface compartilham os mesmos tipos. Valores em ETH trafegam como strings decimais e são calculados com `big.js` (18 casas, truncando).

| Recurso | Rotas |
|---|---|
| Sessão | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout` |
| NFTs | `GET /api/nfts` (busca, filtros, ordenação, paginação, `facets`), `GET /api/nfts/:id`, `GET /api/nfts/:id/reviews`, `GET /api/nfts/featured`, `GET /api/nfts/spotlight` |
| Favoritos | `GET /api/favorites`, `PUT` e `DELETE /api/favorites/:nftId` |
| Carrinho | `GET /api/cart`, `POST /api/cart/items`, `PATCH` e `DELETE /api/cart/items/:id`, `PUT` e `DELETE /api/cart/coupon`, `POST /api/cart/merge`, `POST /api/cart/acknowledge` |
| Cotação | `POST /api/quote` (disponibilidade, cupom, desconto, taxa e total) |
| Pedidos | `POST /api/orders` (cabeçalho `Idempotency-Key`), `GET /api/orders`, `GET /api/orders/:id` |
| Perfil | `GET` e `PATCH /api/profile`, `PUT` e `DELETE /api/profile/avatar`, `PUT /api/profile/password` |
| Carteiras | `GET` e `POST /api/wallets`, `PUT /api/wallets/:id`, `POST /api/wallets/:id/connect` e `/disconnect` |

`GET /api/nfts` devolve, além dos itens, `facets.categories`, `facets.networks` e `facets.price` (`{ min, max }`). Os limites de preço ignoram a própria faixa e acompanham os demais filtros, e o campo é opcional no contrato: se não vier, o filtro mostra "indisponível" em vez de quebrar o catálogo.

Erros seguem `{ status, code, message, fields? }`: `VALIDATION` (422, com `fields`), `UNAUTHENTICATED` e `SESSION_EXPIRED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` e conflitos de disponibilidade (409: `QUOTE_STALE`, `QUOTE_EXPIRED`, `AVAILABILITY_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `WALLET_NOT_CONNECTED`) e `UNAVAILABLE` (503, transitório).

### Pedidos e idempotência

`POST /api/orders` exige `Idempotency-Key`. A mesma chave com o mesmo corpo devolve o mesmo pedido; a mesma chave com outro conteúdo devolve `409 IDEMPOTENCY_CONFLICT`. O cliente gera a chave por tentativa e a mantém enquanto o corpo for o mesmo. Se a resposta se perde (timeout), o pedido já existe: a tela guarda o corpo e a chave da tentativa e o reenvio repete os dois, inclusive quando o carrinho já foi esvaziado pelo servidor. O recibo é um retrato (`items`, `subtotal`, `discount`, `networkFee`, `total`, carteira e rede), e alterações posteriores no catálogo não o mudam. Pedido `confirmed` ou `refused` é terminal.

## Eventos em tempo real

| Evento | Dados | Efeito no cliente |
|---|---|---|
| `nft.updated` | `id`, `version`, `occurredAt`, `resource`, preço, preço anterior, `soldOut`, edições | Atualiza detalhe, listas, destaques e, com o NFT no carrinho, invalida o carrinho e a cotação, avisa por toast e por região `aria-live` |
| `order.updated` | `id`, `version`, `resource`, `status`, `txHash`, `explorerUrl`, `failureReason` | Aplica só se o pedido ainda está pendente; confirmado ou recusado nunca regride |

Todo evento carrega `id` estável, recurso e `version`. O `EventGuard` descarta o `id` já processado e qualquer versão menor ou igual à última vista do recurso; o cache confere a versão de novo ao aplicar. Eventos de pedido são privados: o servidor simulado confere a sessão a cada envio, então logout ou expiração cortam a entrega, e o cliente também descarta o que não é do usuário atual.

### Reconciliação entre REST e Socket.IO

O socket é um atalho de latência, não a fonte da verdade. Depois de uma queda, os eventos perdidos não voltam, então ao reconectar o cliente invalida catálogo, cotações, carrinho e pedidos do usuário e relê tudo do REST. Um pedido pendente também é relido a cada 2 s enquanto a tela estiver aberta, o que cobre o caso de o socket não voltar. Há um socket por sessão: ao entrar, sair ou trocar de usuário o anterior é encerrado, os listeners removidos e a guarda descartada. O estado da conexão aparece em `data-realtime` no `<html>`.

### Transporte e limitações do ambiente de mocks

- O servidor é simulado com `ws.link` do MSW e `@mswjs/socket.io-binding`, e o app usa o `socket.io-client` real. Só o transporte **WebSocket** funciona: o long-polling padrão do Socket.IO não passa pelo MSW.
- O MSW substitui o `WebSocket` global ao iniciar, e o `socket.io-client` guarda a referência ao carregar. Por isso o cliente é importado dinamicamente, depois de os mocks subirem. O endereço é um host fictício (`wss://realtime.kurio.mock`), que também evita capturar o WebSocket do HMR do Vite.
- O binding não implementa salas, namespaces nem broadcast, e não envia ping (o mock envia o ping de Engine.IO a cada 20 s).
- O "servidor" vive no navegador e o banco no `localStorage`: abas do mesmo navegador compartilham dados, mas navegadores e contextos diferentes são servidores independentes.

## Sessão

Login e cadastro devolvem um token, guardado em `localStorage` (`kurio.token`) e enviado pelo Axios em `Authorization`. A sessão dura 30 min no mock. Ao carregar a página o app consulta `GET /api/auth/session`, então a sessão sobrevive ao refresh. As rotas privadas (checkout, perfil, carteiras, favoritos e pedidos) passam por `requireSession`: sem sessão, o app volta à página de origem com o login aberto e o destino em `?redirect=`.

Quando uma requisição devolve `SESSION_EXPIRED` ou `UNAUTHENTICATED`, o app limpa o token e os dados privados e abre o login com o aviso, preservando a tela atual (inclusive durante o checkout). Depois de entrar, volta ao destino. Logout e troca de usuário apagam do cache tudo o que está sob `['user', id, ...]`, e o socket é recriado. Senhas só existem como hash com sal no mock.

## Carrinho

- **Visitante:** os itens ficam em `localStorage` (`kurio.guest-cart`). A tela monta o resumo com os detalhes dos NFTs, e a cotação é calculada pela API.
- **Usuário:** o carrinho é do servidor (`/api/cart`), por usuário. Ao entrar, os itens do visitante vão por `POST /api/cart/merge` (o servidor limita ao estoque) e o carrinho local é esvaziado antes de a sessão ser publicada, para o carrinho não ser lido vazio.
- Adicionar ao carrinho resolve a sessão no momento da ação: quem recarregou a página e clicou antes de a sessão chegar não vira "visitante" por engano.
- Toda mutation do carrinho cancela leituras em voo antes de enviar, para uma resposta antiga não desfazer o valor novo.
- O resumo (subtotal, desconto, taxa e total) vem sempre de `POST /api/quote`. Depois de uma compra confirmada, o servidor remove do carrinho só o que foi comprado.

## Estratégia de cache

| Dado | `staleTime` | Observação |
|---|---|---|
| Lista do catálogo | 30 s | `keepPreviousData` na paginação; a chave leva só os parâmetros enviados à API |
| Detalhe, destaques, avaliações | 60 s | O evento `nft.updated` atualiza o cache na hora |
| Sessão | 5 min | Sem retry |
| Carrinho | 30 s | Atualizado pelo retorno de cada mutation |
| Cotação | 0 | Sempre revalidada; é a referência para fechar o pedido |
| Perfil e carteiras | 5 min | Invalidados pelas mutations |
| Favoritos | 60 s | Atualização otimista |

- **Retries:** só falhas transitórias (sem resposta, 408 e 5xx), até 2 tentativas. Erro de validação, permissão ou conflito não muda ao repetir. Mutations não repetem sozinhas; o pedido usa a chave de idempotência.
- **Respostas obsoletas:** o Query cancela consultas substituídas (o `signal` chega ao Axios), e a cotação e a busca ficam atreladas aos parâmetros na chave. Com latência variável, a tela termina no resultado da última consulta.
- **Otimista com rollback:** favoritar atualiza o coração na hora e volta ao estado anterior se a API falhar.
- **Isolamento:** dados privados usam `['user', id, ...]`, e a sessão anterior é removida no logout.

## Acessibilidade e ajustes em relação ao layout

- Foco visível em todos os controles, link "Ir para o conteúdo", foco preso e devolvido ao gatilho em diálogos e drawers, `aria-describedby` e `role="alert"` nos erros dos campos, `aria-live` para mutations e tempo real, `prefers-reduced-motion` respeitado (o shimmer e as transições param).
- A home tem um `h1` oculto; os títulos dos slides do destaque são `h2`.
- Skeletons com as dimensões do conteúdo, sem deslocamento de layout.

## Desvios do Figma e decisões de UX

- **Pagamento no mobile:** o frame mostra só carteira, tipo e total. O formulário do colecionador, a observação e a lista de itens também aparecem no mobile, porque o desafio exige validação, revisão e fluxos responsivos.
- **Carteira obrigatória:** quem não tem carteira é levado a cadastrar uma em `/wallets` antes de comprar.
- **Nome ENS:** campo de texto com seletor de sufixo (`.eth`, `.btc`, `.sol`, `.crypto`, `.bnb`), guardado no contrato da carteira (`ensSuffix`).
- **Faixa de preço** vem da API, e "Aplicar" só entra na URL quando difere dos limites.
- **Avisos** (toasts) aparecem no topo, para não cobrirem os botões fixos do mobile.
- **Perfil, carteiras e lista de interesse** compartilham um menu lateral (desktop) e uma fileira de chips (mobile); o "voltar" dessas telas leva à home. Atividade, ofertas, downloads e suporte avisam que estão fora da demonstração.
- **Avatar:** é enviado e guardado, mas nenhuma tela o exibe além do próprio perfil.
- **Imagens dos NFTs** foram cortadas das exportações do Figma; a galeria repete a arte do próprio NFT.
- **Etherscan:** o link do recibo é simulado e avisa que está fora da demonstração.

## Performance

Ver [lighthouse/ANALISE.md](lighthouse/ANALISE.md). Desktop atinge todas as metas. No mobile, Accessibility, Best Practices e SEO atingem, mas Performance fica em 84 (início) e 86 (detalhe), abaixo dos 90 pedidos. A causa principal é estrutural: a primeira imagem só é descoberta depois de JavaScript, do MSW e da resposta da API simulada, tudo com CPU 4× mais lenta. A análise lista também o que foi tentado (cards acima da dobra com prioridade, `sizes` correto, divisão de código por rota) e o que ainda daria ganho.

## Limitações conhecidas

- Mobile abaixo da meta de Performance no Lighthouse (acima).
- Os testes E2E rodam contra o servidor de desenvolvimento do Vite, com uma nova tentativa por teste para absorver a carga de quatro workers em paralelo.
- A regressão visual usa as baselines geradas no sistema em que foram gravadas; em outro sistema operacional pode ser preciso regravar (`npm run test:e2e:visual:update`).
