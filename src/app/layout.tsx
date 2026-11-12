import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource/spectral/300.css";
import "@fontsource/spectral/300-italic.css";
import "@fontsource/spectral/400.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÀLÀ — Cloth remembers",
  description:
    "ÀLÀ is a house of one cloth. A single handwoven length, pinned differently for every look. Hold it; it will keep the mark.",
  openGraph: {
    title: "ÀLÀ — Cloth remembers",
    description: "A house of one cloth. Lagos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0c0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
