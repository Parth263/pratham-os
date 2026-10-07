import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The embedded dev database ships its own WebAssembly; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
}

export default nextConfig
