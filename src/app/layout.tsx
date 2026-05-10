import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ViewportGuard } from "@/components/ui/ViewportGuard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fantasyia - Conteudo Premium",
  description: "Plataforma premium de conteudo audiovisual: moda, arte e fotografia.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fantasyia",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full overflow-x-hidden bg-brand-bg text-brand-text">
        <ViewportGuard />
        {children}
      </body>
    </html>
  );
}
