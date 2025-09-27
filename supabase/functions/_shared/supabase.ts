import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Database } from "../../../shared/database.types.ts";

// For user-facing operations (respects RLS)
export const supabaseClient = (req: Request) =>
  createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );

// For admin operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export async function getRequestingUser(
  supabase: SupabaseClient<Database>,
  req: Request,
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return (await supabase.auth.getUser(token)).data.user;
}
