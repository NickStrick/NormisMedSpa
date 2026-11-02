// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteProvider } from "@/context/SiteContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import GlobalHashLinkHandler from "@/components/GlobalHashLinkHandler";
import PaymentsOverlay from "@/components/payments/PaymentsOverlay";

// ✅ Admin UI (client) — keyboard toggle + bar
import AdminGate from "@/components/admin/AdminGate";
import AdminBar from "@/components/admin/AdminBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";

import { getSiteConfig } from "@/lib/siteConfigLoader";
import SeoLocalBusinessSchema from "@/components/SeoLocalBusinessSchema";
import { BUSINESS, DEFAULT_DESCRIPTION, DEFAULT_TITLE, KEYWORDS, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BUSINESS.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: BUSINESS.name,
  authors: [{ name: BUSINESS.name, url: SITE_URL }],
  creator: BUSINESS.name,
  category: "health",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // helps prevent snippet weirdness, not required but solid
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BUSINESS.name,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "en_US",
    images: [{ url: BUSINESS.ogImage, alt: `${BUSINESS.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [BUSINESS.ogImage],
  },
  // geo.* tags are only emitted once BUSINESS.location is filled in
  other: Object.fromEntries(
    [
      ["geo.region", BUSINESS.location.addressRegion && `US-${BUSINESS.location.addressRegion}`],
      ["geo.placename", BUSINESS.location.addressLocality],
    ].filter(([, v]) => v)
  ) as Record<string, string>,
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();
  const showThemeSwitcher = process.env.NEXT_PUBLIC_THEME_SWITCHER === "1";

  return (
    <html lang="en">
      <head>
        <SeoLocalBusinessSchema />
        {googleAdsId ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-gtag" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAdsId}');`}
            </Script>
          </>
        ) : null}
      </head>
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) inject attributes on <body> before hydration */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app`} suppressHydrationWarning>
        <SiteProvider initial={config}>
          <CartProvider>
            <GlobalHashLinkHandler />
            <PaymentsOverlay />
            {/* overflow-x-clip, not overflow-hidden: hidden makes <main> a scroll container that
                scrollIntoView() scrolls, sliding the top spacing under the fixed header */}
            <main className="overflow-x-clip"><div id="top"></div>{children}</main>
          {showThemeSwitcher && <ThemeSwitcher />}

          {/* ✅ Admin overlay (toggle with Ctrl/Cmd + Alt + A OR Ctrl/Cmd + Shift + A)
              Also supports ?admin=1 and persists via localStorage */}
            <AdminGate>
              <AdminBar />
            </AdminGate>
          </CartProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
