"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { trackDailyActivityAction } from "@/app/actions";
import { Menu, X, Globe, Sparkles, User as UserIcon } from "lucide-react";
import { SubscribeButton } from "@/components/SubscribeButton";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Discover", href: "/discover" },
  { name: "Categories", href: "/categories" },
  { name: "Trending", href: "/trending" },
  { name: "Random", href: "/random" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, openModal } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track daily activity for the curiosity streak
  useEffect(() => {
    if (user?.id) {
      trackDailyActivityAction().catch(console.error);
    }
  }, [user?.id]);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-purple-light/20", isScrolled ? "bg-white/80 dark:bg-navy-deep/80 backdrop-blur-md shadow-sm" : "bg-transparent")}>
      <nav className="flex items-center justify-between p-4 lg:px-12 max-w-[1600px] mx-auto" aria-label="Global">
        
        {/* Logo (Left) */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3 group">
            <div className="group-hover:scale-105 transition-transform duration-300">
              <Logo className="h-10 w-10 shadow-sm rounded-xl" />
            </div>
            <span className="font-heading font-bold text-lg text-navy-dark dark:text-white tracking-tight hidden sm:block">
              The Internet’s Most Interesting Things
            </span>
            <span className="font-heading font-bold text-lg text-navy-dark dark:text-white tracking-tight sm:hidden">
              TIMIT
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-text hover:text-navy-dark dark:hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop Navigation (Center) */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => {
            const isProtected = ["Discover", "Categories", "Trending", "Random"].includes(item.name);
            if (isProtected && !user) return null;

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-semibold leading-6 transition-colors duration-200",
                  isActive
                    ? "text-purple-bright dark:text-purple"
                    : "text-gray-text hover:text-navy-dark dark:hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Subscribe/User Profile (Right) */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          {!user ? (
            <div className="flex items-center gap-3">
              <button onClick={() => openModal("login")} className="hidden md:inline-flex bg-blue text-white px-5 py-2.5 text-sm rounded-full font-semibold hover:opacity-90 hover:shadow-md transition-all">Log In</button>
              <button onClick={() => openModal("signup")} className="hidden md:inline-flex bg-purple text-white px-5 py-2.5 text-sm rounded-full font-semibold hover:bg-purple-bright hover:shadow-md transition-all">Sign Up</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {user?.role === "admin" && (
                <Link href="/admin" className="text-sm font-semibold text-purple-bright hover:text-purple transition-colors">
                  Admin Panel
                </Link>
              )}
              <Link href="/messages" className="text-sm font-semibold text-gray-text hover:text-purple transition-colors">
                Messages
              </Link>
              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-purple-light/20 border-2 border-transparent group-hover:border-purple transition-colors flex items-center justify-center">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-purple" />
                  )}
                </div>
                <span className="text-sm font-semibold text-navy-dark dark:text-white group-hover:text-purple transition-colors">
                  {user.username || user.name || "Profile"}
                </span>
              </Link>
              <button 
                onClick={logout}
                className="text-sm font-semibold text-gray-text hover:text-red-500 transition-colors ml-2 border-l border-gray-200 dark:border-gray-800 pl-4"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={cn("lg:hidden", mobileMenuOpen ? "block" : "hidden")} role="dialog" aria-modal="true">
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">The Internet’s Most Interesting Things</span>
              <Globe className="h-8 w-8 text-purple" />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-text"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => {
                  const isProtected = ["Discover", "Categories", "Trending", "Random"].includes(item.name);
                  if (isProtected && !user) return null;

                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-purple-light/50 transition-colors",
                        isActive ? "text-purple" : "text-navy-dark dark:text-white"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              <div className="py-6">
                {!user ? (
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { openModal("login"); setMobileMenuOpen(false); }} className="flex w-full justify-center bg-blue text-white px-5 py-2.5 text-base rounded-full font-semibold hover:opacity-90 hover:shadow-md transition-all">Log In</button>
                    <button onClick={() => { openModal("signup"); setMobileMenuOpen(false); }} className="flex w-full justify-center bg-purple text-white px-5 py-2.5 text-base rounded-full font-semibold hover:bg-purple-bright hover:shadow-md transition-all mt-2">Sign Up</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {user?.role === "admin" && (
                      <Link 
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-purple-bright hover:bg-purple-light/20"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link 
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-navy-dark dark:text-white hover:bg-purple-light/20"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-purple-light/20 flex items-center justify-center">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-purple" />
                        )}
                      </div>
                      My Profile
                    </Link>
                    <button 
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-text hover:bg-red-50 text-left"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Vercel TS cache invalidation
