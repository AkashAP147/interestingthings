"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getChatsAction, updateUserLocationAction, getNotificationsAction, saveFCMTokenAction } from "@/app/actions";
import { decryptPayload } from "@/lib/e2ee";
import { messaging } from "@/lib/firebase-client";
import { getToken } from "firebase/messaging";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface NotificationContextType {
  permission: NotificationPermission;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Custom toast state
  const [toast, setToast] = useState<{ id: string; title: string; body: string; chatId: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const requestPermission = async () => {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm === "granted" && messaging) {
          try {
            const token = await getToken(messaging, { 
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
            });
            if (token) {
              await saveFCMTokenAction(token);
            }
          } catch (err) {
            console.error("FCM Token fetch failed", err);
          }
        }
      }
    };
    requestPermission();

    // Initialize latest seen time if not exists
    const storageKey = `lastNotificationTime_${user.id}`;
    const messagesTimeKey = `lastSeenMessagesTime_${user.id}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, new Date().toISOString());
    }

    const checkMessages = async () => {
      // If we are on messages page, reset unread count and time
      if (pathname === "/messages") {
        localStorage.setItem(messagesTimeKey, new Date().toISOString());
        setUnreadCount(0);
        return; // Don't show toast notifications if on messages page
      }

      try {
        const [res, notifsRes] = await Promise.all([
          getChatsAction(),
          getNotificationsAction()
        ]);
        
        const lastSeenStr = localStorage.getItem(storageKey);
        const lastSeenMessagesStr = localStorage.getItem(messagesTimeKey);
        
        let latestSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
        let currentMaxTime = latestSeenTime;
        let toastPayload: { title: string, body: string, link: string, icon?: string } | null = null;
        
        // 1. Check general notifications first
        if (notifsRes.success && notifsRes.notifications) {
          for (const notif of notifsRes.notifications) {
            const notifTime = new Date(notif.createdAt).getTime();
            if (notifTime > latestSeenTime && notif.actorId !== user.id) {
              if (notifTime > currentMaxTime) {
                currentMaxTime = notifTime;
                
                let title = "New Notification";
                let body = "";
                if (notif.type === 'suggestion') {
                  title = "Nearby Friend Suggestion";
                  body = `${notif.actorName} is nearby!`;
                } else if (notif.type === 'post') {
                  title = "New Post";
                  body = `${notif.actorName} posted a post today`;
                } else if (notif.type === 'follow') {
                  title = "New Follower";
                  body = `${notif.actorName} started following you.`;
                } else if (notif.type === 'like') {
                  title = "New Interaction";
                  body = `${notif.actorName} liked your post.`;
                }
                
                toastPayload = { title, body, link: notif.link || "/notifications" };
              }
            }
          }
        }

        // 2. Check chat messages
        if (res.success && res.chats) {
          let latestMessagesTime = lastSeenMessagesStr ? new Date(lastSeenMessagesStr).getTime() : 0;
          
          let hasNewMessage = false;
          let newestChat = null;
          let currentUnreadCount = 0;

          for (const chat of res.chats) {
            if (!chat) continue;
            const chatTime = new Date(chat.updatedAt).getTime();
            
            if (chat.lastMessageSenderId !== user.id && chatTime > latestMessagesTime) {
              currentUnreadCount++;
            }

            if (chatTime > latestSeenTime && chat.lastMessageSenderId !== user.id) {
              hasNewMessage = true;
              if (chatTime > currentMaxTime) {
                currentMaxTime = chatTime;
                newestChat = chat;
              }
            }
          }
          
          setUnreadCount(currentUnreadCount);

          if (hasNewMessage && newestChat) {
            const title = `New message from ${newestChat.otherUser?.name || 'someone'}`;
            let body = newestChat.lastMessage;

            if (newestChat.lastMessagePayload) {
              const privKey = localStorage.getItem(`privKey_${user.id}`);
              if (privKey) {
                const myKeyIndex = newestChat.lastMessageSenderId === user.id ? 0 : 1;
                const decrypted = await decryptPayload(newestChat.lastMessagePayload, privKey, myKeyIndex);
                if (decrypted) {
                  body = decrypted.imageUrl ? "📸 Image" : decrypted.text || "New encrypted message";
                }
              }
            }
            
            toastPayload = { title, body, link: "/messages", icon: newestChat.otherUser?.profilePicture || undefined };
          }
          
          if (toastPayload) {
            localStorage.setItem(storageKey, new Date(currentMaxTime).toISOString());
            
            // 1. Native Browser Notification
            if ("Notification" in window && Notification.permission === "granted") {
              const notification = new Notification(toastPayload.title, {
                body: toastPayload.body,
                icon: toastPayload.icon || "/favicon.ico",
              });
              notification.onclick = () => {
                window.focus();
                router.push(toastPayload!.link);
              };
            }

            // 2. In-App Toast
            setToast({
              id: Math.random().toString(),
              title: toastPayload.title,
              body: toastPayload.body,
              chatId: toastPayload.link // piggybacking on chatId for routing
            });

            setTimeout(() => {
              setToast(null);
            }, 5000);
          }
        }
      } catch (err) {
        console.error("Failed to check notifications:", err);
      }
    };

    // Background Location Tracking
    let lastLocationUpdate = 0;
    let geoWatchId: number | null = null;
    
    if (user && "geolocation" in navigator) {
      geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastLocationUpdate > 5 * 60 * 1000) { // Max once every 5 minutes
            lastLocationUpdate = now;
            updateUserLocationAction(position.coords.latitude, position.coords.longitude).catch(console.error);
          }
        },
        (error) => {
          console.warn("Background location tracking failed", error);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 }
      );
    }

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkMessages, 3000);
    
    // Poll every 15 seconds
    const interval = setInterval(checkMessages, 15000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (geoWatchId !== null) navigator.geolocation.clearWatch(geoWatchId);
    };
  }, [user, pathname, router]);

  return (
    <NotificationContext.Provider value={{ permission, unreadCount }}>
      {children}
      
      {/* Global In-App Toast Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-start gap-4 bg-white dark:bg-navy-deep p-4 rounded-2xl shadow-2xl border border-purple-light/30 max-w-sm cursor-pointer"
            onClick={() => {
              setToast(null);
              router.push(toast.chatId); // Uses the link provided
            }}
          >
            <div className="bg-purple/10 p-2 rounded-full text-purple mt-1 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-semibold text-navy-dark dark:text-white text-sm truncate">
                {toast.title}
              </h4>
              <p className="text-xs text-gray-text mt-1 line-clamp-2">
                {toast.body}
              </p>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
