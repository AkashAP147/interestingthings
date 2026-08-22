"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNotificationsAction, markNotificationsReadAction, updateUserLocationAction, getFriendSuggestionsAction } from "@/app/actions";
import { Bell, Sparkles, User as UserIcon, Loader2, MessageSquare, MapPin, Users, Navigation, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    // Load from local storage instantly
    const cachedNotifs = localStorage.getItem(`timit_notifs_${user.id}`);
    if (cachedNotifs) {
      try {
        setNotifications(JSON.parse(cachedNotifs));
        setIsLoading(false);
      } catch (e) {}
    }

    const fetchAndMarkRead = async () => {
      try {
        const res = await getNotificationsAction();
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
          localStorage.setItem(`timit_notifs_${user.id}`, JSON.stringify(res.notifications));
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
    
    // Load initial suggestions if available
    const cachedSuggestions = localStorage.getItem(`timit_suggestions_${user.id}`);
    if (cachedSuggestions) {
      try {
        setSuggestions(JSON.parse(cachedSuggestions));
      } catch (e) {}
    }

    const fetchSuggestions = async () => {
      const res = await getFriendSuggestionsAction();
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
        localStorage.setItem(`timit_suggestions_${user.id}`, JSON.stringify(res.suggestions));
        // If we get suggestions that have a location score, it means location is already enabled
        if (res.suggestions.some((s: any) => s.distanceKm !== undefined)) {
          setLocationEnabled(true);
        }
      }
    };
    fetchSuggestions();
  }, [user, router]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsLoadingSuggestions(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await updateUserLocationAction(position.coords.latitude, position.coords.longitude);
        setLocationEnabled(true);
        
        // Refresh suggestions
        const res = await getFriendSuggestionsAction();
        if (res.success && res.suggestions) {
          setSuggestions(res.suggestions);
        }
      } catch (err) {
        console.error("Failed to update location", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, (error) => {
      console.error("Geolocation error", error);
      alert("Failed to get location. Please allow location permissions in your browser.");
      setIsLoadingSuggestions(false);
    });
  };

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
        
        {/* Friend Suggestions Section */}
        <div className="bg-gradient-to-br from-purple-light/10 to-transparent border-b border-purple-light/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-navy-dark dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple" />
              Suggested Friends
            </h2>
          </div>
          
          {suggestions.length === 0 ? (
             <p className="text-sm text-gray-text italic">No suggestions right now. Try following more people!</p>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2 minimal-scrollbar">
              {suggestions.map((s, idx) => (
                <Link 
                  key={idx}
                  href={`/profile/${s.user.username || s.user.id}`}
                  className="flex-shrink-0 w-48 bg-white dark:bg-navy-dark border border-purple-light/20 rounded-2xl p-4 flex flex-col items-center text-center hover:border-purple hover:shadow-md transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-light to-blue p-[2px] mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-navy-deep flex items-center justify-center">
                      {s.user.profilePicture ? (
                        <img src={s.user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-8 h-8 text-purple/50" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-navy-dark dark:text-white truncate w-full group-hover:text-purple transition-colors">
                    {s.user.name || s.user.username || "User"}
                  </h3>
                  <p className="text-xs text-purple mt-1 font-medium bg-purple/10 px-2 py-0.5 rounded-full inline-block">
                    {s.reason}
                  </p>
                </Link>
              ))}
            </div>
          )}
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
            notifications.map(notif => {
              const content = (
                <>
                  <div className="p-3 rounded-full bg-purple-light/20 text-purple shrink-0 mt-1">
                    {notif.type === 'follow' ? <UserIcon className="w-5 h-5" /> : 
                     notif.type === 'message' ? <MessageSquare className="w-5 h-5" /> : 
                     notif.type === 'post' ? <ImageIcon className="w-5 h-5" /> :
                     notif.type === 'suggestion' ? <MapPin className="w-5 h-5" /> :
                     <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-dark dark:text-white text-base">
                      {notif.actorId ? (
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/profile/${notif.actorUsername || notif.actorId}`);
                          }}
                          className="font-bold hover:text-purple transition-colors cursor-pointer"
                        >
                          {notif.actorName || "Someone"}
                        </span>
                      ) : (
                        <span className="font-bold">{notif.actorName || "Someone"}</span>
                      )}
                      {notif.type === 'follow' ? " started following you." : 
                       notif.type === 'message' ? " sent you a new message." : 
                       notif.type === 'post' ? " posted a post today" :
                       notif.type === 'suggestion' ? " is nearby! Say hello." :
                       " interacted with you."}
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
                </>
              );

              const wrapperClass = `p-6 hover:bg-purple-light/5 transition-colors flex items-start gap-4 ${!notif.read ? 'bg-purple-light/5' : ''}`;

              if (notif.link) {
                return (
                  <Link key={notif.id} href={notif.link} className={wrapperClass}>
                    {content}
                  </Link>
                );
              }

              return (
                <div key={notif.id} className={wrapperClass}>
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
