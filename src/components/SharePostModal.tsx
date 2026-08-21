"use client";

import { useState, useEffect } from "react";
import { X, Search, Send, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedUserConnectionsAction, startChatAction, sendMessageAction } from "@/app/actions";
import { encryptPayload } from "@/lib/e2ee";

export function SharePostModal({ 
  isOpen, 
  onClose, 
  post 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  post: { id: string, text?: string, title?: string, imageUrl?: string, authorName: string, authorId: string, isDiscovery?: boolean };
}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  useEffect(() => {
    if (isOpen && user?.id) {
      loadFriends();
    }
  }, [isOpen, user?.id]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      const res = await getCachedUserConnectionsAction(user.id);
      const followers = res.followers || [];
      const following = res.following || [];
      const mutuals = followers.filter((f: any) => following.some((fw: any) => fw.id === f.id));
      setFriends(mutuals);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (recipient: any) => {
    if (!user) return;
    
    setSendingTo(prev => ({ ...prev, [recipient.id]: 'sending' }));
    
    try {
      // 1. Start or get chat
      const chatRes = await startChatAction(recipient.username || recipient.id);
      if (!chatRes.success || !chatRes.chatId) throw new Error("Failed to create chat");
      
      const chatId = chatRes.chatId;

      // 2. Prepare payload
      const sharedPostPayload = {
        type: 'shared_post',
        id: post.id,
        text: post.title || post.text || "",
        imageUrl: post.imageUrl || null,
        authorName: post.authorName,
        authorId: post.authorId,
        isDiscovery: post.isDiscovery || false
      };

      // 3. Encrypt payload
      let finalPayload = null;
      let plainText = `Check out this post from ${post.authorName}`;
      
      const myPubKey = user.publicKey;
      const recipientPubKey = recipient.publicKey;
      
      if (myPubKey && recipientPubKey) {
        try {
          finalPayload = await encryptPayload({ 
            text: plainText
          }, [myPubKey, recipientPubKey]);
          plainText = ""; // hide plaintext if encrypted
        } catch (err) {
          console.error("Encryption failed, falling back to plaintext", err);
        }
      }

      // 4. Send message
      const sendRes = await sendMessageAction(chatId, plainText, undefined, finalPayload, (sharedPostPayload as any).post || sharedPostPayload);
      if (!sendRes.success) throw new Error("Failed to send");
      
      setSendingTo(prev => ({ ...prev, [recipient.id]: 'sent' }));
      
      setTimeout(() => {
        setSendingTo(prev => {
          const next = { ...prev };
          delete next[recipient.id];
          return next;
        });
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setSendingTo(prev => ({ ...prev, [recipient.id]: 'error' }));
    }
  };

  if (!isOpen) return null;

  const filteredFriends = friends.filter(f => 
    (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-lg text-navy-deep dark:text-white">Share Post</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-white/10">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-navy-deep text-navy-deep dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple/50 transition-all"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No friends found.
            </div>
          ) : (
            filteredFriends.map(friend => {
              const status = sendingTo[friend.id];
              return (
                <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple to-pink overflow-hidden relative shrink-0">
                      {friend.profilePicture && (
                        <Image src={friend.profilePicture} alt={friend.name} fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-navy-deep dark:text-white line-clamp-1">{friend.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{friend.username}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSend(friend)}
                    disabled={!!status}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5
                      ${status === 'sent' ? 'bg-green/10 text-green' : 
                        status === 'error' ? 'bg-red-500/10 text-red-500' :
                        'bg-purple text-white hover:bg-purple-light disabled:opacity-50'}`}
                  >
                    {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'sent' && <CheckCircle2 className="w-4 h-4" />}
                    {status === 'sent' ? 'Sent' : status === 'error' ? 'Error' : 'Send'}
                  </button>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
}
