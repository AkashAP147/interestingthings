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
  title: "The Internet's Most Interesting Things",
  description: "Discover the weirdest websites, strangest products, fascinating datasets, crazy inventions and beautiful corners of the internet.",
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
