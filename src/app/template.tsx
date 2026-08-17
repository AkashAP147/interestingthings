"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1]
      }}
      className="flex-grow flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}
