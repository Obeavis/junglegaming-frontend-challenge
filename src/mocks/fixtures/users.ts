// senhas de demonstração: marina / Kurio@123, theo / Theo@4567
export interface StoredUser {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  walletNickname: string
  avatar: string | null
  salt: string
  passwordHash: string
  createdAt: string
}

export function createUsers(): StoredUser[] {
  return [
    {
      id: 'usr_marina',
      username: 'marina',
      email: 'marina@kurio.dev',
      displayName: 'Marina Costa',
      ensName: 'marina',
      walletNickname: 'Carteira do dia a dia',
      avatar: null,
      salt: 'a1f3c2d4e5b60718293a4b5c6d7e8f90',
      passwordHash: '3c2f98566e22b0866fcbae50ff31ca758c29ea07f114aa72f3b1cd3f319a8bbe',
      createdAt: '2026-06-12T10:00:00.000Z',
    },
    {
      id: 'usr_theo',
      username: 'theo',
      email: 'theo@kurio.dev',
      displayName: 'Theo Marlowe',
      ensName: 'theo',
      walletNickname: 'Cofre frio',
      avatar: null,
      salt: '0f9e8d7c6b5a49382716f5e4d3c2b1a0',
      passwordHash: '5af9a47655eeece95c588336cae52378b3212bcbca20e923085c7e7636bebb42',
      createdAt: '2026-07-03T15:30:00.000Z',
    },
  ]
}
