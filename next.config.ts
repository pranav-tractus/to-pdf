import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "libreoffice-convert"],
};

export default nextConfig;
