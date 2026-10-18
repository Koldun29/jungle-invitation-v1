import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "youin",
  description: "A jungle invitation, ready in minutes.",
  metadataBase: new URL("https://dino.youin.lol"),
};

export const viewport: Viewport = {
  themeColor: "#07140f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
