const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.68.102:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ["192.168.68.102", "*.192.168.68.102"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
