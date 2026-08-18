"use client";

import { useState, useRef, useEffect } from "react";
import { createPostAction, updatePostVisibilityAction, togglePostLikeAction, addPostCommentAction, getPostCommentsAction, sharePostToFollowersAction } from "@/app/actions";
import { Plus, Image as ImageIcon, Loader2, X, User as UserIcon, Heart, MessageCircle, Share2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Post {
  id: string;
  imageUrls: string[];
  caption: string;
  visibility: "public" | "private" | "friends";
  createdAt: string;
  userId?: string;
  likedBy?: string[];
}

export function GalleryTab({ initialPosts, readOnly = false }: { initialPosts: Post[], readOnly?: boolean }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "friends">("public");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Post Viewer state
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [viewerSlideIndex, setViewerSlideIndex] = useState(0);
  
  // Social state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (viewingPost) {
      setIsLoadingComments(true);
      getPostCommentsAction(viewingPost.id).then(res => {
        if (res.success && res.comments) {
          setComments(res.comments);
        }
      }).finally(() => {
        setIsLoadingComments(false);
      });
    }
  }, [viewingPost?.id]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1080;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8)); // 80% quality JPEG
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      const compressedImages = await Promise.all(files.map(compressImage));
      setPreviewImages(compressedImages);
      setCurrentSlideIndex(0);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to process images", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (previewImages.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("imageUrls", JSON.stringify(previewImages));
      formData.append("caption", caption);
      formData.append("visibility", visibility);
      
      const res = await createPostAction(formData);
      if (res.success) {
        // Optimistically add to the front
        const newPost: Post = {
          id: `temp-${Date.now()}`,
          imageUrls: previewImages,
          caption,
          visibility,
          createdAt: new Date().toISOString(),
          likedBy: []
        };
        setPosts([newPost, ...posts]);
        setShowModal(false);
        setPreviewImages([]);
        setCaption("");
        setVisibility("public");
      }
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user || isLiking) return;
    setIsLiking(true);
    
    // Optimistic update
    const isLiked = post.likedBy?.includes(user.id);
    const newLikedBy = isLiked 
      ? (post.likedBy || []).filter(id => id !== user.id)
      : [...(post.likedBy || []), user.id];
      
    setPosts(posts.map(p => p.id === post.id ? { ...p, likedBy: newLikedBy } : p));
    if (viewingPost?.id === post.id) {
      setViewingPost({ ...viewingPost, likedBy: newLikedBy });
    }

    try {
      await togglePostLikeAction(post.userId || user.id, post.id);
    } catch (e) {
      // Revert on error
      setPosts(posts.map(p => p.id === post.id ? post : p));
      if (viewingPost?.id === post.id) setViewingPost(post);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !viewingPost || !newComment.trim() || isCommenting) return;
    
    setIsCommenting(true);
    const text = newComment;
    setNewComment("");
    
    // Optimistic update
    const tempComment = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      text,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture
      }
    };
    setComments([...comments, tempComment]);

    try {
      await addPostCommentAction(viewingPost.userId || user.id, viewingPost.id, text);
    } catch (e) {
      setComments(comments.filter(c => c.id !== tempComment.id));
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async (post: Post) => {
    if (!user || isSharing) return;
    if (confirm("Share this post to all your followers via direct message?")) {
      setIsSharing(true);
      try {
        const res = await sharePostToFollowersAction(post.userId || user.id, post.id);
        if (res.success) {
          alert(`Shared to ${res.sharedCount} followers!`);
        } else {
          alert(res.error || "Failed to share post");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleUpdateVisibility = async (postId: string, newVisibility: "public" | "private" | "friends") => {
    try {
      setPosts(posts.map(p => p.id === postId ? { ...p, visibility: newVisibility } : p));
      if (viewingPost && viewingPost.id === postId) {
        setViewingPost({ ...viewingPost, visibility: newVisibility });
      }
      await updatePostVisibilityAction(postId, newVisibility);
    } catch (err) {
      console.error("Failed to update visibility", err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {!readOnly && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading font-bold text-navy-dark dark:text-white">Your Gallery</h2>
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-bright transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add Photo
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-gray-50 dark:bg-navy-dark/50 border-2 border-dashed border-gray-200 dark:border-navy-dark rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-purple-light/10 text-purple rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-heading font-bold text-navy-dark dark:text-white mb-2">
            {readOnly ? "No visible posts." : "Share your moments"}
          </h3>
          {!readOnly && (
            <>
              <p className="text-gray-text max-w-sm mb-6">Upload photos to create your personal gallery. Your posts will appear here.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-purple font-semibold hover:text-purple-bright transition-colors"
              >
                Upload your first photo
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4 lg:gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => { setViewingPost(post); setViewerSlideIndex(0); }}
              className="aspect-square relative group bg-gray-100 dark:bg-navy-dark rounded-md md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={post.imageUrls?.[0] || (post as any).imageUrl} 
                alt={post.caption || "Gallery photo"} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {post.imageUrls?.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 border border-white/20">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100">
                <div className="flex justify-between items-start">
                  {!readOnly && (
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10">
                      {post.visibility || 'public'}
                    </span>
                  )}
                </div>
                {post.caption && (
                  <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">{post.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && previewImages.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-deep w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 dark:border-navy-dark flex justify-between items-center shrink-0">
              <h3 className="font-heading font-bold text-lg text-navy-dark dark:text-white">New Post ({previewImages.length} images)</h3>
              <button onClick={() => { setShowModal(false); setPreviewImages([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              <div className="h-48 w-full rounded-2xl overflow-hidden bg-black relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImages[currentSlideIndex]} alt="Preview" className="w-full h-full object-contain" />
                
                {previewImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-0 transition-opacity"
                    >
                      &larr;
                    </button>
                    <button 
                      onClick={() => setCurrentSlideIndex(prev => Math.min(previewImages.length - 1, prev + 1))}
                      disabled={currentSlideIndex === previewImages.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-0 transition-opacity"
                    >
                      &rarr;
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {previewImages.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentSlideIndex ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex flex-col gap-2 shrink-0">
                <label className="text-sm font-semibold text-gray-text">Visibility</label>
                <select 
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-navy-dark border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-navy-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-light"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="friends">Friends (Followers)</option>
                  <option value="private">Private (Only Me)</option>
                </select>
              </div>
              
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full bg-gray-50 dark:bg-navy-dark border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-navy-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-light resize-none h-24"
              />
              
              <button
                onClick={handlePost}
                disabled={isUploading}
                className="w-full bg-purple hover:bg-purple-bright text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Share Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Viewer Modal */}
      {viewingPost && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-md">
          <button 
            onClick={() => setViewingPost(null)} 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/50 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-full max-w-5xl h-[85vh] flex flex-col md:flex-row bg-black md:rounded-2xl overflow-hidden shadow-2xl">
            {/* Image Carousel */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={(viewingPost.imageUrls && viewingPost.imageUrls.length > 0) ? viewingPost.imageUrls[viewerSlideIndex] : (viewingPost as any).imageUrl} 
                alt="Post" 
                className="w-full h-full object-contain" 
              />
              
              {viewingPost.imageUrls?.length > 1 && (
                <>
                  <button 
                    onClick={() => setViewerSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={viewerSlideIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-0 transition-all backdrop-blur-sm"
                  >
                    &larr;
                  </button>
                  <button 
                    onClick={() => setViewerSlideIndex(prev => Math.min(viewingPost.imageUrls.length - 1, prev + 1))}
                    disabled={viewerSlideIndex === viewingPost.imageUrls.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-0 transition-all backdrop-blur-sm"
                  >
                    &rarr;
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {viewingPost.imageUrls.map((_, idx) => (
                      <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === viewerSlideIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Sidebar (Caption & Details) */}
            <div className="w-full md:w-80 bg-white dark:bg-navy-deep flex flex-col shrink-0 border-l border-gray-200 dark:border-navy-dark">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-dark dark:text-white">Author</h4>
                    <p className="text-xs text-gray-text">{new Date(viewingPost.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {!readOnly && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-text block mb-1">Visibility</label>
                    <select 
                      value={viewingPost.visibility}
                      onChange={(e) => handleUpdateVisibility(viewingPost.id, e.target.value as any)}
                      className="w-full bg-gray-50 dark:bg-navy-dark border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-navy-dark dark:text-white focus:outline-none"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="friends">Friends (Followers)</option>
                      <option value="private">Private (Only Me)</option>
                    </select>
                  </div>
                )}
                
                {viewingPost.caption ? (
                  <p className="text-navy-dark dark:text-gray-300 leading-relaxed whitespace-pre-wrap pb-4 border-b border-gray-100 dark:border-navy-dark">
                    {viewingPost.caption}
                  </p>
                ) : (
                  <p className="text-gray-400 italic pb-4 border-b border-gray-100 dark:border-navy-dark">No caption provided.</p>
                )}

                {/* Interactions */}
                {user && (
                  <div className="flex items-center gap-6 py-4 border-b border-gray-100 dark:border-navy-dark">
                    <button 
                      onClick={() => handleLike(viewingPost)}
                      disabled={isLiking}
                      className="flex items-center gap-2 group transition-colors"
                    >
                      <Heart className={`w-6 h-6 ${viewingPost.likedBy?.includes(user.id) ? 'fill-pink text-pink' : 'text-gray-text group-hover:text-pink'}`} />
                      <span className={`font-semibold ${viewingPost.likedBy?.includes(user.id) ? 'text-pink' : 'text-gray-text group-hover:text-pink'}`}>
                        {viewingPost.likedBy?.length || 0}
                      </span>
                    </button>
                    <button 
                      className="flex items-center gap-2 group transition-colors"
                    >
                      <MessageCircle className="w-6 h-6 text-gray-text group-hover:text-blue" />
                      <span className="font-semibold text-gray-text group-hover:text-blue">
                        {comments.length}
                      </span>
                    </button>
                    <button 
                      onClick={() => handleShare(viewingPost)}
                      disabled={isSharing}
                      className="flex items-center gap-2 group transition-colors ml-auto"
                    >
                      <Share2 className="w-5 h-5 text-gray-text group-hover:text-purple" />
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="py-4">
                  <h4 className="font-bold text-navy-dark dark:text-white mb-4">Comments</h4>
                  <div className="space-y-4 mb-4">
                    {isLoadingComments ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white shrink-0 overflow-hidden">
                            {comment.user?.profilePicture ? (
                              <img src={comment.user.profilePicture} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-navy-dark/50 rounded-2xl rounded-tl-none p-3">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className="font-bold text-sm text-navy-dark dark:text-white">
                                {comment.user?.username || comment.user?.name || "User"}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-text">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Add Comment Input */}
              {user && (
                <div className="p-4 border-t border-gray-200 dark:border-navy-dark bg-gray-50 dark:bg-navy-deep">
                  <form onSubmit={handleAddComment} className="relative">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-white dark:bg-navy-dark border border-gray-200 dark:border-gray-700 rounded-full py-2.5 pl-4 pr-12 text-sm text-navy-dark dark:text-white focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
                      disabled={isCommenting}
                    />
                    <button 
                      type="submit"
                      disabled={!newComment.trim() || isCommenting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-purple rounded-full disabled:opacity-50 hover:bg-purple-bright transition-colors"
                    >
                      {isCommenting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
