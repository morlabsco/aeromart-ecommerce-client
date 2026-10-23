import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    // Product create/update post multipart FormData (up to 10 images) through
    // server actions; raise the default 1MB action body cap so uploads reach
    // the backend instead of being rejected by Next first.
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    reactCompiler: true,
};

export default nextConfig;
