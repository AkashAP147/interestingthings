import { DiscoveryCard } from "@/components/DiscoveryCard";
import { categories } from "@/lib/categories";
import { getAllDiscoveries } from "@/lib/data";
import { CategoryFilters } from "@/components/CategoryFilters";
import { CategoryIcon } from "@/components/CategoryIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  
  if (!category) {
    return { title: "Not Found" };
  }
  
  return {
    title: `${category.name} Discoveries`,
    description: category.description,
    openGraph: {
      title: `${category.name} | TIMIT`,
      description: category.description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${category.name} | TIMIT`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ q?: string; sort?: string }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const category = categories.find(c => c.slug === resolvedParams.slug);
  
  if (!category) {
    notFound();
  }

  let discoveries = await getAllDiscoveries();

  // 1. Filter by this Category
  discoveries = discoveries.filter(d => d.categoryId === category.id);

  // 2. Filter by Search Query
  if (resolvedSearchParams.q) {
    const query = resolvedSearchParams.q.toLowerCase();
    discoveries = discoveries.filter(d => 
      d.title.toLowerCase().includes(query) || 
      d.description.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  // 3. Sort
  const sort = resolvedSearchParams.sort || "newest";
  discoveries.sort((a, b) => {
    if (sort === "popular") return b.views - a.views;
    if (sort === "saved") return b.saves - a.saves;
    if (sort === "trending") return (b.views + b.saves * 2) - (a.views + a.saves * 2);
    // default: newest
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col gap-6 border-b border-purple-light/30 pb-10">
        <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-text hover:text-purple transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Link>
        <div className="flex items-center gap-4">
          <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${category.color} text-white shadow-sm`}>
            <CategoryIcon name={category.icon} className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white">
              {category.name}
            </h1>
            <p className="text-gray-text mt-2 max-w-2xl">
              {category.description}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <CategoryFilters />
        </div>
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
          <p className="text-gray-text">Try adjusting your search keywords for this category.</p>
        </div>
      )}
    </div>
  );
}
