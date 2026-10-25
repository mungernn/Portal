import type { NextConfig } from "next";

// Set only in the Codespace (.devcontainer/setup.sh). When present, the
// browser calls /api/v1 on the portal's own address and Next.js forwards it
// to the API. Unset on the SDC servers, so production is unaffected.
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  ...(apiProxyTarget && {
    async rewrites() {
      return [{ source: "/api/v1/:path*", destination: `${apiProxyTarget}/api/v1/:path*` }];
    },
  }),
};

export default nextConfig;
