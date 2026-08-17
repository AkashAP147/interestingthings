import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getAllDiscoveries } from "@/lib/data";
import { DiscoverFilters } from "@/components/DiscoverFilters";
import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { categories } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse the internet's most interesting things by category, popularity, or what's trending.",
};

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  let discoveries = await getAllDiscoveries();

  // 1. Filter by Search Query
  if (params.q) {
    const query = params.q.toLowerCase();
    discoveries = discoveries.filter(d => 
      d.title.toLowerCase().includes(query) || 
      d.description.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  // 2. Filter by Category
  if (params.category && params.category !== "all") {
    discoveries = discoveries.filter(d => d.categoryId === params.category);
  }

  // 3. Sort
  const sort = params.sort || "newest";
  discoveries.sort((a, b) => {
    if (sort === "popular") return b.views - a.views;
    if (sort === "saved") return b.saves - a.saves;
    if (sort === "trending") return (b.views + b.saves * 2) - (a.views + a.saves * 2);
    // default: newest
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-16">
      {/* Discover Search & Grid */}
      <div className="flex flex-col gap-6" id="feed">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-navy-dark dark:text-white">
          All Discoveries
        </h2>
        <DiscoverFilters />
      </div>

      {/* Grid */}
      {discoveries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {discoveries.map((discovery) => (
            <DiscoveryCard key={discovery.id} discovery={discovery} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-navy-deep rounded-3xl border border-purple-light/20 shadow-sm">
          <h2 className="text-2xl font-bold text-navy-dark dark:text-white mb-2">No discoveries found</h2>
          <p className="text-gray-text">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}

      {/* Categories Grid (Merged) */}
      {!params.category && !params.q && (
        <div className="flex flex-col gap-8 mt-8 border-t border-purple-light/20 pt-16">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-2">
            <div className="inline-flex items-center justify-center bg-purple-light/20 p-4 rounded-3xl mb-6 text-purple">
              <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white sm:text-5xl mb-4">
              Browse by Category
            </h1>
            <p className="text-lg text-gray-text">
              Dive deep into specific rabbit holes. We've organized the internet's most interesting things into neat little boxes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/discover?category=${category.id}`}
                className="group relative flex flex-col items-start justify-between rounded-3xl p-8 shadow-sm ring-1 ring-purple-light bg-white dark:bg-navy-deep hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full ${category.color} transition-transform duration-500 group-hover:scale-150`} />
                
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${category.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 relative z-10`}>
                  <CategoryIcon name={category.icon} className="h-8 w-8" />
                </div>
                
                <h3 className="font-heading text-2xl font-bold text-navy-dark dark:text-white group-hover:text-purple transition-colors relative z-10">
                  {category.name}
                </h3>
                <p className="mt-4 text-base text-gray-text line-clamp-3 relative z-10">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
