// @ts-ignore: Deno import is valid in Edge Functions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno import is valid in Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore: Deno is available in the runtime
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore: Deno is available in the runtime
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore: Deno is available in the runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRecord {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_cost?: number;
  subtotal: number;
  tax?: number;
  discount_code?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record: OrderRecord = payload.record;

    console.log(`Processing order webhook for order: ${record?.id}`);

    if (!RESEND_API_KEY) {
      console.error("CRITICAL: RESEND_API_KEY is missing!");
      return new Response("Error: Missing Resend Key", { status: 500, headers: corsHeaders });
    }

    // 1. Setup Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 2. Get User Email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(record.user_id);
    if (userError || !userData.user?.email) {
      console.error("Error finding user:", userError);
      return new Response("Error: User not found", { status: 404, headers: corsHeaders });
    }
    const userEmail = userData.user.email;
    console.log(`Sending order email for order: ${record.id}`);

    // 3. Get Order Items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`quantity, size, price, shoes (name, image_url)`)
      .eq("order_id", record.id);

    if (itemsError) console.error("Error fetching items:", itemsError);

    // 4. Prepare Data for Email
    const userName = userData.user.user_metadata?.full_name?.split(' ')[0] || "Customer";
    const shortOrderId = `TK-${record.id.slice(0, 5).toUpperCase()}`;
    const orderDate = new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTotal = `₹${record.total.toLocaleString('en-IN')}`;

    // Calculate discount if applicable
    // total = subtotal + tax + shipping - discount
    // => discount = subtotal + tax + shipping - total
    const discountAmount = (record.subtotal + (record.tax || 0) + (record.shipping_cost || 0)) - record.total;
    const hasDiscount = discountAmount > 1; // Allow for small floating point diffs, or just > 0

    // 5. Generate HTML
    // @ts-ignore: Type checking
    const itemsHtml = orderItems?.map((item: any) => {
      const imageUrl = item.shoes?.image_url;
      const itemName = item.shoes?.name || 'Shoe';
      const itemPrice = `₹${item.price.toLocaleString('en-IN')}`;
      const imageDisplay = imageUrl
        ? `<img src="${imageUrl}" alt="${itemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; display: block;" />`
        : `<div style="width: 60px; height: 60px; background-color: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">No Image</div>`;

      return `
        <tr>
          <!-- Column 1: Image -->
          <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; width: 70px; vertical-align: top;">
            ${imageDisplay}
          </td>
          <!-- Column 2: Details -->
          <td style="padding: 16px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
            <div style="font-size: 14px; font-weight: 700; color: #111; margin-bottom: 4px;">${itemName}</div>
            <div style="font-size: 13px; color: #666;">Size: ${item.size}</div>
          </td>
          <!-- Column 3: Price -->
          <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; text-align: right;">
            <div style="font-size: 14px; font-weight: 700; color: #111;">${itemPrice}</div>
          </td>
        </tr>
      `;
    }).join("") || "";

    // 6. Send to Resend & LOG THE RESULT
    console.log("Attempting to send email via Resend...");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tokyo Shoes <onboarding@resend.dev>", // MUST BE THIS for testing
        to: [userEmail],
        subject: `Order Confirmed: #${shortOrderId}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @media only screen and (max-width: 600px) {
                  .mobile-container {
                    padding: 0 !important;
                  }
                  .mobile-header {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                  }
                  .mobile-content {
                    padding-left: 5px !important;
                    padding-right: 5px !important;
                  }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #111;">
              
              <div class="mobile-container" style="background-color: #f4f4f5; padding: 40px 20px;">
                
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  
                  <!-- Restored Header -->
                  <div class="mobile-header" style="background-color: #111111; padding: 32px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Tokyo Shoes</h1>
                  </div>

                  <div class="mobile-content" style="padding: 40px 30px;">
                    
                    <!-- Personalized Greeting -->
                    <div style="margin-bottom: 24px;">
                      <h1 style="font-size: 24px; font-weight: 700; color: #111; margin: 0 0 8px 0;">Order Confirmed</h1>
                      <p style="font-size: 16px; color: #444; margin: 0;">Hey ${userName}, your order has been successfully placed.</p>
                    </div>

                    <!-- Main Order Card (Boxed Layout) -->
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
                      
                      <!-- Order Header Row (Number & Date) -->
                      <table style="width: 100%; margin-bottom: 24px;">
                        <tr>
                          <td style="vertical-align: top;">
                            <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Order Number</div>
                            <div style="font-size: 16px; font-weight: 700; color: #111;">#${shortOrderId}</div>
                          </td>
                          <td style="vertical-align: top; text-align: right;">
                            <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Order Date</div>
                            <div style="font-size: 16px; font-weight: 700; color: #111;">${orderDate}</div>
                          </td>
                        </tr>
                      </table>

                      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 0 0 8px 0;" />

                      <!-- Items Table -->
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        ${itemsHtml}
                      </table>

                      <!-- Summary Section -->
                      <div style="padding-top: 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                        <td style="padding-bottom: 8px; color: #666; font-size: 14px;">Subtotal</td>
                        <td style="padding-bottom: 8px; text-align: right; color: #111; font-weight: 600; font-size: 14px;">₹${(record.total - (record.shipping_cost || 0)).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px; color: #666; font-size: 14px; border-bottom: 1px dotted #eee;">${(record.shipping_cost || 0) > 0 ? 'Express Shipping' : 'Standard Shipping'}</td>
                        <td style="padding-bottom: 16px; text-align: right; color: #111; font-weight: 600; font-size: 14px; border-bottom: 1px dotted #eee;">${(record.shipping_cost || 0) > 0 ? '₹' + record.shipping_cost : 'Free'}</td>
                      </tr>
                      ${hasDiscount ? `
                      <tr>
                        <td style="padding-bottom: 16px; color: #16a34a; font-size: 14px; border-bottom: 1px dotted #eee;">Discount ${record.discount_code ? `(${record.discount_code})` : ''}</td>
                        <td style="padding-bottom: 16px; text-align: right; color: #16a34a; font-weight: 600; font-size: 14px; border-bottom: 1px dotted #eee;">-₹${Math.round(discountAmount).toLocaleString('en-IN')}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding-top: 16px; font-size: 18px; font-weight: 800; color: #111;">Total</td>
                        <td style="padding-top: 16px; text-align: right; font-size: 18px; font-weight: 800; color: #111;">${formattedTotal}</td>
                      </tr>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Restored Footer Background Area -->
                  <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.5;">
                      Thank you for your order.<br/>
                      Questions? Reply to this email.
                    </p>
                  </div>
                </div>

              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await res.json();

    console.log("Resend API Status:", res.status);

    if (!res.ok) {
      console.error("RESEND FAILED:", data);
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);