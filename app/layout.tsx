import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { strings } from "@/lib/strings";
import { AppNav } from "@/components/AppNav";
import { GlobalTimerBar } from "@/components/GlobalTimerBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AccentProvider } from "@/components/AccentProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: strings.app.name,
  description: strings.app.tagline,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: strings.app.name,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#151815" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={GeistSans.variable}>
      <body>
        <ServiceWorkerRegister />
        <AccentProvider />
        <div className="app-shell">
          <AppNav />
          <GlobalTimerBar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
