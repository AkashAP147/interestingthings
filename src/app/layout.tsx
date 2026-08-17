import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { getCurrentUserAction } from "@/app/actions";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://interestingthings.app"),
  title: {
    default: "The Internet's Most Interesting Things",
    template: "%s | The Internet's Most Interesting Things",
  },
  description: "Discover the weirdest websites, strangest products, fascinating datasets, crazy inventions and beautiful corners of the internet.",
  keywords: ["interesting websites", "cool tools", "curated web", "weird products", "internet rabbit holes", "fascinating datasets"],
  authors: [{ name: "TIMIT Curators" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "The Internet's Most Interesting Things",
    description: "Discover the weirdest websites, strangest products, fascinating datasets, crazy inventions and beautiful corners of the internet.",
    siteName: "TIMIT",
    images: [
      {
        url: "/og-image.jpg", // We'll assume a fallback image exists, or it can be added later
        width: 1200,
        height: 630,
        alt: "The Internet's Most Interesting Things",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Internet's Most Interesting Things",
    description: "Discover the weirdest websites, strangest products, fascinating datasets, crazy inventions and beautiful corners of the internet.",
    creator: "@TIMIT",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUserAction();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col bg-background text-foreground pt-[73px] pb-20 lg:pb-0`}>
        <AuthProvider initialUser={initialUser}>
          <NotificationProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
            <AuthModal />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
