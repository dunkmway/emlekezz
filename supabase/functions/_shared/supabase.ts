import { createClient } from "jsr:@supabase/supabase-js@2";
import { Database } from "../../../shared/database.types.ts";

// For user-facing operations (respects RLS)
export const supabase = (req: Request) =>
  createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );

// For admin operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SECRET_KEY")!,
);
