import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Baby Tracker", template: "%s — Baby Tracker" },
  description: "Track feedings, diaper changes, and milestones for your baby",
  applicationName: "Baby Tracker",
  keywords: ["baby", "tracker", "feeding", "diaper", "parenting", "newborn", "infant"],
  authors: [{ name: "Baby Tracker" }],
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baby Tracker",
  },

  formatDetection: { telephone: false },

  openGraph: {
    type: "website",
    siteName: "Baby Tracker",
    title: "Baby Tracker",
    description: "Track feedings, diaper changes, and milestones for your baby",
  },

  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/logo.svg", color: "#a89b8c" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#a89b8c" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128.png" />

        {/* Favicon fallbacks */}
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/icons/icon-72.png" />

        {/* MS tile */}
        <meta name="msapplication-TileColor" content="#a89b8c" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

        {/* Mobile web app */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
