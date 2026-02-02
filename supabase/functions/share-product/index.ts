import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const redirectUrl = url.searchParams.get('redirectUrl')

    if (!id || !redirectUrl) {
        return new Response('Missing id or redirectUrl parameters', {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const { data: shoe, error } = await supabaseClient
            .from('shoes')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !shoe) {
            console.error('Error fetching shoe:', error)
            // Fallback to direct redirect if product not found
            return new Response(null, {
                status: 302,
                headers: { ...corsHeaders, 'Location': redirectUrl }
            })
        }

        const price = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(shoe.price)

        const title = `${shoe.name} | Tokyo Shoes`
        const description = `Buy ${shoe.name} for ${price}. ${shoe.brand} - Available now at Tokyo Shoes.`

        // Optimize image (attempt to resize if using Supabase Storage)
        const image = `${shoe.image_url}?width=1200&quality=80&resize=contain`

        // IMPORTANT: Set og:url to THIS Edge Function URL, not the app URL.
        // Otherwise scrapers might follow the redirect/canonical and miss these tags.
        const currentUrl = url.href

        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <meta name="description" content="${description}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${currentUrl}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${currentUrl}">
        <meta property="twitter:title" content="${title}">
        <meta property="twitter:description" content="${description}">
        <meta property="twitter:image" content="${image}">
        
        <script>
          // Immediate redirect for real users
          window.location.href = "${redirectUrl}";
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="${redirectUrl}">${title}</a>...</p>
      </body>
      </html>
    `

        return new Response(html, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=3600, s-maxage=7200'
            },
        })

    } catch (error) {
        console.error('Error:', error)
        // Fallback to direct redirect on error
        return new Response(null, {
            status: 302,
            headers: { ...corsHeaders, 'Location': redirectUrl }
        })
    }
})
