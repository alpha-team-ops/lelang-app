import Echo from 'laravel-echo'

// Mock Pusher - prevent Echo from trying actual Pusher fallback
// Reverb uses Pusher-compatible protocol but we intercept it at WebSocket level
// @ts-ignore
class MockPusher {
  constructor(_options?: any) {}
  subscribe(_channel: string) { return { bind: (_event: string, _callback: any) => {}, unbind: (_event: string) => {} } }
  unsubscribe(_channel: string) {}
  disconnect() {}
}

(window as any).Pusher = MockPusher

// Global Echo instance (singleton) - created ONCE, reused forever
let echoInstance: Echo<any> | null = null

/**
 * Get or create a singleton Echo instance
 * Reuses same instance across entire app
 */
export const getEchoInstance = (authToken: string | null = null): Echo<any> => {
  // Return existing instance if available (ALWAYS)
  if (echoInstance) {
    // Ensure Echo is always exposed to window
    (window as any).Echo = echoInstance
    console.log(`♻️ [WS] Reusing existing Echo instance`)
    return echoInstance
  }

  // Create instance ONCE on first call
  console.log(`🔄 [WS] Creating new Echo instance...`)
  const newInstance = createEchoInstance(authToken)
  echoInstance = newInstance as Echo<any>
  
  // Expose Echo globally so it's accessible from console and app
  (window as any).Echo = echoInstance
  
  return echoInstance
}

/**
 * Create Echo instance with WebSocket connection to Reverb
 * 
 * Configuration:
 * - VITE_REVERB_APP_KEY: Reverb app key (from .env.local)
 * - VITE_REVERB_HOST: WebSocket host (e.g., localhost, your-domain.com)
 * - VITE_REVERB_PORT: WebSocket port (e.g., 8000 for proxied via Nginx)
 * - VITE_REVERB_SCHEME: Protocol scheme (http → ws://, https → wss://)
 * 
 * @param authToken Optional Bearer token for authenticated connections
 * @returns Echo instance ready for subscribing to channels and listening to events
 */
export const createEchoInstance = (authToken: string | null = null): Echo<any> => {
  // Minimal config - hanya yang perlu
  const config: any = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: parseInt(import.meta.env.VITE_REVERB_PORT),
    wsPath: '/app',
    forceTLS: false,
    enabledTransports: ['ws'],  // Hanya WebSocket, jangan fallback
  }

  // Log WebSocket config once
  const fullUrl = `ws://${config.host}:${config.port}${config.wsPath}/${config.key}`
  console.log(`📍 [WebSocket] Connecting to: ${fullUrl}`)

  // Add auth headers if token provided
  if (authToken) {
    config.auth = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  }

  // Create Echo instance
  const echoInstance: any = new Echo(config)

  // Log connection
  try {
    const connector = echoInstance.connector as any
    if (connector.socket) {
      connector.socket.on('open', () => {
        console.log('✅ [WS] Socket OPEN!')
      })
      connector.socket.on('error', (err: any) => {
        console.error('❌ [WS] Socket ERROR:', err.message || err)
      })
      connector.socket.on('close', () => {
        console.log('⚠️ [WS] Socket CLOSED')
      })
    }
  } catch (e) {
    // Connector type tidak available
  }

  return echoInstance
}
