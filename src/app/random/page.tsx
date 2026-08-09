"use client";

import { useState } from "react";
import { Dice5, RefreshCcw, ExternalLink } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { Discovery } from "@/types";
import { getRandomDiscoveryAction } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

export default function RandomPage() {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const fetchRandom = async () => {
    setIsSpinning(true);
    try {
      const result = await getRandomDiscoveryAction();
      setDiscovery(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!discovery ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center"
          >
            <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight text-navy-dark dark:text-white mb-6 flex items-center gap-4">
              <Dice5 className="h-16 w-16 text-purple" /> Surprise Me
            </h1>
            <p className="text-xl text-gray-text mb-12 max-w-2xl">
              You never know what you'll discover next. Ready to dive into the rabbit hole?
            </p>
            <button
              onClick={fetchRandom}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-purple px-10 py-5 text-xl font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-bright to-blue opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              <span className="relative flex items-center gap-2">
                Give Me Something Random
              </span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl flex flex-col items-center"
          >
            <div className="w-full mb-8 relative">
              <div className={isSpinning ? "animate-pulse" : ""}>
                <DiscoveryCard discovery={discovery} />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <a
                href={discovery.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-navy-dark dark:bg-white text-white dark:text-navy-dark px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform shadow-md"
              >
                Explore <ExternalLink className="h-5 w-5" />
              </a>
              <button
                onClick={fetchRandom}
                disabled={isSpinning}
                className="inline-flex items-center gap-2 bg-purple-light text-purple px-8 py-4 rounded-full font-semibold hover:bg-purple-light/80 transition-colors shadow-md disabled:opacity-50"
              >
                <RefreshCcw className={`h-5 w-5 ${isSpinning ? "animate-spin" : ""}`} /> Another One
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
