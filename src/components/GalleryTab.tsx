"use client";

import { useState, useRef } from "react";
import { createPostAction } from "@/app/actions";
import { Plus, Image as ImageIcon, Loader2, X, User as UserIcon } from "lucide-react";

interface Post {
  id: string;
  imageUrls: string[];
  caption: string;
  visibility: "public" | "private" | "friends";
  createdAt: string;
  likes: number;
}

export function GalleryTab({ initialPosts, readOnly = false }: { initialPosts: Post[], readOnly?: boolean }) {
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
      const res = await createPostAction(previewImages, caption, visibility);
      if (res.success) {
        // Optimistically add to the front
        const newPost: Post = {
          id: `temp-${Date.now()}`,
          imageUrls: previewImages,
          caption,
          visibility,
          createdAt: new Date().toISOString(),
          likes: 0
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
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black relative shrink-0">
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
                
                {viewingPost.caption ? (
                  <p className="text-navy-dark dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {viewingPost.caption}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No caption provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
