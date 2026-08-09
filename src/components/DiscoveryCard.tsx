"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share, ArrowRight } from "lucide-react";
import { Discovery, Category } from "@/types";
import { categories } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { toggleLikeAction } from "@/app/actions";
import { useState } from "react";
import { motion } from "framer-motion";

interface DiscoveryCardProps {
  discovery: Discovery;
  index?: number;
  featured?: boolean;
  className?: string;
}

export function DiscoveryCard({ discovery, index, featured = false, className = "" }: DiscoveryCardProps) {
  const category = categories.find((c) => c.id === discovery.categoryId);
  const { user, openModal } = useAuth();
  
  const initialLiked = user?.likes?.includes(discovery.id) || false;
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      openModal();
      return;
    }
    
    // Optimistic UI update
    setIsLiked(!isLiked);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    try {
      await toggleLikeAction(discovery.id);
    } catch (error) {
      setIsLiked(isLiked); // Revert on failure
    }
  };
  
  return (
    <div className={`group relative flex flex-col rounded-2xl bg-white dark:bg-navy-dark shadow-sm border border-purple-light/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${className}`}>
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-navy-deep">
        <Image
          src={discovery.imageUrl}
          alt={discovery.title}
          fill
          unoptimized={discovery.imageUrl.includes("thum.io")}
          className="object-cover transition-transform duration-700 group-hover:scale-110 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Category Badge overlay */}
        {category && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${category.color} transition-all duration-300 group-hover:brightness-110`}>
              <CategoryIcon name={category.icon} className="h-4 w-4" /> {category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-x-4 text-xs">
          {index !== undefined && (
            <span className="font-heading font-bold text-lg text-purple-bright">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
          <time dateTime={discovery.publishedAt} className="text-gray-text">
            {new Date(discovery.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </time>
        </div>
        <div className="group relative mt-3">
          <h3 className="font-heading text-xl font-semibold leading-6 text-navy-dark dark:text-white group-hover:text-purple transition-colors">
            <Link href={`/discover/${discovery.slug}`}>
              <span className="absolute inset-0" />
              {discovery.title}
            </Link>
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-purple-light/20 pt-4">
          <Link
            href={`/discover/${discovery.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy-dark dark:text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-purple"
          >
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4 z-10 relative">
            <div className="flex items-center gap-1">
              <motion.button 
                onClick={handleLike}
                animate={isAnimating ? { scale: [1, 1.4, 1] } : {}}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? "bg-pink/10 text-pink hover:bg-pink/20" 
                    : "hover:bg-purple-light/20 text-gray-text hover:text-purple"
                }`}
              >
                <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
              </motion.button>
              <span className="text-sm font-semibold text-gray-text">
                {discovery.saves + (isLiked && !initialLiked ? 1 : 0) - (!isLiked && initialLiked ? 1 : 0)}
              </span>
            </div>
            <button className="text-gray-text hover:text-blue transition-colors p-1" aria-label="Share">
              <Share className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
