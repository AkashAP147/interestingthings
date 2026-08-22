"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { trackDailyActivityAction, getNotificationsAction } from "@/app/actions";
import { Globe, Sparkles, User as UserIcon, Compass, Search, MessageSquare, Info, Bell, Check } from "lucide-react";
import { SubscribeButton } from "@/components/SubscribeButton";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Discover", href: "/discover" },
  { name: "Search", href: "/search" },
  { name: "Messages", href: "/messages" },
  { name: "Home", href: "/home" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const lastScrollY = useRef(0);
  const { user, logout, openModal } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      getNotificationsAction().then(res => {
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
        }
      });
    }
  }, [user]);



  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY.current + 10) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY.current - 10) {
        setScrollDirection("up");
      }
      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track daily activity for the curiosity streak
  useEffect(() => {
    if (user?.id) {
      trackDailyActivityAction().catch(console.error);
    }
  }, [user?.id]);

  return (
    <>
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-purple-light/20", 
      isScrolled ? "bg-white/80 dark:bg-navy-deep/80 backdrop-blur-md shadow-sm" : "bg-transparent",
      scrollDirection === "down" && isScrolled ? "-translate-y-full" : "translate-y-0"
    )}>
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

        {/* Mobile menu button removed in favor of bottom nav */}

        {/* Desktop Navigation (Center) */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => {
            const isProtected = ["Discover", "Search", "Messages", "Home"].includes(item.name);
            if (isProtected && !user) return null;

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "relative flex items-center text-sm font-semibold leading-6 transition-colors duration-200",
                  isActive
                    ? "text-purple-bright dark:text-purple"
                    : "text-gray-text hover:text-navy-dark dark:hover:text-white"
                )}
              >
                {item.name}
                {item.name === "Messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Subscribe/User Profile (Right) */}
        <div className="flex flex-1 justify-end items-center gap-4">
          {!user ? (
            <div className="flex items-center gap-3">
              <button onClick={() => openModal("login")} className="text-sm font-semibold text-navy-dark dark:text-white hover:text-purple transition-colors">Log In</button>
              <button onClick={() => openModal("signup")} className="bg-purple text-white px-4 py-2 text-sm rounded-full font-semibold hover:bg-purple-bright hover:shadow-md transition-all">Sign Up</button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4 relative">
              <Link 
                href="/notifications"
                prefetch={true}
                className="p-2 text-gray-text hover:text-purple transition-colors rounded-full hover:bg-purple-light/10 relative group"
              >
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink animate-pulse shadow-sm shadow-pink/50"></span>
                )}
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
    </header>

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-navy-deep/95 backdrop-blur-md border-t border-purple-light/20 flex justify-around items-center p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-transform duration-300",
          scrollDirection === "down" && isScrolled ? "translate-y-[120%]" : "translate-y-0"
        )}>
        <Link href="/discover" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname === '/discover' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          <Compass className="h-6 w-6" />
          <span className="text-[10px] font-semibold">Discover</span>
        </Link>
        <Link href="/search" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname === '/search' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          <Search className="h-6 w-6" />
          <span className="text-[10px] font-semibold">Search</span>
        </Link>
        <Link href="/notifications" prefetch={true} className={`flex flex-col items-center gap-1 p-2 relative ${pathname === '/notifications' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          <Bell className="h-6 w-6" />
          {unreadNotifs > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink animate-pulse"></span>}
          <span className="text-[10px] font-semibold">Alerts</span>
        </Link>
        {user && (
          <Link href="/messages" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname === '/messages' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Messages</span>
          </Link>
        )}
        <Link href="/home" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname === '/home' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          <Globe className="h-6 w-6" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/about" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname === '/about' ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          <Info className="h-6 w-6" />
          <span className="text-[10px] font-semibold">About</span>
        </Link>
        <Link href="/profile" prefetch={true} className={`flex flex-col items-center gap-1 p-2 ${pathname.startsWith('/profile') ? 'text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
          {user.profilePicture ? (
            <div className={`h-6 w-6 rounded-full overflow-hidden ${pathname.startsWith('/profile') ? 'ring-2 ring-purple' : ''}`}>
              <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            </div>
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </div>
      )}
    </>
  );
}

// Vercel TS cache invalidation
