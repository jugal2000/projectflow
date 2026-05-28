import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally (Echo needs this)
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<'reverb'>
  }
}

window.Pusher = Pusher

// Create the Echo instance that connects to Laravel Reverb
const echo = new Echo({
  broadcaster: 'reverb',
  key:         import.meta.env.VITE_REVERB_APP_KEY,
  wsHost:      import.meta.env.VITE_REVERB_HOST,
  wsPort:      Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  wssPort:     Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
  forceTLS:    (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
})

export default echo