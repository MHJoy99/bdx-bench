import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { SiteNavWithSearch } from "@/components/search-command-host";
import { SiteFooter } from "@/components/site-footer";
import "@/styles/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bench.bdx.market";

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
