/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  async rewrites() {
    return [
      { source: "/play/pyro-vs-zombies", destination: "/play/pyro-vs-zombies/index.html" },
      { source: "/play/pyre-burn-horde", destination: "/play/pyre-burn-horde/index.html" },
      { source: "/play/firebreak-night-shift", destination: "/play/firebreak-night-shift/index.html" },
      { source: "/play/pyroclasm-inferno", destination: "/play/pyroclasm-inferno/index.html" },
      { source: "/favicon.ico", destination: "/icon.svg" },
    ];
  },
};

export default nextConfig;
