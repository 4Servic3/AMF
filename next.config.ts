import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração necessária para permitir o acesso na rede local (Next.js 16+)
  allowedDevOrigins: ['192.168.0.6', '192.168.56.1'],
  /* config options here */
};

export default nextConfig;
