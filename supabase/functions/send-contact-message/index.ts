// @ts-ignore: Deno import is valid in Edge Functions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// @ts-ignore: Deno is available in the runtime
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore: Deno is available in the runtime
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "abuturabshaikh45@gmail.com"; // Fallback to a likely email or placeholder

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: ContactPayload = await req.json();
        const { name, email, subject, message } = payload;

        // Validate payload
        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: name, email, subject, message" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!RESEND_API_KEY) {
            console.error("CRITICAL: RESEND_API_KEY is missing!");
            return new Response(
                JSON.stringify({ error: "Server misconfiguration: Missing Resend Key" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Received contact message from: ${name} <${email}>`);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Tokyo Shoes <onboarding@resend.dev>",
                to: [ADMIN_EMAIL],
                reply_to: email,
                subject: `New Contact Inquiry: ${subject}`,
                html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                .header { background: #f4f4f5; padding: 10px 20px; border-radius: 6px; margin-bottom: 20px; }
                .label { font-weight: bold; color: #666; font-size: 0.9em; text-transform: uppercase; margin-top: 15px; }
                .value { font-size: 1.1em; margin-bottom: 5px; }
                .message-box { background: #fafafa; padding: 15px; border-radius: 6px; border-left: 4px solid #333; margin-top: 10px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin:0;">New Contact Message</h2>
                </div>
                
                <div class="label">From</div>
                <div class="value">${name} &lt;<a href="mailto:${email}">${email}</a>&gt;</div>
                
                <div class="label">Subject</div>
                <div class="value">${subject}</div>
                
                <div class="label">Message</div>
                <div class="message-box">${message}</div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                <p style="font-size: 0.8em; color: #999; text-align: center;">
                  Received via Tokyo Shoes Contact Form
                </p>
              </div>
            </body>
          </html>
        `,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error processing request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
};

serve(handler);
