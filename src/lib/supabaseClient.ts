import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Set your Supabase project credentials in an .env.* file
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be exposed to the browser.
// For example, in .env.local:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=public-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FireworkData {
  id: string;
  path: string; // SVG path or serialized points
  user: string | null;
  created_at: string;
}
