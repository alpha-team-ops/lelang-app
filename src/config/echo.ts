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
    const echoInstance = new Echo(config as any)
    
    // 🚀 Check connection faster (500ms instead of 1000ms)
    setTimeout(() => {
      const socketId = echoInstance.connector.socketId()
    }, 500)
    
    return echoInstance
  } catch (err) {
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
