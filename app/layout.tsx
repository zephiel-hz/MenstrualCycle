import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lunara - Your Personal Cycle Companion",
  description: "Aplikasi pelacakan siklus menstruasi modern, mobile-first, dan privacy-first.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lunara",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#E07A5F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#FAF8F5] text-[#2D2727] antialiased selection:bg-[#FCECE8] selection:text-[#E07A5F]"
      >
        {children}
      </body>
    </html>
  );
}
