"use client";

import { useState, useEffect } from "react";
import { Heart, Share, Check, Loader2 } from "lucide-react";
import { toggleLikeAction } from "@/app/actions";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function DiscoveryActions({ discoveryId, initialSaves, initialLiked, slug }: { discoveryId: string, initialSaves: number, initialLiked: boolean, slug: string }) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [saves, setSaves] = useState(initialSaves);
  const [isCopied, setIsCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsLiked(initialLiked);
    setSaves(initialSaves);
  }, [initialLiked, initialSaves]);

  const handleLike = async () => {
    if (!user) {
      router.push(`/login?redirect=/discover/${slug}`);
      return;
    }
    
    if (isLiking) return;
    setIsLiking(true);
    
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setSaves(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await toggleLikeAction(discoveryId);
    } catch (err) {
      setIsLiked(!newLiked);
      setSaves(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/discover/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TIMIT',
          text: `Check this out on TIMIT`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <>
      <button 
        onClick={handleLike}
        disabled={isLiking}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors shadow-sm ${
          isLiked 
            ? "bg-pink/10 text-pink hover:bg-pink/20" 
            : "bg-purple-light/20 text-purple hover:bg-purple-light/40"
        }`}
      >
        {isLiking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />}
        Save ({saves})
      </button>
      <button 
        onClick={handleShare}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors shadow-sm ${
          isCopied
            ? "bg-green/10 text-green"
            : "bg-gray-100 dark:bg-navy-deep text-navy-dark dark:text-white hover:bg-gray-200 dark:hover:bg-navy-deep/80"
        }`}
      >
        {isCopied ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
        {isCopied ? "Copied" : "Share"}
      </button>
    </>
  );
}
