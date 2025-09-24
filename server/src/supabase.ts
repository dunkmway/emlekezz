import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "localhost:54321",
  Deno.env.get("SUPABASE_KEY") ?? "publishable-or-anon-key",
);
