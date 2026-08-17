import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getTrendingDiscoveries } from "@/lib/data";
import { TrendingUp, Users, Search as SearchIcon } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { UserSearchClient } from "@/components/UserSearchClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search & Trending",
  description: "Search for users, discover interesting things, and see what's trending across the community.",
};

export default async function SearchPage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/?login=true");
  }

  const trendingDiscoveries = await getTrendingDiscoveries();

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto w-full py-12 flex flex-col gap-16">
      
      {/* Removed Header for compactness */}

      {/* User Search Section */}
      <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 text-blue text-sm font-semibold mb-6">
          <Users className="w-4 h-4" />
          <span>Find Explorers</span>
        </div>
        <UserSearchClient />
      </div>

      {/* Trending Discoveries Section */}
      <div className="flex flex-col gap-8 w-full">
        <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
          <TrendingUp className="h-8 w-8 text-pink" />
          <h2 className="font-heading text-3xl font-bold text-navy-dark dark:text-white">Trending Discoveries</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingDiscoveries.map((discovery, index) => (
            <DiscoveryCard key={discovery.id} discovery={discovery} index={index} variant="image-only" />
          ))}
        </div>
      </div>

    </div>
  );
}
