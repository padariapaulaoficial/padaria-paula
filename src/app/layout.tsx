// Layout principal - Padaria Paula
import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { GlobalLoading } from "@/components/LoadingProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Fonte elegante para títulos
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Fonte moderna para corpo
const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Padaria Paula | Sistema de Pedidos",
  description: "Sistema de pedidos e cupons térmicos para a Padaria Paula. Registro de clientes, seleção de produtos e impressão de cupons 80mm.",
  keywords: ["padaria", "pedidos", "cupom fiscal", "ESC/POS", "impressora térmica", "Elgin"],
  authors: [{ name: "Padaria Paula" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Padaria Paula",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5D4037",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${dmSans.variable} antialiased bg-background text-foreground min-h-screen`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <ErrorBoundary>
          {children}
          <Toaster />
          <GlobalLoading />
        </ErrorBoundary>
      </body>
    </html>
  );
}
