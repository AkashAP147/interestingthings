import { DiscoveryCard } from "@/components/DiscoveryCard";
import { getAllDiscoveries } from "@/lib/data";
import { DiscoverFilters } from "@/components/DiscoverFilters";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
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
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white">
          Discover Something Interesting
        </h1>
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
    </div>
  );
}
