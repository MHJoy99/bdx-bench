import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { SiteNavWithSearch } from "@/components/search-command-host";
import { SiteFooter } from "@/components/site-footer";
import "@/styles/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bench.bdx.market";
const GA_MEASUREMENT_ID = "G-8P7CD6V133";
const CLARITY_PROJECT_ID = "ymfkbzmbcr";

export const metadata: Metadata = {
  title: {
    default: "BDX Bench — AI Model Benchmarks, Prices & Speed",
    template: "%s | BDX Bench",
  },
  description:
    "BDX Bench ranks AI models on reasoning, coding, math, knowledge, vision, agentic skill, price/performance, and speed.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "BDX Bench",
    title: "BDX Bench — AI Model Benchmarks, Prices & Speed",
    description:
      "Independent benchmarks: composite BDX Bench Score, price/performance, trends, and side-by-side compare.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BDX Bench — AI Model Benchmarks, Prices & Speed",
    description:
      "Independent benchmarks: composite BDX Bench Score, price/performance, trends, and side-by-side compare.",
  },
  verification: {
    google: "hru-mGkrVRO94mRZglGdElxBCAwhp9VdO5HyQbC_w3s",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Google Fonts via <link>, not CSS @import: the stylesheet loads in
         * parallel with the compiled CSS instead of serializing behind it,
         * which unblocks first paint (Lighthouse render-delay). Same three
         * families and display=swap as before; CSP already allows
         * fonts.googleapis.com (style-src) and fonts.gstatic.com (font-src).
         */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
        />
        {/*
         * Analytics load lazyOnload (browser idle), not afterInteractive:
         * gtag (~179KB) plus Clarity compete with hydration for bandwidth and
         * main thread inside the Lighthouse window, which costs TBT and LCP
         * render delay. Pageviews still fire, just after the page is usable.
         */}
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteNavWithSearch />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
