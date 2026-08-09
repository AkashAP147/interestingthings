"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

interface CopyEmailButtonProps {
  email: string;
  className?: string;
  iconClassName?: string;
}

export function CopyEmailButton({ email, className, iconClassName = "h-6 w-6" }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy} 
      className={`${className} relative group flex items-center justify-center`}
      aria-label="Copy email address"
      title="Copy email to clipboard"
    >
      {copied ? <Check className={`${iconClassName} text-green-500`} /> : <Mail className={iconClassName} />}
      
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded bg-navy-dark px-2 py-1 text-xs font-semibold text-white transition-all group-hover:scale-100 dark:bg-white dark:text-navy-dark whitespace-nowrap pointer-events-none z-50">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </button>
  );
}
