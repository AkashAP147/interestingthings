import { Flame, FolderHeart, Bookmark, Settings, User as UserIcon } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getDailyDiscoveries } from "@/lib/data";
import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import Link from "next/link";

export default async function ProfilePage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUserAction();
  if (!user) redirect("/");

  const savedDiscoveries = await getDailyDiscoveries();
  const currentTab = searchParams?.tab || "saved";

  const activityDates = user.activityDates || [];
  const streakCount = user.streakCount || 0;
  
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
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center overflow-hidden text-white font-heading text-3xl font-bold shadow-md">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10" />
            )}
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-navy-dark dark:text-white">
              {user.name || "Curious Explorer"}
            </h1>
            <p className="text-gray-text mt-1">@{user.username || user.id}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-orange bg-orange/10 px-3 py-1 rounded-full animate-in slide-in-from-bottom-2 fade-in duration-500">
                {user.curiosityPoints || 0} Curiosity Points
              </span>
            </div>
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
          <Link href="?tab=saved" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'saved' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <Bookmark className="h-5 w-5" /> Saved Discoveries
          </Link>
          <Link href="?tab=collections" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'collections' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <FolderHeart className="h-5 w-5" /> My Collections
          </Link>
          <Link href="?tab=settings" className={`flex items-center gap-2 font-semibold whitespace-nowrap pb-4 -mb-4 transition-colors ${currentTab === 'settings' ? 'text-purple border-b-2 border-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}>
            <Settings className="h-5 w-5" /> Settings
          </Link>
        </div>

        {currentTab === 'settings' ? (
          <div className="py-8">
            <ProfileForm />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedDiscoveries.map(discovery => (
              <DiscoveryCard key={discovery.id} discovery={discovery} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
