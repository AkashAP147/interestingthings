"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2 } from "lucide-react";
import React from "react";

interface SubscribeButtonProps {
  className?: string;
  variant?: "primary" | "nav" | "footer";
}

export function SubscribeButton({ className, variant = "primary" }: SubscribeButtonProps) {
  const { user, openModal } = useAuth();

  if (user) {
    if (variant === "nav") {
      return (
        <span className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-green">
          <CheckCircle2 className="h-4 w-4" /> Subscribed
        </span>
      );
    }
    return null; // Don't show large subscribe CTAs if already subscribed
  }

  const baseStyles = "inline-flex items-center gap-2 rounded-full font-semibold transition-all shadow-sm";
  
  let styles = "";
  if (variant === "primary") {
    styles = "bg-purple text-white px-8 py-4 text-lg hover:bg-purple-bright hover:scale-105";
  } else if (variant === "nav") {
    styles = "hidden md:inline-flex bg-purple text-white px-5 py-2.5 text-sm hover:bg-purple-bright hover:shadow-md";
  } else if (variant === "footer") {
    styles = "bg-purple text-white px-6 py-3 hover:bg-purple-bright";
  }

  return (
    <button onClick={openModal} className={`${baseStyles} ${styles} ${className || ""}`}>
      Subscribe <Sparkles className="h-4 w-4" />
    </button>
  );
}
