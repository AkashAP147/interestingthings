"use client";

import { useState, useCallback } from "react";
import { togglePostLikeAction, getPostCommentsAction, addPostCommentAction, toggleSavePostAction } from "@/app/actions";
import { Heart, MessageCircle, Share2, User as UserIcon, Send, Loader2, X, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SharePostModal } from "@/components/SharePostModal";
import Link from "next/link";

export function HomeFeed({ initialPosts, initialSavedIds = [] }: { initialPosts: any[], initialSavedIds?: string[] }) {
  const { user } = useAuth();
  
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatNumber = (num: number) => {
    if (!num) return "0";
    return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  };

  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(initialSavedIds);
  const [animatingPostId, setAnimatingPostId] = useState<string | null>(null);
  
  // Interaction state
  const [sharePostItem, setSharePostItem] = useState<any>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const handleLike = async (post: any) => {
    if (!user) return;
    
    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === post.id) {
        const likedBy = p.likedBy || [];
        const isLiked = likedBy.includes(user.id);
        return {
          ...p,
          likedBy: isLiked 
            ? likedBy.filter((id: string) => id !== user.id)
            : [...likedBy, user.id]
        };
      }
      return p;
    }));

    try {
      await togglePostLikeAction(post.authorId, post.id);
    } catch (e) {
      setPosts(posts.map(p => p.id === post.id ? { ...p, likedBy: post.likedBy } : p));
    }
  };

  const handleSavePost = async (post: any) => {
    if (!user) return;

    // Optimistic update
    const isSaved = savedPostIds.includes(post.id);
    if (isSaved) {
      setSavedPostIds(prev => prev.filter(id => id !== post.id));
    } else {
      setSavedPostIds(prev => [...prev, post.id]);
    }

    const res = await toggleSavePostAction(post.id, post.authorId);
    if (!res.success) {
      // Revert if failed
      if (isSaved) {
        setSavedPostIds(prev => [...prev, post.id]);
      } else {
        setSavedPostIds(prev => prev.filter(id => id !== post.id));
      }
    }
  };

  // Double click handler for image
  const handleDoubleClick = (e: React.MouseEvent, post: any) => {
    e.preventDefault();
    if (!post.likedBy?.includes(user?.id || '')) {
      handleLike(post);
    }
    
    // Trigger animation
    setAnimatingPostId(post.id);
    setTimeout(() => {
      setAnimatingPostId(null);
    }, 800);
  };

  // Prevent default double click zoom on mobile if needed
  const preventDefault = (e: any) => e.preventDefault();

  const openComments = async (post: any) => {
    setActiveCommentPost(post);
    setIsLoadingComments(true);
    setComments([]);
    try {
      const res = await getPostCommentsAction(post.id);
      if (res.success && res.comments) {
        setComments(res.comments);
      }
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommentPost || !newComment.trim() || isCommenting) return;

    const text = newComment.trim();
    setNewComment("");
    setIsCommenting(true);

    const tempComment = {
      id: `temp-${Date.now()}`,
      text,
      userId: user.id,
      userName: user.name || user.username,
      userProfilePicture: user.profilePicture,
      createdAt: new Date().toISOString()
    };
    
    setComments([...comments, tempComment]);

    try {
      await addPostCommentAction(activeCommentPost.authorId, activeCommentPost.id, text);
    } catch (e) {
      setComments(comments.filter(c => c.id !== tempComment.id));
    } finally {
      setIsCommenting(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-24 text-gray-text">
        <p className="text-lg">No posts to show.</p>
        <p className="mt-2 text-sm">Follow some people to see their posts here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <style>{`
        @keyframes heartBurst {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.2); opacity: 0.9; }
          30% { transform: scale(1); opacity: 0.9; }
          80% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .heart-animation {
          animation: heartBurst 0.8s ease-in-out forwards;
        }
      `}</style>
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
            <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                {post.authorProfilePicture ? (
                  <img src={post.authorProfilePicture} alt={post.authorName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-black dark:text-white hover:underline">
                  {post.authorName || "Unknown User"}
                </span>
                <span className="text-xs text-gray-500">
                  {post.createdAt ? timeAgo(post.createdAt) : ''}
                </span>
              </div>
            </Link>
          </div>

          {/* Media */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div 
              className="w-full bg-black relative select-none flex items-center justify-center overflow-hidden"
              onDoubleClick={(e) => handleDoubleClick(e, post)}
              onMouseDown={preventDefault} // Prevent text selection on double click
            >
              <img 
                src={post.imageUrls[0]} 
                alt="Post media" 
                className="w-full h-auto object-cover max-h-[600px] cursor-pointer"
              />
              {/* Like Animation Overlay */}
              {animatingPostId === post.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <Heart 
                    className="w-24 h-24 text-pink-400 fill-pink-400 drop-shadow-2xl heart-animation" 
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleLike(post)} 
                className={`flex items-center gap-1.5 transition-transform hover:scale-105 ${post.likedBy?.includes(user?.id || '') ? 'text-pink-500' : 'text-black dark:text-white'}`}
              >
                <Heart className="w-6 h-6" fill={post.likedBy?.includes(user?.id || '') ? "currentColor" : "none"} />
                <span className="font-bold text-sm">{formatNumber(post.likedBy?.length || 0)}</span>
              </button>
              
              <button 
                onClick={() => openComments(post)}
                className="flex items-center gap-1.5 text-black dark:text-white transition-transform hover:scale-105"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-bold text-sm">{formatNumber(post.commentCount || 0)}</span>
              </button>
              
              <button 
                onClick={() => setSharePostItem({
                  id: post.id,
                  text: post.caption,
                  imageUrl: post.imageUrls?.[0],
                  authorName: post.authorName,
                  authorId: post.authorId
                })}
                className="flex items-center gap-1.5 text-black dark:text-white transition-transform hover:scale-105"
              >
                <Share2 className="w-6 h-6" />
                <span className="font-bold text-sm">{formatNumber(post.shareCount || 0)}</span>
              </button>
            </div>
            
            <button 
              onClick={() => handleSavePost(post)}
              className="text-black dark:text-white transition-transform hover:scale-105"
            >
              <Bookmark className="w-6 h-6" fill={savedPostIds.includes(post.id) ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Caption */}
          <div className="px-3 pb-4">
            <div className="text-sm text-black dark:text-white break-words">
              <Link href={`/profile/${post.authorId}`} className="font-bold mr-2 hover:underline">
                {post.authorName || "Unknown User"}
              </Link>
              <span className="whitespace-pre-wrap">{post.caption}</span>
            </div>
            
            <button 
              onClick={() => openComments(post)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
            >
              View all comments
            </button>
          </div>
        </div>
      ))}

      {/* Share Modal */}
      {sharePostItem && (
        <SharePostModal
          post={sharePostItem}
          isOpen={!!sharePostItem}
          onClose={() => setSharePostItem(null)}
        />
      )}

      {/* Comments Bottom Sheet */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveCommentPost(null)}>
          <div 
            className="w-full sm:w-[500px] h-[75vh] sm:h-[600px] bg-white dark:bg-navy-deep sm:rounded-2xl rounded-t-2xl flex flex-col animate-slide-up sm:animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-purple-light/20 flex justify-between items-center bg-gray-50 dark:bg-navy-dark sm:rounded-t-2xl rounded-t-2xl">
              <h3 className="font-semibold text-navy-dark dark:text-white">Comments</h3>
              <button onClick={() => setActiveCommentPost(null)} className="text-gray-500 hover:text-navy-dark dark:hover:text-white transition-colors p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {isLoadingComments ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-purple" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center text-gray-text p-8">No comments yet. Be the first!</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-light to-blue p-[1px] shrink-0">
                      <div className="w-full h-full bg-white dark:bg-navy-deep rounded-full overflow-hidden flex items-center justify-center">
                        {c.userProfilePicture ? (
                          <img src={c.userProfilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm">
                        <Link href={`/profile/${c.userId}`} className="font-semibold text-navy-dark dark:text-white hover:text-purple transition-colors mr-2">
                          {c.userName}
                        </Link>
                        <span className="text-gray-text text-xs">
                          {c.createdAt ? timeAgo(c.createdAt) : ''}
                        </span>
                      </p>
                      <p className="text-sm text-navy-dark dark:text-gray-200 mt-0.5 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} className="p-3 border-t border-purple-light/20 flex gap-2 items-center bg-white dark:bg-navy-deep">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-dark flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-navy-dark border-none rounded-full px-4 py-2 text-sm text-navy-dark dark:text-white focus:ring-1 focus:ring-purple"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isCommenting}
                className="text-purple p-2 hover:bg-purple-light/10 rounded-full transition-colors disabled:opacity-50"
              >
                {isCommenting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
