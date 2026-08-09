import { Flame, FolderHeart, Bookmark } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getDailyDiscoveries } from "@/lib/data";

export default async function ProfilePage() {
  const savedDiscoveries = await getDailyDiscoveries();

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto w-full py-12 flex flex-col gap-12">
      {/* Profile Header & Streak */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 bg-white dark:bg-navy-deep p-8 rounded-3xl shadow-sm border border-purple-light/20">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white font-heading text-3xl font-bold">
            U
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-navy-dark dark:text-white">
              Curious User
            </h1>
            <p className="text-gray-text mt-1">Explorer Level</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-orange bg-orange/10 px-3 py-1 rounded-full">
                120 Curiosity Points
              </span>
            </div>
          </div>
        </div>

        {/* Streak Component */}
        <div className="bg-purple-light/30 dark:bg-navy-dark p-6 rounded-2xl flex flex-col items-center">
          <h3 className="font-heading font-semibold text-navy-dark dark:text-white flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange" /> 5 Day Curiosity Streak
          </h3>
          <div className="flex gap-2 text-sm font-medium text-gray-text">
            <div className="flex flex-col items-center gap-2">
              <span>MON</span>
              <span className="text-orange">✓</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>TUE</span>
              <span className="text-orange">✓</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>WED</span>
              <span className="text-orange">✓</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>THU</span>
              <span className="text-orange">✓</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>FRI</span>
              <span className="text-orange">✓</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>SAT</span>
              <span className="text-gray-300 dark:text-gray-700">○</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span>SUN</span>
              <span className="text-gray-300 dark:text-gray-700">○</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8 border-b border-purple-light/50 pb-4 overflow-x-auto">
          <button className="flex items-center gap-2 text-purple font-semibold whitespace-nowrap border-b-2 border-purple pb-4 -mb-4">
            <Bookmark className="h-5 w-5" /> Saved Discoveries
          </button>
          <button className="flex items-center gap-2 text-gray-text hover:text-navy-dark dark:hover:text-white font-semibold whitespace-nowrap transition-colors">
            <FolderHeart className="h-5 w-5" /> My Collections
          </button>
          <button className="flex items-center gap-2 text-gray-text hover:text-navy-dark dark:hover:text-white font-semibold whitespace-nowrap transition-colors">
            <Flame className="h-5 w-5" /> Recently Viewed
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedDiscoveries.map(discovery => (
            <DiscoveryCard key={discovery.id} discovery={discovery} />
          ))}
        </div>
      </div>
    </div>
  );
}
