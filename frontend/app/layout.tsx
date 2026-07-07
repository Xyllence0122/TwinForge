import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://twin-forge.vercel.app"),
  title: {
    default: "TwinForge — Industrial Digital Twin Platform",
    template: "%s · TwinForge",
  },
  description:
    "TwinForge mirrors every machine on your factory floor into an interactive 3D digital twin with real-time telemetry, health analytics and AI-driven predictive maintenance.",
  openGraph: {
    title: "TwinForge — Industrial Digital Twin Platform",
    description:
      "Interactive 3D digital twin of a smart factory: real-time telemetry, health analytics and AI-driven predictive maintenance.",
    url: "https://twin-forge.vercel.app",
    siteName: "TwinForge",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070B14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
