import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Initialize Echo with Reverb (WebSocket server)
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<any>
  }
}

window.Pusher = Pusher

export const initializeEcho = () => {
  const config = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'default-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    maxReconnectionDelay: 5000, // 🚀 Faster reconnection
    reconnectionDelay: 1000,    // 🚀 Faster initial reconnection
  }

  try {
    // Suppress Pusher connection errors (Reverb not running is expected in dev)
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    
    // Filter for pusher-js noise during initialization
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
    
    const echoInstance = new Echo(config as any)
    
    // Restore console immediately after Echo init
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
    
    return echoInstance
  } catch (err) {
    console.error('❌ Failed to initialize WebSocket:', err)
    throw err
  }
}

let echoInstance: Echo<any> | null = null

export const getEcho = (): Echo<any> => {
  if (!echoInstance) {
    try {
      echoInstance = initializeEcho()
    } catch (err) {
      throw err
    }
  }
  return echoInstance
}

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
