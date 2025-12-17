import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Next.js 16 la config de ESLint ya no va aquí
  // El build no falla por lint por defecto

  // Mantienes esto si así lo necesitas en producción
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
