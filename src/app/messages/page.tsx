"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { startChatAction, sendMessageAction, getChatsAction, markChatsDeliveredAction, markChatReadAction } from "@/app/actions";
import { Search, Send, MessageSquare, Loader2, User as UserIcon, ExternalLink, MoreHorizontal, Trash, Smile, ImageIcon, Clock, Check, CheckCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MediaPicker } from '@/components/MediaPicker';
import { encryptPayload, decryptPayload, decryptPrivateKeyWithPassword } from "@/lib/e2ee";
import { Html5Qrcode } from 'html5-qrcode';
import { database } from '@/lib/firebase-client';
import { ref, onValue, off } from 'firebase/database';

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // WhatsApp features state
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [chatUsers, setChatUsers] = useState<Record<string, any>>({});
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousMessagesLength = useRef(0);
  // Remove manual scroll management - we'll use CSS flex-col-reverse instead

  // Fetch Chats Polling
  useEffect(() => {
    if (!user) return;
    
    // Load from cache instantly
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`timit_chats_${user.id}`);
      if (cached) {
        try { 
          setChats(JSON.parse(cached)); 
          setIsLoadingChats(false);
        } catch(e) {}
      }
    }
    
    const fetchChats = async () => {
      try {
        const res = await getChatsAction();
        if (res.success && res.chats) {
          const privKey = localStorage.getItem(`privKey_${user.id}`);
          const decryptedChats = await Promise.all(res.chats.map(async (chat: any) => {
            if (chat.lastMessagePayload && privKey) {
              const myKeyIndex = chat.lastMessageSenderId === user.id ? 0 : 1; 
              const decrypted = await decryptPayload(chat.lastMessagePayload, privKey, myKeyIndex);
              if (decrypted) {
                chat.lastMessage = decrypted.imageUrl ? "📸 Image" : decrypted.text?.substring(0, 50) || "🔒 Encrypted Message";
              }
            }
            return chat;
          }));
          setChats(decryptedChats);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`timit_chats_${user.id}`, JSON.stringify(decryptedChats));
          }
            
            // Mark incoming messages as delivered
            if (decryptedChats.length > 0) {
              await markChatsDeliveredAction(decryptedChats.map(c => c.id));
            }
            
            // Handle ?user query parameter only once on initial load
            const targetUsername = searchParams?.get("user");
            if (targetUsername && !activeChatId) {
                const existingChat = decryptedChats.find((c: any) => c.otherUser.username === targetUsername || c.otherUser.id === targetUsername);
                if (existingChat) {
                    setActiveChatId(existingChat.id);
                    setChatUsers(prev => ({ ...prev, [existingChat.id]: existingChat.otherUser }));
                } else {
                    handleStartChatDirect(targetUsername);
                }
            }
        }
      } catch (e) {
        console.error("Failed to fetch chats");
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // 10 seconds to save quota
    return () => clearInterval(interval);
  }, [user]);

  // Fetch Messages Polling
  useEffect(() => {
    if (!activeChatId || !user) return;
    
    let isActive = true;
    
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`timit_msgs_${activeChatId}_${user.id}`);
      if (cached) {
        try { 
          setMessages(JSON.parse(cached));
          setIsLoadingMessages(false);
        } catch(e) {}
      } else {
        setMessages([]);
        setIsLoadingMessages(true);
      }
    }
    
    const messagesRef = ref(database, `messages/${activeChatId}`);
    
    const listener = onValue(messagesRef, async (snapshot) => {
      if (!isActive) return;
      
      const data = snapshot.val() || {};
      
      // Check if we need to mark messages as read
      let hasUnreadIncoming = false;
      
      const rawMessages = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }))
      .filter((msg: any) => !(msg.deletedBy || []).includes(user.id))
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      rawMessages.forEach((msg: any) => {
        if (msg.senderId !== user.id && msg.status !== "read") {
          hasUnreadIncoming = true;
        }
      });
      
      if (hasUnreadIncoming) {
        markChatReadAction(activeChatId).catch(console.error);
      }
      
      const privKey = localStorage.getItem(`privKey_${user.id}`);
      
      const decryptedMessages = await Promise.all(rawMessages.map(async (msg: any) => {
        if (msg.payload && privKey) {
          const myKeyIndex = msg.senderId === user.id ? 0 : 1; 
          const decrypted = await decryptPayload(msg.payload, privKey, myKeyIndex);
          if (decrypted) {
            return { ...msg, ...decrypted, isDecrypted: true };
          } else {
            return { ...msg, text: "🔒 Encrypted Message (Unable to decrypt)", imageUrl: null };
          }
        }
        return msg;
      }));
      
      if (!isActive) return;
      
      setMessages(decryptedMessages);
      setIsLoadingMessages(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`timit_msgs_${activeChatId}_${user.id}`, JSON.stringify(decryptedMessages));
      }
    }, (error) => {
      console.error("Firebase onValue error:", error);
      setIsLoadingMessages(false);
    });

    // Typing listener
    const otherUserId = chats.find(c => c.id === activeChatId)?.participants.find((p: string) => p !== user.id);
    let typingRef: any = null;
    let typingListener: any = null;
    if (otherUserId) {
      typingRef = ref(database, `typing/${activeChatId}/${otherUserId}`);
      typingListener = onValue(typingRef, (snapshot) => {
        if (isActive) setIsOtherTyping(!!snapshot.val());
      });
    }

    return () => {
      isActive = false;
      off(messagesRef, 'value', listener);
      if (typingRef && typingListener) off(typingRef, 'value', typingListener);
    };
  }, [activeChatId, user]);

  useEffect(() => {
    if (!showScanner || !user?.id) return;

    const html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        if (decodedText && decodedText.startsWith("REC:")) {
          const parts = decodedText.split(":");
          if (parts.length >= 3 && parts[1] === user.id) {
            const scannedPwd = parts.slice(2).join(":");
            if (user.encryptedPrivateKey) {
              try {
                const payload = JSON.parse(user.encryptedPrivateKey);
                decryptPrivateKeyWithPassword(payload, scannedPwd).then(res => {
                  if (res) {
                    localStorage.setItem(`privKey_${user.id}`, res);
                    html5QrCode.stop().then(() => {
                      setShowScanner(false);
                      window.location.reload();
                    });
                  } else {
                    alert("Invalid Master Password in QR Code.");
                  }
                });
              } catch(e) {
                console.error(e);
              }
            } else {
              alert("Your account does not have an encrypted backup.");
            }
          } else {
            alert("This QR Code does not match your account.");
          }
        } else if (decodedText && decodedText.length > 50) {
          localStorage.setItem(`privKey_${user.id}`, decodedText);
          html5QrCode.stop().then(() => {
            setShowScanner(false);
            window.location.reload();
          });
        }
      },
      (errorMessage) => {
        // parse errors are normal while scanning, ignore
      }
    ).catch((err) => {
      console.error("Camera start failed:", err);
      alert("Failed to start camera. Please check permissions.");
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [showScanner, user?.id]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleStartChatDirect();
  };

  const handleStartChatDirect = async (targetUserOverride?: string) => {
    const target = targetUserOverride || searchUsername;
    if (!target) return;
    
    setIsSearching(true);
    setSearchError("");
    
    try {
      const res = await startChatAction(target);
      if (res.success && res.chatId) {
        setActiveChatId(res.chatId);
        setSearchUsername("");
      } else {
        setSearchError(res.error || "User not found");
      }
    } catch (err) {
      setSearchError("An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
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
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress to 70% JPEG
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;
    
    if (file.type.startsWith("video/")) {
      alert("Video uploads have been disabled.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (file.type.startsWith("image/")) {
        setIsUploading(true);
        const base64Media = await compressImage(file);
        await sendOptimisticMessage("", base64Media);
      }
    } catch (err) {
      console.error("Failed to process media", err);
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (activeChatId && user) {
      const myTypingRef = ref(database, `typing/${activeChatId}/${user.id}`);
      import('firebase/database').then(({ set }) => {
        set(myTypingRef, true).catch(console.error);
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          set(myTypingRef, false).catch(console.error);
        }, 2000);
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !isUploading) return;
    
    const text = newMessage;
    setNewMessage(""); // Clear input instantly
    setShowEmojiPicker(false);
    
    // Clear typing indicator immediately
    if (activeChatId && user) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const myTypingRef = ref(database, `typing/${activeChatId}/${user.id}`);
      import('firebase/database').then(({ set }) => set(myTypingRef, false));
    }
    
    await sendOptimisticMessage(text, null);
  };

  const sendOptimisticMessage = async (text: string, imageUrl: string | null) => {
    if (!activeChatId || !user) return;
    
    const activeChatOtherUser = chats.find(c => c.id === activeChatId)?.otherUser;
    const recipientPubKey = activeChatOtherUser?.publicKey;
    const myPubKey = (user as any).publicKey || localStorage.getItem(`pubKey_${user.id}`);
    
    let finalPayload = undefined;
    let finalPlainText = text;
    let finalImageUrl = imageUrl;
    
    if (recipientPubKey && myPubKey) {
      try {
        finalPayload = await encryptPayload({ text, imageUrl }, [myPubKey, recipientPubKey]);
        finalPlainText = "";
        finalImageUrl = null;
      } catch(err) {
        console.error("Encryption failed", err);
      }
    }

    const tempId = `temp-${Date.now()}`;
    const pendingMsg = {
      id: tempId,
      senderId: user.id,
      text: text, // Show plaintext instantly to sender
      imageUrl: imageUrl, 
      createdAt: new Date().toISOString(),
      isPending: true
    };
    
    setPendingMessages(prev => [...prev, pendingMsg]);
    
    try {
      let success = false;
      let attempts = 0;
      
      while (!success && attempts < 5) {
        try {
          const result = await sendMessageAction(activeChatId, finalPlainText, finalImageUrl || undefined, finalPayload);
          if (result?.error) throw new Error(result.error);
          success = true;
        } catch (err) {
          attempts++;
          if (attempts >= 5) throw err;
          // Wait before retrying (2s, 4s, 6s, 8s) to gracefully handle internet cuts
          await new Promise(res => setTimeout(res, 2000 * attempts));
        }
      }
      
      // Note: We no longer need to manually fetch messages here!
      // The Firebase onValue listener handles decrypting and updating the state instantly.
    } catch(err) {
      console.error("Failed to send message", err);
    } finally {
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleDeleteMessage = async (forEveryone: boolean) => {
    if (!messageToDelete || !activeChatId) return;
    const msgId = messageToDelete.id;
    setMessageToDelete(null);
    
    setMessages(prev => {
      if (forEveryone) {
        return prev.map(m => m.id === msgId ? { ...m, text: "This message was deleted", isDeleted: true } : m);
      } else {
        return prev.filter(m => m.id !== msgId);
      }
    });

    const { deleteMessageAction } = await import("@/app/actions");
    await deleteMessageAction(activeChatId, msgId, forEveryone);
  };

  if (!user) return null;
  
  const activeChatData = chats.find(c => c.id === activeChatId);
  const activeChatOtherUser = activeChatData?.otherUser;

  // Check for missing local key
  const isMissingKey = typeof window !== 'undefined' ? !localStorage.getItem(`privKey_${user?.id}`) && user?.publicKey : false;

  return (
    <>
      {/* Missing Key Warning Overlay */}
      {isMissingKey && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-deep p-8 rounded-3xl max-w-md text-center shadow-2xl relative">
            <div className="w-16 h-16 bg-pink/10 text-pink rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-navy-dark dark:text-white mb-2">Messages Locked</h2>
            <p className="text-gray-text mb-6">
              You are logging in from a new device. To read your encrypted messages, you must unlock your encryption key using your Master Password.
            </p>
            <p className="mt-8 text-sm text-gray-text">
              Don't have a Master Password set yet?{" "}
              <Link href="/profile?edit=e2ee" className="text-purple font-semibold hover:underline">
                Go to Profile to add one
              </Link>
            </p>

            <div className="mt-6 border-t border-purple-light/20 pt-6 w-full flex flex-col items-center">
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="text-sm font-semibold text-navy-dark dark:text-white hover:text-purple transition-colors"
              >
                {showScanner ? "Close Scanner" : "Scan Recovery QR Code"}
              </button>
              
              {showScanner && (
                <div className="mt-4 w-full max-w-sm bg-white dark:bg-navy-deep p-2 rounded-xl shadow-inner border border-purple-light/20 overflow-hidden relative">
                  <div id="reader" className="w-full rounded-lg overflow-hidden [&_video]:w-full [&_video]:object-cover"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-purple-light/20 flex-col bg-white dark:bg-navy-dark h-full ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header / New Chat */}
        <div className="p-4 border-b border-purple-light/20">
          <h2 className="font-heading font-bold text-2xl text-navy-dark dark:text-white mb-4">Messages</h2>
          <form onSubmit={handleStartChat} className="relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-text">
                @
              </span>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Start chat by username..."
                className="w-full bg-gray-50 dark:bg-navy-deep border border-purple-light/30 text-navy-dark dark:text-white rounded-full py-2 pl-8 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-light transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !searchUsername.trim()}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-purple hover:text-purple-bright disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>
            </div>
            {searchError && <p className="text-pink text-xs mt-2 ml-2">{searchError}</p>}
          </form>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden minimal-scrollbar">
          {isLoadingChats ? (
            <div className="p-8 flex justify-center items-center h-full text-purple/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-text flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>No messages yet.</p>
              <p className="text-sm mt-2">Search for a username above to start chatting!</p>
            </div>
          ) : (
            chats.map(chat => {
              const otherUserId = chat.participants.find((p: string) => p !== user.id);
              const isActive = activeChatId === chat.id;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-4 border-b border-purple-light/10 hover:bg-purple-light/5 transition-colors flex items-center gap-4 ${isActive ? 'bg-purple-light/10 border-l-4 border-l-purple' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-light to-blue flex items-center justify-center text-white shrink-0 overflow-hidden relative">
                    {chat.otherUser?.profilePicture ? (
                      <Image src={chat.otherUser.profilePicture} alt="Profile" fill className="object-cover" sizes="48px" />
                    ) : (
                      <UserIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-navy-dark dark:text-white truncate">
                        {chat.otherUser?.name || (otherUserId ? `User ${otherUserId.substring(0, 4)}...` : 'Unknown')}
                      </h3>
                      <span className="text-xs text-gray-text shrink-0">
                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-text truncate">
                        {chat.lastMessage || "Started a chat"}
                      </p>
                      {chat.unreadCount > 0 && !isActive && (
                        <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white shadow-sm">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col bg-gray-50/50 dark:bg-navy-deep max-w-full overflow-x-hidden ${!activeChatId ? 'hidden md:flex' : 'flex fixed inset-0 z-[100] md:static md:z-auto'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-text p-8 text-center">
            <MessageSquare className="h-16 w-16 mb-6 opacity-20" />
            <h2 className="text-2xl font-heading font-bold text-navy-dark dark:text-white mb-2">Your Messages</h2>
            <p className="max-w-md">Select a conversation from the sidebar or start a new one to begin chatting.</p>
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="h-[60px] border-b border-purple-light/20 flex items-center justify-between px-2 sm:px-6 bg-white dark:bg-navy-dark shrink-0 shadow-sm z-10">
              <div className="flex items-center">
                <button onClick={() => setActiveChatId(null)} className="md:hidden mr-1 p-2 text-navy-dark dark:text-white hover:bg-gray-100 dark:hover:bg-navy-deep rounded-full transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <Link href={`/profile/${activeChatOtherUser?.username || activeChatOtherUser?.id}`} className="flex items-center group cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-light to-blue flex items-center justify-center text-white mr-3 relative overflow-hidden">
                    {activeChatOtherUser?.profilePicture ? (
                      <Image src={activeChatOtherUser.profilePicture} alt="Profile" fill className="object-cover" sizes="40px" />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[16px] text-navy-dark dark:text-white flex items-center gap-2">
                      {activeChatOtherUser?.name || 'Chat'}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-[-2px]">
                      {(() => {
                        if (!activeChatOtherUser?.lastActiveAt) return "last seen recently";
                        const diffMins = Math.floor((Date.now() - new Date(activeChatOtherUser.lastActiveAt).getTime()) / 60000);
                        if (diffMins < 5) return <span className="text-purple">online</span>;
                        if (diffMins < 60) return `last seen ${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
                        const diffHrs = Math.floor(diffMins / 60);
                        if (diffHrs < 24) return `last seen ${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
                        if (diffHrs < 48) return "last seen yesterday";
                        return `last seen ${Math.floor(diffHrs/24)} days ago`;
                      })()}
                    </p>
                  </div>
                </Link>
              </div>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-deep rounded-full transition-colors">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
            
            {/* Messages Scroll Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 gap-4 minimal-scrollbar flex flex-col-reverse">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center text-purple/50">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : messages.length === 0 && pendingMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-text">
                  <p>Send a message to start the conversation!</p>
                </div>
              ) : (
                <>
                {isOtherTyping && (
                  <div className="flex justify-start mt-6 mb-2">
                    <div className="bg-white dark:bg-navy-dark border border-purple-light/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 w-16 h-10">
                      <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </div>
                )}
                {[...messages, ...pendingMessages.filter(pm => 
                  // Don't render pending messages that have already been fetched by background polling
                  !messages.some(m => m.senderId === pm.senderId && m.text === pm.text && m.imageUrl === pm.imageUrl)
                )].reverse().map((msg, i, arr) => {
                  const isMine = msg.senderId === user.id;
                  const showAvatar = i === 0 || arr[i-1].senderId !== msg.senderId;
                  const showDateHeader = i === arr.length - 1 || new Date(msg.createdAt).toDateString() !== new Date(arr[i+1].createdAt).toDateString();
                  
                  const formatDateHeader = (dateString: string) => {
                    const date = new Date(dateString);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);

                    if (date.toDateString() === today.toDateString()) return "Today";
                    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
                    
                    const diffTime = today.getTime() - date.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    if (diffDays < 7) {
                      return date.toLocaleDateString(undefined, { weekday: 'long' });
                    }
                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  };
                  
                  return (
                    <div key={msg.id} className="flex flex-col">
                      {showDateHeader && (
                        <div className="flex justify-center w-full my-6 mb-2">
                          <span className="bg-purple-light/10 dark:bg-navy-dark text-purple dark:text-gray-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {formatDateHeader(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-6' : 'mt-1'} group`}>
                        {!isMine && showAvatar && (
                        <Link href={`/profile/${activeChatOtherUser?.username || activeChatOtherUser?.id}`} className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-light to-blue mr-2 shrink-0 self-end mb-1 flex items-center justify-center relative overflow-hidden hover:ring-2 ring-purple transition-all shadow-sm">
                          {activeChatOtherUser?.profilePicture ? (
                            <Image src={activeChatOtherUser.profilePicture} alt="Profile" fill className="object-cover" sizes="32px" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-white" />
                          )}
                        </Link>
                      )}
                      {!isMine && !showAvatar && <div className="w-10 shrink-0" />}
                      
                      <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? 'mr-2 order-first' : 'ml-2'}`}>
                        <button onClick={() => setMessageToDelete(msg)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      <div 
                        className={`relative max-w-[75%] px-4 py-2 text-[15px] shadow-sm ${
                          !isMine 
                            ? 'bg-gradient-to-br from-purple to-purple-bright text-white rounded-2xl rounded-tl-sm' 
                            : 'bg-white dark:bg-navy-dark text-navy-dark dark:text-white border border-purple-light/20 rounded-2xl rounded-tr-sm'
                        } ${msg.isPending ? 'opacity-70' : ''}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMessageToDelete(msg);
                        }}
                      >
                        {msg.imageUrl && !msg.isDeleted && (
                          <div className="mb-2 relative w-full overflow-hidden rounded-xl bg-black/10">
                            {msg.imageUrl.startsWith("data:video/") || msg.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                              <video src={msg.imageUrl} controls playsInline className="max-w-full h-auto max-h-64 rounded-xl" />
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={msg.imageUrl} alt="Shared media" className="max-w-full h-auto object-contain max-h-64" />
                            )}
                          </div>
                        )}
                        {msg.sharedPost && !msg.isDeleted && (
                          <div className="mb-2 w-full max-w-[240px] overflow-hidden rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 p-2 cursor-pointer transition-transform hover:scale-[1.02]"
                               onClick={() => window.open(msg.sharedPost.isDiscovery ? `/discover/${msg.sharedPost.id}` : `/profile/${msg.sharedPost.authorId}?post=${msg.sharedPost.id}`, '_blank')}>
                            {msg.sharedPost.imageUrl && (
                              <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden bg-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={msg.sharedPost.imageUrl} alt="Shared Post" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="px-1 pb-1">
                              <p className={`font-semibold text-sm line-clamp-1 ${!isMine ? 'text-white' : 'text-navy-deep dark:text-white'}`}>
                                {msg.sharedPost.authorName}'s Post
                              </p>
                              {msg.sharedPost.text && (
                                <p className={`text-xs opacity-80 line-clamp-2 mt-1 ${!isMine ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {msg.sharedPost.text}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {msg.text && (
                          <p className={`break-words whitespace-pre-wrap ${msg.isDeleted ? (!isMine ? 'italic text-white/70' : 'italic text-gray-400') : ''}`}>
                            {msg.text}
                          </p>
                        )}
                        <span className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${!isMine ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMine && msg.isPending && <Clock className="w-3 h-3 text-gray-400" />}
                          {isMine && !msg.isPending && msg.status === "sent" && <Check className="w-3.5 h-3.5 text-gray-400" />}
                          {isMine && !msg.isPending && msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-gray-400" />}
                          {isMine && !msg.isPending && msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
                </>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-2 md:p-4 bg-white dark:bg-navy-dark border-t border-purple-light/20 shrink-0 relative">
              
              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-purple-light/20"
                  >
                    <MediaPicker 
                      onEmojiClick={(emojiData: any) => setNewMessage(prev => prev + emojiData.emoji)}
                      onGifClick={(gifUrl: string) => {
                        setShowEmojiPicker(false);
                        sendOptimisticMessage("", gifUrl);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-end w-full">
                <div className="flex-1 bg-gray-50 dark:bg-navy-deep border border-purple-light/30 rounded-3xl flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-purple-light transition-all">
                  
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-gray-400 hover:text-purple transition-colors shrink-0"
                  >
                    <Smile className="w-6 h-6" />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-navy-dark dark:text-white px-2 py-2 text-[16px] focus:outline-none min-w-0 placeholder-gray-400"
                  />

                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 text-gray-400 hover:text-purple transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                  </button>

                </div>

                <button
                  type="submit"
                  disabled={!newMessage.trim() && !isUploading}
                  className="bg-purple text-white rounded-full p-3.5 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-50 shrink-0 flex items-center justify-center mb-0.5"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {messageToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-deep rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-navy-dark">
              <h3 className="font-semibold text-lg text-navy-dark dark:text-white">Message Options</h3>
            </div>
            <div className="p-2">
              <button 
                onClick={() => handleDeleteMessage(false)}
                className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 font-medium flex items-center gap-3 transition-colors"
              >
                <Trash className="w-5 h-5" />
                Delete for me
              </button>
              {messageToDelete.senderId === user.id && !messageToDelete.isDeleted && (
                <button 
                  onClick={() => handleDeleteMessage(true)}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 font-medium flex items-center gap-3 mt-1 transition-colors"
                >
                  <Trash className="w-5 h-5" />
                  Delete for everyone
                </button>
              )}
            </div>
            <div className="p-2 border-t border-gray-100 dark:border-navy-dark">
              <button 
                onClick={() => setMessageToDelete(null)}
                className="w-full py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 dark:bg-navy-dark dark:hover:bg-purple-light/20 text-navy-dark dark:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
