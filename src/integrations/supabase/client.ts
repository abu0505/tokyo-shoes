import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qdbvxznnzukdwooziqmd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fDm3xCtuosYLxTrYVIlNjw_CUnpW6s9";

// Using untyped client until database tables are created
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
