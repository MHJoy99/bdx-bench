/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // Pin tracing to this app. The repo root also has a package-lock.json, so
  // without this Next infers the parent as the workspace root and nests the
  // standalone output one level deeper (web/server.js), breaking the systemd unit.
  outputFileTracingRoot: import.meta.dirname,
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
      { source: "/play/claude-haiku-5-5", destination: "/play/claude-haiku-5-5/index.html" },
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
  async headers() {
    // NOTE: X-Frame-Options and X-Content-Type-Options are intentionally NOT
    // set here — the VPS nginx/WordOps layer already sends them, and
    // duplicates cause misbehaviour. CSP is enforced (S1).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://c.clarity.ms https://c.bing.com",
      "media-src 'self' data: blob:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
