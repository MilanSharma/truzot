import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Global listener to sync client-side Supabase authentication state with secure cookies
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    const projectRef = supabaseUrl.split('https://')[1]?.split('.')[0] || 'sb';
    const cookieName = `sb-${projectRef}-auth-token`;
    if (session) {
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
    } else {
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; Secure`;
    }
  });
}
