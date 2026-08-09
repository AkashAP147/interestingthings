"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ExternalLink, Sparkles } from "lucide-react";
import { Discovery } from "@/types";
import { approveDiscovery, rejectDiscovery } from "@/app/actions";

interface AdminQueueProps {
  initialPending: Discovery[];
}

export function AdminQueue({ initialPending }: AdminQueueProps) {
  const [queue, setQueue] = useState(initialPending);

  const handleApprove = async (id: string) => {
    setQueue((prev) => prev.filter((d) => d.id !== id));
    await approveDiscovery(id);
  };

  const handleReject = async (id: string) => {
    setQueue((prev) => prev.filter((d) => d.id !== id));
    await rejectDiscovery(id);
  };

  if (queue.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-deep p-12 rounded-3xl shadow-sm border border-purple-light/20 flex flex-col items-center justify-center text-center gap-4">
        <Sparkles className="h-12 w-12 text-purple-light" />
        <h3 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">Queue is Empty</h3>
        <p className="text-gray-text max-w-sm">
          The AI engine hasn't found anything new yet. Run the scraper API to find more interesting facts!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence>
        {queue.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: item.score > 50 ? 200 : -200 }} // Swipe right for approve, left for reject conceptually
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-navy-deep p-6 rounded-2xl shadow-sm border border-purple-light/20 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-purple/10 text-purple px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shrink-0">
                  Score: {item.score}
                </span>
                <span className="text-sm font-semibold text-gray-text truncate">{item.categoryId}</span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-navy-dark dark:text-white mb-2 leading-tight">
                {item.title}
              </h3>
              <p className="text-sm text-gray-text line-clamp-2 mb-3">{item.description}</p>
              <a 
                href={item.sourceUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:text-blue/80 transition-colors"
              >
                Verify Source <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-32 shrink-0">
              <button 
                onClick={() => handleApprove(item.id)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-green text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-green/90 hover:scale-105 active:scale-95 transition-all shadow-sm text-sm sm:text-base"
              >
                <Check className="h-4 w-4 sm:h-5 sm:w-5" /> Approve
              </button>
              <button 
                onClick={() => handleReject(item.id)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 dark:bg-navy-dark text-gray-text dark:text-gray-300 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-pink hover:text-white hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" /> Reject
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
