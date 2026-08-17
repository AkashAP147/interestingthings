import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getTrendingDiscoveries } from "@/lib/data";
import { TrendingUp } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function TrendingPage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/");
  }

  const trendingDiscoveries = await getTrendingDiscoveries();

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col items-center text-center gap-6 border-b border-purple-light/20 pb-12">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-navy-dark dark:text-white flex items-center gap-4">
          <TrendingUp className="h-12 w-12 text-pink" /> Trending Discoveries
        </h1>
        <p className="text-xl text-gray-text max-w-2xl">
          The most viewed, saved, and shared discoveries across the internet right now.
        </p>
      </div>

      <div className="flex flex-col gap-12 max-w-5xl mx-auto w-full">
        {trendingDiscoveries.map((discovery, index) => (
          <div key={discovery.id} className="relative">
            {/* Rank Indicator */}
            <div className="absolute -left-4 sm:-left-12 top-8 text-5xl sm:text-7xl font-heading font-black text-purple-light dark:text-white/5 select-none z-0">
              #{index + 1}
            </div>
            
            <div className="relative z-10 pl-6 sm:pl-16">
              <DiscoveryCard discovery={discovery} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
