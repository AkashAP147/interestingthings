"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { Discovery } from "@/types";
import { deleteDiscoveryAction } from "@/app/actions";

interface AdminTableProps {
  initialDiscoveries: Discovery[];
}

export function AdminTable({ initialDiscoveries }: AdminTableProps) {
  const [discoveries, setDiscoveries] = useState(initialDiscoveries);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    // Optimistic UI update
    setDiscoveries(prev => prev.filter(d => d.id !== id));
    await deleteDiscoveryAction(id);
    setIsDeleting(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-gray-text border-b border-purple-light/20">
          <tr>
            <th className="pb-3 font-semibold">Title</th>
            <th className="pb-3 font-semibold">Category</th>
            <th className="pb-3 font-semibold">Score</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-light/20 relative">
          <AnimatePresence>
            {discoveries.map((item) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, scale: 0.95, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="hover:bg-purple-light/10 transition-colors"
              >
                <td className="py-4 text-navy-dark dark:text-white font-medium">
                  {item.title}
                </td>
                <td className="py-4 text-gray-text">{item.categoryId}</td>
                <td className="py-4 text-purple-bright font-semibold">{item.score}</td>
                <td className="py-4">
                  <span className="bg-green/10 text-green px-2 py-1 rounded-md text-xs font-semibold">
                    Published
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-text hover:text-purple transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                      className="text-gray-text hover:text-pink transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {discoveries.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-text">
                No discoveries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
