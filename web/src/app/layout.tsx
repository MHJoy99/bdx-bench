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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
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
          strategy="afterInteractive"
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
