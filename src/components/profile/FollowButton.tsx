"use client";

import { useState } from "react";
import { toggleFollowAction } from "@/app/actions";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

export default function FollowButton({ 
  targetUserId, 
  initialIsFollowing 
}: { 
  targetUserId: string; 
  initialIsFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      // Optimistic update
      setIsFollowing(!isFollowing);
      
      const res = await toggleFollowAction(targetUserId);
      setIsFollowing(res.following);
    } catch (error) {
      // Revert on error
      setIsFollowing(initialIsFollowing);
      console.error("Failed to toggle follow", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center min-w-[120px] ${
        isFollowing 
          ? "bg-gray-100 text-navy-dark dark:bg-navy-deep dark:text-white border border-gray-200 dark:border-purple-light/20 hover:bg-gray-200" 
          : "bg-purple text-white hover:bg-purple-bright shadow-lg shadow-purple/20"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </button>
  );
}
