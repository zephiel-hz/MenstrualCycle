import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricil's - Your Personal Cycle Companion",
  description: "Aplikasi pelacakan siklus menstruasi modern, mobile-first, dan privacy-first.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ricil's",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#D8647F",
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
        className="min-h-screen bg-[#FBF9F6] text-[#221B1F] antialiased selection:bg-[#FAF0F2] selection:text-[#D8647F]"
      >
        {children}
      </body>
    </html>
  );
}
