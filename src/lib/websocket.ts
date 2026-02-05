import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

(window as any).Pusher = Pusher

export const createEchoInstance = (authToken: string | null = null): Echo<any> => {
  const config: any = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'default-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    maxReconnectionDelay: 5000,
    reconnectionDelay: 1000,
  }

  // Add auth headers if token provided
  if (authToken) {
    config.auth = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  }

  // Suppress Pusher connection errors
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = (...args: any[]) => {
    const message = args[0]?.toString?.() || ''
    if (!message.includes('WebSocket connection to')) {
      originalLog(...args)
    }
  }

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString?.() || ''
    if (!message.includes('WebSocket') && !message.includes('connection') && !message.includes('closed')) {
      originalWarn(...args)
    }
  }

  console.error = (...args: any[]) => {
    const message = args[0]?.toString?.() || ''
    if (!message.includes('WebSocket') && !message.includes('connection') && !message.includes('failed')) {
      originalError(...args)
    }
  }

  const echoInstance = new Echo(config)

  // Restore console
  console.log = originalLog
  console.warn = originalWarn
  console.error = originalError

  return echoInstance
}
