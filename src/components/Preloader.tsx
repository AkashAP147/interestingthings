"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

export function Preloader() {
  const { user } = useAuth();
  // Show preloader immediately on mount if user is logged in
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const hasLoaded = sessionStorage.getItem("timit_preloaded");
      if (!hasLoaded) {
        setShow(true);
        sessionStorage.setItem("timit_preloaded", "true");
        const timer = setTimeout(() => {
          setShow(false);
        }, 1500); // 1.5 seconds loading screen
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Handle body scroll locking
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-white dark:bg-navy-deep flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeOut",
            }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Logo className="w-28 h-28 mb-6 shadow-2xl rounded-3xl" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-heading font-bold text-navy-dark dark:text-white tracking-tight"
            >
              TIMIT
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-text mt-2 font-medium"
            >
              Loading your interesting things...
            </motion.p>
            
            <motion.div 
              className="w-48 h-1.5 bg-purple-light/20 rounded-full mt-10 overflow-hidden"
            >
              <motion.div 
                className="h-full bg-purple"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
