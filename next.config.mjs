/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
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
