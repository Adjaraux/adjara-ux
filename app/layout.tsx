import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import { Toaster } from 'sonner';
import StructuredData from "@/components/seo/structured-data";
import { RouteLoader } from "@/components/dashboard/route-loader";
import { Suspense } from 'react';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://adjara-ux.com'),
  title: {
    default: "Adjara UX - Agence Design & Académie Tech Premium",
    template: "%s | Adjara UX"
  },
  description: "L'excellence du Design UI/UX et de la Tech en Afrique. Agence de stratégie digitale et Académie élitiste pour futurs leaders tech.",
  keywords: ["Design UI/UX Africa", "Formation Tech Lomé", "Agence Digitale Premium", "UX Strategy", "AI Training Africa"],
  authors: [{ name: "Adjara UX Team" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://adjara-ux.com",
    siteName: "Adjara UX",
    title: "Adjara UX - Transformez vos idées en expériences laser",
    description: "Expertise en Design, Développement et IA. Formez-vous ou accélérez votre business avec le partenaire de référence en Afrique.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Adjara UX - Luxe & Expertise"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Adjara UX - Luxe & Expertise Digitale",
    description: "Agence & Académie Tech de référence en Afrique.",
    images: ["/og-image.png"],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logoadja.svg',
    apple: '/logoadja.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Adjara UX',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#05080f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Suspense fallback={null}>
          <RouteLoader />
        </Suspense>
        <StructuredData />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
