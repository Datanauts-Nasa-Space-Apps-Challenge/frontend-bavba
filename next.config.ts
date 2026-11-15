import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Desactivado para evitar doble montaje de MapContainer de Leaflet en desarrollo
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'svs.gsfc.nasa.gov',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
