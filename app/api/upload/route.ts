import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { action, filename, path } = await req.json();

    if (action === 'get-upload-url') {
      if (!filename) {
        return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
      }
      
      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .createSignedUploadUrl(filename);

      if (error) {
        console.error('Failed to create signed upload URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
      }

      return NextResponse.json({
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
      });
    }

    if (action === 'get-download-url') {
      if (!path) {
        return NextResponse.json({ error: 'Missing path' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .createSignedUrl(path, 7200);

      if (error || !data?.signedUrl) {
        console.error('Failed to create signed download URL:', error);
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
      }

      return NextResponse.json({ zipUrl: data.signedUrl });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
