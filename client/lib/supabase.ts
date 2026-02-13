// DEPRECATED: This file is no longer used.
// Authentication has been migrated to Express backend with JWT tokens.
// Use the AuthContext from "@/contexts/AuthContext" instead.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.",
  );
  console.warn(
    "Get these from your Supabase project settings: https://app.supabase.com",
  );
}

// Create supabase client only if credentials are available
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "X-Client-Info": "supabase-js-web",
          },
        },
      })
    : null;
