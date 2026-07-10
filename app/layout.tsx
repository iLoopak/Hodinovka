import type { Metadata, Viewport } from "next";
import { strings } from "@/lib/strings";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
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
  themeColor: "#2f6f4f",
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
    <html lang="cs">
      <body>
        <ServiceWorkerRegister />
        <div className="app-shell">
          <main className="app-content">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
