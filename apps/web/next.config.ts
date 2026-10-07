import type { NextConfig } from "next";
const gatewayOrigin = process.env.GATEWAY_ORIGIN ?? "http://localhost:3004";
let gateway: URL;
try {
  gateway = new URL(gatewayOrigin);
} catch {
  throw new Error("GATEWAY_ORIGIN must be a valid HTTP(S) origin");
}
if (
  !["http:", "https:"].includes(gateway.protocol) ||
  gateway.username ||
  gateway.password ||
  gateway.pathname !== "/" ||
  gateway.search ||
  gateway.hash
) {
  throw new Error(
    "GATEWAY_ORIGIN must be an HTTP(S) origin without credentials or path",
  );
}
if (
  process.env.NEXT_PUBLIC_API_URL &&
  process.env.NEXT_PUBLIC_API_URL !== "/api/v1"
) {
  throw new Error(
    "NEXT_PUBLIC_API_URL must be /api/v1 for same-origin Gateway requests",
  );
}
const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${gateway.origin}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
