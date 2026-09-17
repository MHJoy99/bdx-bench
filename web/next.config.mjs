/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  async rewrites() {
    return [
      { source: "/play/pyro-vs-zombies", destination: "/play/pyro-vs-zombies/index.html" },
      { source: "/play/pyroclasm-inferno", destination: "/play/pyroclasm-inferno/index.html" },
    ];
  },
};

export default nextConfig;
