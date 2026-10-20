import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const apiOrigin = new URL(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    ).origin;
    return [
      {
        source: "/terrain/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
