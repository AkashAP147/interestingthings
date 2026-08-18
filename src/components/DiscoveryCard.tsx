"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share, ArrowRight, Check, Eye } from "lucide-react";
import { Discovery, Category } from "@/types";
import { categories } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { toggleLikeAction } from "@/app/actions";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DiscoveryCardProps {
  discovery: Discovery;
  index?: number;
  featured?: boolean;
  className?: string;
  variant?: "default" | "image-only";
}

export function DiscoveryCard({ discovery, index, featured = false, className = "", variant = "default" }: DiscoveryCardProps) {
  const category = categories.find((c) => c.id === discovery.categoryId);
  const { user, openModal, refreshUser } = useAuth();
  
  const initialLiked = user?.likes?.includes(discovery.id) || false;
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsLiked(user?.likes?.includes(discovery.id) || false);
  }, [user?.likes, discovery.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openModal();
      return;
    }
    
    // Optimistic UI update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    try {
      await toggleLikeAction(discovery.id);
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      setIsLiked(!newLikedState); // Revert on failure
    }
  };
  
  const handleDoubleClick = () => {
    if (discovery.sourceUrl) {
      window.open(discovery.sourceUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/discover/${discovery.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: discovery.title,
          text: `Check out ${discovery.title} on TIMIT`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      // AbortError is normal if user cancels the native share sheet
      if ((err as Error).name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-navy-dark shadow-sm border border-purple-light/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden cursor-pointer ${className}`}
    >
      
      {/* Image Container */}
      <div className={`relative w-full overflow-hidden bg-gray-100 dark:bg-navy-deep ${variant === "image-only" ? "aspect-square" : "aspect-[4/3]"}`}>
        <Image
          src={discovery.imageUrl}
          alt={discovery.title}
          fill
          unoptimized={discovery.imageUrl.includes("thum.io")}
          className="object-cover transition-transform duration-700 group-hover:scale-110 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Category Badge overlay */}
        {category && variant !== "image-only" && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${category.color} transition-all duration-300 group-hover:brightness-110`}>
              <CategoryIcon name={category.icon} className="h-4 w-4" /> {category.name}
            </span>
          </div>
        )}
        
        {/* Rank Overlay for Image Only */}
        {variant === "image-only" && index !== undefined && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="font-heading font-black text-4xl text-white drop-shadow-md">
              #{index + 1}
            </span>
          </div>
        )}

        {/* View Count Overlay for Image Only */}
        {variant === "image-only" && (
           <div className="absolute top-4 right-4 z-10">
             <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
               <Eye className="h-3 w-3" /> {discovery.views || 0}
             </span>
           </div>
        )}
      </div>

      {/* Content Container */}
      {variant !== "image-only" && (
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
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
               <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {discovery.views || 0}</span>
            </div>
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
                  {Math.max(0, discovery.saves + (isLiked && !initialLiked ? 1 : 0) - (!isLiked && initialLiked ? 1 : 0))}
                </span>
              </div>
              <button 
                onClick={handleShare}
                className={`p-1 rounded-full transition-colors ${
                  isCopied ? "text-green" : "text-gray-text hover:text-blue hover:bg-blue/10"
                }`} 
                aria-label="Share"
                title={isCopied ? "Copied!" : "Share"}
              >
                {isCopied ? <Check className="h-5 w-5" /> : <Share className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
