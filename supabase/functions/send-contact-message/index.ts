// @ts-ignore: Deno import is valid in Edge Functions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// @ts-ignore: Deno is available in the runtime
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore: Deno is available in the runtime
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "abuturabshaikh45@gmail.com";

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

// HTML entity escaping to prevent XSS in emails
const escapeHtml = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const isRateLimited = (key: string): boolean => {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Rate limit by IP
        const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
        if (isRateLimited(clientIP)) {
            return new Response(
                JSON.stringify({ error: "Too many requests. Please try again later." }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const payload: ContactPayload = await req.json();
        const { name, email, subject, message } = payload;

        // Validate payload
        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: name, email, subject, message" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Input length validation
        if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 2000) {
            return new Response(
                JSON.stringify({ error: "Input exceeds maximum allowed length" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: "Invalid email format" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!RESEND_API_KEY) {
            console.error("CRITICAL: RESEND_API_KEY is missing!");
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Sanitize all user inputs before embedding in HTML
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message);

        console.log(`Received contact message for order processing`);

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
                subject: `New Contact Inquiry: ${safeSubject}`,
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
                <div class="value">${safeName} &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;</div>
                
                <div class="label">Subject</div>
                <div class="value">${safeSubject}</div>
                
                <div class="label">Message</div>
                <div class="message-box">${safeMessage}</div>
                
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
            console.error("Resend API Error:", JSON.stringify(data));
            return new Response(JSON.stringify({ error: "Failed to send message" }), {
                status: res.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error processing request:", error.message);
        return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
};

serve(handler);
