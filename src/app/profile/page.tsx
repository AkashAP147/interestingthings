import { Flame, FolderHeart, Bookmark, Settings, User as UserIcon, Shield } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { readDB } from "@/lib/db";
import { getCurrentUserAction, getCachedUserConnectionsAction, getCachedUserPostsAction, getSavedPostsAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";
import { GalleryTab } from "@/components/GalleryTab";
import ProfileStatsModal from "@/components/profile/ProfileStatsModal";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";

export default async function ProfilePage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUserAction();
  if (!user) redirect("/");

  const currentTab = searchParams?.tab || "gallery";
  
  // Parallelize data fetching
  const [allData, postsRes, connectionsRes, savedPostsRes] = await Promise.all([
    currentTab === "saved" ? readDB() : Promise.resolve([]),
    currentTab === "gallery" ? getCachedUserPostsAction(user.id, user.id) : Promise.resolve({ success: false, posts: [] }),
    getCachedUserConnectionsAction(user.id),
    currentTab === "collections" ? getSavedPostsAction(user.id) : Promise.resolve({ success: false, posts: [] })
  ]);

  let savedDiscoveries: any[] = [];
  if (currentTab === "saved") {
    savedDiscoveries = allData.filter((d: any) => user.likes?.includes(d.id));
  }
  
  let userPosts: any[] = [];
  if (currentTab === "gallery" && postsRes.success) {
    userPosts = postsRes.posts;
  }

  let collectionsPosts: any[] = [];
  if (currentTab === "collections" && savedPostsRes.success) {
    collectionsPosts = savedPostsRes.posts;
  }

  const activityDates = user.activityDates || [];
  const streakCount = user.streakCount || 0;
  
  // Fetch full user objects for connections
  const followers = connectionsRes.followers || [];
  const following = connectionsRes.following || [];
  const friends = followers.filter((f: any) => following.some((fw: any) => fw.id === f.id));
  
  const followerCount = followers.length;
  const followingCount = following.length;
  
  // Get current week's dates (Mon - Sun)
  const todayDate = new Date();
  const day = todayDate.getDay();
  const diffToMonday = todayDate.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(todayDate.setDate(diffToMonday));
  
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weekActivity = weekDays.map((name, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dateString = d.toISOString().split("T")[0];
    return {
      name,
      active: activityDates.includes(dateString)
    };
  });

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto w-full py-12 flex flex-col gap-12">
      {/* Profile Header & Streak */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 bg-white dark:bg-navy-deep p-8 rounded-3xl shadow-sm border border-purple-light/20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <EditProfileModal user={user} />
          <div className="flex flex-col items-center md:items-start">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-navy-dark dark:text-white">
              {user.name || "Curious Explorer"}
            </h1>
            <p className="text-gray-text mt-1">@{user.username || user.id}</p>
            <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
              <span className="text-sm font-semibold text-orange bg-orange/10 px-3 py-1 rounded-full animate-in slide-in-from-bottom-2 fade-in duration-500">
                {user.curiosityPoints || 0} Curiosity Points
              </span>
            </div>
            <ProfileStatsModal 
              followers={followers} 
              following={following} 
              friends={friends} 
              followerCount={followerCount} 
              followingCount={followingCount} 
              compact={true}
            />
            {user.bio && (
              <p className="text-sm text-navy-dark/80 dark:text-white/80 mt-4 max-w-md leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Streak Component */}
        <div className="bg-purple-light/30 dark:bg-navy-dark p-6 rounded-2xl flex flex-col items-center">
          <h3 className="font-heading font-semibold text-navy-dark dark:text-white flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange" /> {streakCount} Day Curiosity Streak
          </h3>
          <div className="flex gap-2 text-sm font-medium text-gray-text">
            {weekActivity.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span>{day.name}</span>
                {day.active ? (
                  <span className="text-orange">✓</span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-700">○</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8 border-b border-purple-light/50 pb-4 overflow-x-auto">
          <Link href="?tab=gallery" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'gallery' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <ImageIcon className="h-5 w-5" /> Gallery
          </Link>
          <Link href="?tab=saved" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'saved' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <Bookmark className="h-5 w-5" /> Saved Discoveries
          </Link>
          <Link href="?tab=collections" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'collections' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <FolderHeart className="h-5 w-5" /> My Collections
          </Link>

          {user.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors text-purple-bright hover:text-purple ml-auto border-l border-purple-light/50 pl-8">
              <Shield className="h-5 w-5" /> Admin Panel
            </Link>
          )}
        </div>

        {currentTab === 'gallery' ? (
          <div className="py-8">
            <GalleryTab initialPosts={userPosts} profileName={user.name || user.username} />
          </div>
        ) : currentTab === 'collections' ? (
          <div className="py-8">
            {collectionsPosts.length === 0 ? (
              <div className="py-24 text-center text-gray-text">
                <FolderHeart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-heading font-semibold text-navy-dark dark:text-white">No Saved Posts</h3>
                <p className="mt-2 max-w-md mx-auto">Double tap or bookmark posts in the Home feed to save them to your collections.</p>
              </div>
            ) : (
              <GalleryTab initialPosts={collectionsPosts} profileName={user.name || user.username} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedDiscoveries.length === 0 ? (
              <div className="col-span-full py-24 text-center text-gray-text">
                <Bookmark className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-heading font-semibold text-navy-dark dark:text-white">No Saved Discoveries</h3>
                <p className="mt-2 max-w-md mx-auto">You haven't saved any discoveries yet. Start exploring and bookmark your favorites!</p>
              </div>
            ) : (
              savedDiscoveries.map(discovery => (
                <DiscoveryCard key={discovery.id} discovery={discovery} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
