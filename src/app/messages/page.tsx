"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { startChatAction, sendMessageAction, getChatsAction, getMessagesAction } from "@/app/actions";
import { Search, Send, MessageSquare, Loader2, User as UserIcon, ExternalLink, MoreHorizontal, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<any>(null);
  
  const [chatUsers, setChatUsers] = useState<Record<string, any>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Chats Polling
  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      try {
        const res = await getChatsAction();
        if (res.success && res.chats) {
          setChats(res.chats);
        }
      } catch (e) {
        console.error("Failed to fetch chats");
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // 10 seconds to save quota
    return () => clearInterval(interval);
  }, [user]);

  // Fetch Messages Polling
  useEffect(() => {
    if (!activeChatId) return;
    
    const fetchMessages = async () => {
      try {
        const res = await getMessagesAction(activeChatId);
        if (res.success && res.messages) {
          setMessages(res.messages);
        }
      } catch (e) {
        console.error("Failed to fetch messages");
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // 5 seconds to save quota
    return () => clearInterval(interval);
  }, [activeChatId]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    
    setIsSearching(true);
    setSearchError("");
    
    try {
      const res = await startChatAction(searchUsername);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    
    const text = newMessage;
    setNewMessage(""); // Optimistic clear
    
    await sendMessageAction(activeChatId, text);
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

  return (
    <>
      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r border-purple-light/20 flex flex-col bg-white dark:bg-navy-dark h-full">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chats.length === 0 ? (
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
                    <p className="text-sm text-gray-text truncate">
                      {chat.lastMessage || "Started a chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50/50 dark:bg-navy-deep ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-text p-8 text-center">
            <MessageSquare className="h-16 w-16 mb-6 opacity-20" />
            <h2 className="text-2xl font-heading font-bold text-navy-dark dark:text-white mb-2">Your Messages</h2>
            <p className="max-w-md">Select a conversation from the sidebar or start a new one to begin chatting.</p>
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="h-16 border-b border-purple-light/20 flex items-center px-6 bg-white dark:bg-navy-dark shrink-0 shadow-sm z-10">
              <button onClick={() => setActiveChatId(null)} className="md:hidden mr-4 text-purple">
                &larr; Back
              </button>
              <Link href={`/profile/${activeChatOtherUser?.username || activeChatOtherUser?.id}`} className="flex items-center group cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-light to-blue flex items-center justify-center text-white mr-3 relative overflow-hidden group-hover:ring-2 ring-purple transition-all">
                  {activeChatOtherUser?.profilePicture ? (
                    <Image src={activeChatOtherUser.profilePicture} alt="Profile" fill className="object-cover" sizes="40px" />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </div>
                <h3 className="font-bold text-navy-dark dark:text-white group-hover:text-purple transition-colors flex items-center gap-2">
                  {activeChatOtherUser?.name || 'Chat'}
                  <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            </div>
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-text">
                  <p>Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === user.id;
                  const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;
                  
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-6' : 'mt-1'} group`}>
                      {!isMine && showAvatar && (
                        <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 shrink-0 self-end mb-1 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      {!isMine && !showAvatar && <div className="w-10 shrink-0" />}
                      
                      <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? 'mr-2 order-first' : 'ml-2'}`}>
                        <button onClick={() => setMessageToDelete(msg)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      <div className={`relative max-w-[75%] px-4 py-2 text-[15px] shadow-sm ${
                        isMine 
                          ? 'bg-gradient-to-br from-purple to-purple-bright text-white rounded-2xl rounded-tr-sm' 
                          : 'bg-white dark:bg-navy-dark text-navy-dark dark:text-white border border-purple-light/20 rounded-2xl rounded-tl-sm'
                      }`}>
                        <p className={`break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-white/70 dark:text-gray-400' : ''}`}>
                          {msg.text}
                        </p>
                        <span className={`text-[10px] block mt-1 text-right ${isMine ? 'text-white/70' : 'text-gray-text'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-navy-dark border-t border-purple-light/20 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 dark:bg-navy-deep border border-purple-light/30 text-navy-dark dark:text-white rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-light transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-purple text-white rounded-full p-3 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-50 disabled:hover:bg-purple flex items-center justify-center"
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
