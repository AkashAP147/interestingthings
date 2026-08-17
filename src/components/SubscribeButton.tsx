"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2 } from "lucide-react";
import React from "react";

interface SubscribeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "nav" | "footer" | "mobile";
}

export function SubscribeButton({ className, variant = "primary", onClick, ...props }: SubscribeButtonProps) {
  const { user, openModal } = useAuth();

  if (user) {
    if (variant === "nav") {
      return (
        <span className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-green">
          <CheckCircle2 className="h-4 w-4" /> Logged In
        </span>
      );
    }
    return null; // Don't show large subscribe CTAs if already subscribed
  }

  const baseStyles = "inline-flex items-center gap-2 rounded-full font-semibold transition-all shadow-sm";
  
  let styles = "";
  if (variant === "nav") {
    styles = "hidden md:inline-flex bg-purple text-white px-5 py-2.5 text-sm hover:bg-purple-bright hover:shadow-md";
  } else if (variant === "footer") {
    styles = "bg-purple text-white px-6 py-3 hover:bg-purple-bright";
  } else if (variant === "mobile") {
    styles = "flex w-full justify-center bg-purple text-white px-5 py-2.5 text-base hover:bg-purple-bright hover:shadow-md";
  }

  if (variant === "primary") {
    return (
      <button 
        onClick={(e) => { if (onClick) onClick(e); openModal("signup"); }}
        className={`w-full sm:w-auto bg-purple text-white px-8 py-3.5 text-base font-semibold shadow-sm hover:bg-purple-bright hover:scale-105 transition-all rounded-full flex items-center justify-center gap-2 ${className || ""}`}
        {...props}
      >
        Get Started <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button 
      onClick={(e) => {
        if (onClick) onClick(e);
        openModal("signup");
      }} 
      className={`${baseStyles} ${styles} ${className || ""}`}
      {...props}
    >
      Login / Sign Up <Sparkles className="h-4 w-4" />
    </button>
  );
}
