import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Myntra CDN
      { protocol: "https", hostname: "*.myntra.com" },
      { protocol: "https", hostname: "assets.myntassets.com" },
      // Amazon India
      { protocol: "https", hostname: "*.amazon.in" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      // Unsplash (used for demo/UI images)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Ajio
      { protocol: "https", hostname: "*.ajio.com" },
      // Nykaa / Meesho / Flipkart
      { protocol: "https", hostname: "*.nykaafashion.com" },
      { protocol: "https", hostname: "*.meesho.com" },
      { protocol: "https", hostname: "*.flipkart.com" },
      // Generic CDN patterns for scraped product images
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
    ],
  },
};

export default nextConfig;
