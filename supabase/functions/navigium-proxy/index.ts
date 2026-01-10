import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const N8N_BASE_URL = "https://n8n.nemserver.duckdns.org/webhook/navigium"
const INTERNAL_KEY = "BANANA"

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    let n8nUrl: string
    let method = 'POST'

    switch (action) {
      case 'login':
        n8nUrl = `${N8N_BASE_URL}/login`
        break
      case 'setpoints':
        n8nUrl = `${N8N_BASE_URL}/setpoints`
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log(`Proxying request to: ${n8nUrl}`)
    console.log(`Params: ${JSON.stringify(params)}`)

    const response = await fetch(n8nUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY,
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()
    console.log(`Response from n8n: ${JSON.stringify(data)}`)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Request failed', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Proxy error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
