/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The storefront replaced the old two-screen order flow. These paths were
  // public (and /novo was in the sitemap), so keep them working permanently
  // rather than serving 404s to anyone with an old link or bookmark.
  async redirects() {
    return [
      { source: "/novo", destination: "/produtos", permanent: true },
      { source: "/editar", destination: "/pedido", permanent: true },
    ];
  },
};

module.exports = nextConfig;
