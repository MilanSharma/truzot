/** @type {import('next').NextConfig} */
const nextConfig = { output: 'standalone', images: { remotePatterns: [{ protocol: 'https', hostname: '*.fal.media' }, { protocol: 'https', hostname: 'fal.media' }, { protocol: 'https', hostname: '*.supabase.co' }, { protocol: 'https', hostname: 'picsum.photos' }] } };
module.exports = nextConfig;
