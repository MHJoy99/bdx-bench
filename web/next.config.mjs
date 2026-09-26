/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  async rewrites() {
    return [
      { source: "/play/pyro-vs-zombies", destination: "/play/pyro-vs-zombies/index.html" },
      { source: "/play/pyre-burn-horde", destination: "/play/pyre-burn-horde/index.html" },
      { source: "/play/emberfall", destination: "/play/emberfall/index.html" },
      { source: "/play/space-bunny", destination: "/play/space-bunny/index.html" },
      { source: "/play/zombie-fire-survival", destination: "/play/zombie-fire-survival/index.html" },
      { source: "/play/cinderline", destination: "/play/cinderline/index.html" },
      { source: "/play/firebreak-night-shift", destination: "/play/firebreak-night-shift/index.html" },
      { source: "/play/pyroclasm-inferno", destination: "/play/pyroclasm-inferno/index.html" },
      { source: "/play/inferno-dead", destination: "/play/inferno-dead/index.html" },
      { source: "/favicon.ico", destination: "/icon.svg" },
    ];
  },
  /**
   * EMBER DEAD is a MULTI-FILE build (index.html + style.css + game.js +
   * audio.js) and loads its siblings with RELATIVE paths. A rewrite is not
   * enough: it serves the right bytes but leaves the browser URL at
   * /play/ember-dead, so `style.css` resolves against /play/ and 404s, and the
   * game ships unstyled and dead. A redirect moves the browser URL to the full
   * index.html path, which makes /play/ember-dead/ the base again.
   */
  async redirects() {
    return [
      { source: "/play/ember-dead", destination: "/play/ember-dead/index.html", permanent: false },
    ];
  },
};

export default nextConfig;
