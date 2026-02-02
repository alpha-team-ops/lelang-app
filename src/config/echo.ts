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
  }

  console.log('🔧 Initializing Echo with config:', {
    broadcaster: config.broadcaster,
    key: config.key,
    wsHost: config.wsHost,
    wsPort: config.wsPort,
    forceTLS: config.forceTLS,
    scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
  })

  try {
    const echoInstance = new Echo(config as any)
    console.log('✅ Echo initialized successfully')
    
    // Monitor connection status
    setTimeout(() => {
      const socketId = echoInstance.connector.socketId()
      if (socketId) {
        console.log('✅ WebSocket connected! Socket ID:', socketId)
      } else {
        console.warn('⚠️ WebSocket may not be connected yet')
      }
    }, 1000)
    
    return echoInstance
  } catch (err) {
    console.error('❌ Error initializing Echo:', err)
    throw err
  }
}

let echoInstance: Echo<any> | null = null

export const getEcho = (): Echo<any> => {
  if (!echoInstance) {
    try {
      echoInstance = initializeEcho()
      console.log('🎯 Echo instance created and stored')
    } catch (err) {
      console.error('❌ Failed to create Echo instance:', err)
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
