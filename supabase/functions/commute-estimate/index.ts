import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Read API key from Supabase Edge Function secret only.
// Set via: Supabase Dashboard → Project Settings → Edge Functions → Secrets
// Name: GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY secret is not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'distance') {
      const { origin, destination, mode } = body
      if (!origin || !destination) {
        return new Response(JSON.stringify({ error: 'origin and destination required' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      const params = new URLSearchParams({
        origins: origin,
        destinations: destination,
        mode: mode || 'driving',
        units: 'imperial',
        key: GOOGLE_MAPS_API_KEY,
      })

      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
      )
      const data = await resp.json()

      return new Response(JSON.stringify(data), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reverse_geocode') {
      const { latlng } = body
      if (!latlng) {
        return new Response(JSON.stringify({ error: 'latlng required' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      const params = new URLSearchParams({
        latlng,
        key: GOOGLE_MAPS_API_KEY,
      })

      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
      )
      const data = await resp.json()

      return new Response(JSON.stringify(data), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'unknown action' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  }
})
