import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração necessária para permitir o acesso na rede local (Next.js 16+)
  allowedDevOrigins: ['192.168.0.3', '192.168.0.7', '192.168.0.6', '192.168.56.1'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://image.mux.com https://*.supabase.co; media-src 'self' blob: https://stream.mux.com; connect-src 'self' https://*.supabase.co https://stats.mux.com https://api.mux.com https://storage.googleapis.com; worker-src 'self' blob:; font-src 'self'; frame-src 'self' blob:;"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
