-- Create a trigger to call the edge function on new order
-- Note: This requires the 'mod_datetime' extension or similar if we wanted timestamps, 
-- but for webhooks we use pg_net or supabase_functions.

-- Ensure the extension is enabled (usually is on Supabase)
create extension if not exists "supabase_functions" with schema "extensions";

-- Create the trigger
create trigger "on_order_created"
after insert
on "public"."orders"
for each row
execute function supabase_functions.http_request(
  'http://host.docker.internal:54321/functions/v1/send-order-email',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '1000'
);

-- NOTE: In production (hosted Supabase), this usually handled via the Dashboard (Database Webhooks)
-- or via a different SQL syntax involving `pg_net`.
-- A more robust way in pure SQL for Supabase is using `pg_net` or simply relying on the Dashboard.
-- However, for the purpose of this file, we will define the function call if possible.

-- ALTERNATIVE: Use the standard Supabase Webhooks UI helper in SQL if available.
-- Given the complexity of setting up HTTP triggers via raw SQL cross-environment,
-- the best practice is to instruct the user to set up a Database Webhook in the Dashboard
-- pointing to the Edge Function.
-- BUT, I will provide the standard hook definitions often used.

-- Ideally:
-- 1. Create a function that invokes the edge function (not supported directly in all free tiers via SQL without setup).
-- 2. OR use the 'supabase_functions' schema if available.

-- Let's stick to the user request "Use a Database Webhook: Watch the orders table".
-- I will write comments in this file guiding the user, as raw SQL webhooks can be tricky without `pg_net`.

/*
  MANUAL STEP REQUIRED:
  1. Go to Supabase Dashboard -> Database -> Webhooks.
  2. Create a new Webhook.
  3. Name: "Send Order Email".
  4. Table: public.orders.
  5. Events: INSERT.
  6. Type: HTTP Request.
  7. URL: [Your Edge Function URL] (e.g., https://[project-ref].supabase.co/functions/v1/send-order-email)
  8. Method: POST.
  9. Headers: Content-Type: application/json, Authorization: Bearer [Anon Config].
*/
