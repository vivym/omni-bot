import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../backend/src/routers/index.js'

const base_url = process.env.BASE_URL || 'http://localhost:3000/api/trpc'
const wsClient = createWSClient({ url: base_url.replace('http://', 'ws://') })

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    splitLink({
      condition(op) {
        return op.type === 'subscription'
      },
      true: wsLink({ client: wsClient }),
      false: httpBatchLink({
        url: base_url,
        headers: {
          Authorization: `Bearer ${process.env.OMNI_AI_TOKEN}`,
        },
      }),
    }),
  ],
})

export function closeTRPCClient() {
  wsClient.close()
}
