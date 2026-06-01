import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally — Echo needs this
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

// Coerce empty strings to a fallback (?? only handles null/undefined)
function valueOr(envValue: string | undefined, fallback: string): string {
  return envValue && envValue.trim() !== '' ? envValue : fallback
}

function createEcho(): Echo<'reverb'> | null {
  const key = valueOr(import.meta.env.VITE_REVERB_APP_KEY, 'projectflow-key')

  // Belt-and-braces: if for any reason key is still empty, bail out
  if (!key) {
    console.warn('[echo] no app key configured; real-time disabled')
    return null
  }

  try {
    return new Echo({
      broadcaster: 'reverb',
      key,
      wsHost:   valueOr(import.meta.env.VITE_REVERB_HOST, 'localhost'),
      wsPort:   Number(valueOr(import.meta.env.VITE_REVERB_PORT, '8080')),
      wssPort:  Number(valueOr(import.meta.env.VITE_REVERB_PORT, '8080')),
      forceTLS: valueOr(import.meta.env.VITE_REVERB_SCHEME, 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
    })
  } catch (err) {
    console.warn('[echo] real-time updates unavailable:', err)
    return null
  }
}

const echo = createEcho()

export default echo