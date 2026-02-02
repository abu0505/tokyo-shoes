// @ts-ignore
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    // Handle CORS Preflight Request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        // @ts-ignore
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        // @ts-ignore
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Parse Request Body
        const { productId } = await req.json()

        if (!productId) {
            throw new Error('Product ID is required')
        }

        // Fetch Product Details
        const { data: product, error: dbError } = await supabase
            .from('shoes')
            .select('*')
            .eq('id', productId)
            .single()

        if (dbError || !product) {
            return new Response(
                JSON.stringify({ error: 'Product not found' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404,
                }
            )
        }

        // Generate Share Data
        const origin = req.headers.get('origin') || 'https://tokyo-shoes.vercel.app'
        const shareUrl = `${origin}/product/${product.id}`
        const shareText = `Check out these ${product.name} at Tokyo Shoes!`

        return new Response(
            JSON.stringify({
                url: shareUrl,
                text: shareText,
                title: product.name
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})