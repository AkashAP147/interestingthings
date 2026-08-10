"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

export function RunScraperButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cron/scrape");
      if (res.ok) setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <button 
      onClick={handleScrape}
      disabled={loading || success}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors shadow-sm text-white ${
        success ? "bg-green hover:bg-green" : "bg-navy-light hover:bg-navy-light/80 dark:bg-navy-dark dark:border dark:border-purple-light/20"
      }`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
      {loading ? "Running..." : success ? "Done!" : "Run Scraper"}
    </button>
  );
}
