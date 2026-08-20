/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Server Actions only ever carry small text fields now — files
      // upload directly from the browser to Supabase Storage instead
      // (see notes-tab.tsx). Vercel enforces a hard ~4.5MB request body
      // limit on Serverless Functions that this setting cannot override,
      // so this value only ever mattered for local dev, never production.
      bodySizeLimit: '2mb',
    },
    // pdf-parse and @napi-rs/canvas ship native/worker code that Next's
    // bundler can't inline — this tells it to load them from node_modules
    // at runtime instead. Without this, PDF text extraction throws
    // "DOMMatrix is not defined" on Vercel (works locally because the
    // bundler behaves differently in dev).
    serverComponentsExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  },
};

export default nextConfig;
