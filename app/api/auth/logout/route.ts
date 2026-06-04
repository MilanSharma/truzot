import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cookieStore = await cookies();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0] || 'sb';
    
    // Clear the auth cookie to fully log the user out
    cookieStore.set(`sb-${projectRef}-auth-token`, '', {
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
