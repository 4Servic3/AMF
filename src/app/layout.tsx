import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import UnregisterSW from '@/components/UnregisterSW';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  variable: "--font-editorial",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'AMF - Academia de Medicina Felina',
  description: 'O maior portal de medicina felina',
  appleWebApp: {
    capable: true,
    title: "AMF",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#40264F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <meta name="application-name" content="Academia" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Academia" />
      </head>
      <body className="min-h-full flex flex-col">
        <UnregisterSW />
        {children}
      </body>
    </html>
  );
}
