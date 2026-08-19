"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNotificationsAction, markNotificationsReadAction } from "@/app/actions";
import { Bell, Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const fetchAndMarkRead = async () => {
      try {
        const res = await getNotificationsAction();
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
        }
        
        // Mark as read after fetching
        const unreadNotifs = res.notifications?.filter((n: any) => !n.read).length || 0;
        if (unreadNotifs > 0) {
          await markNotificationsReadAction();
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMarkRead();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-navy-deep rounded-3xl shadow-xl overflow-hidden border border-purple-light/20">
        <div className="p-6 border-b border-purple-light/10 flex items-center gap-3 bg-purple-light/5">
          <div className="p-3 bg-purple/10 text-purple rounded-full">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-navy-dark dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-text">Catch up on what you missed</p>
          </div>
        </div>

        <div className="divide-y divide-purple-light/5 min-h-[400px]">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center text-purple/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-gray-text">
              <Bell className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-semibold text-navy-dark dark:text-white">All caught up!</p>
              <p className="text-sm mt-2">You don't have any notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-6 hover:bg-purple-light/5 transition-colors flex items-start gap-4 ${!notif.read ? 'bg-purple-light/5' : ''}`}
              >
                <div className="p-3 rounded-full bg-purple-light/20 text-purple shrink-0 mt-1">
                  {notif.type === 'follow' ? <UserIcon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-navy-dark dark:text-white text-base">
                    {notif.actorId ? (
                      <Link href={`/profile/${notif.actorId}`} className="font-bold hover:text-purple transition-colors">
                        {notif.actorName || "Someone"}
                      </Link>
                    ) : (
                      <span className="font-bold">{notif.actorName || "Someone"}</span>
                    )}
                    {notif.type === 'follow' ? " started following you." : " liked your photo."}
                  </p>
                  <span className="text-sm text-gray-text mt-2 block font-medium">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {!notif.read && (
                  <div className="w-3 h-3 rounded-full bg-pink shrink-0 mt-3 shadow-sm shadow-pink/30"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
