import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Share, ArrowLeft, ExternalLink } from "lucide-react";
import { getDiscoveryBySlug, getDiscoveriesByCategory } from "@/lib/data";
import { categories } from "@/lib/categories";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const discovery = await getDiscoveryBySlug(slug);
  
  if (!discovery) {
    return { title: "Not Found" };
  }
  
  return {
    title: `${discovery.title}`,
    description: discovery.description,
    keywords: [...discovery.tags, "interesting thing", discovery.title],
    openGraph: {
      type: "article",
      title: discovery.title,
      description: discovery.description,
      images: [{ url: discovery.imageUrl, width: 1200, height: 630, alt: discovery.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: discovery.title,
      description: discovery.description,
      images: [discovery.imageUrl],
    },
  };
}

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const discovery = await getDiscoveryBySlug(slug);

  if (!discovery) {
    notFound();
  }

  const category = categories.find((c) => c.id === discovery.categoryId);
  const related = (await getDiscoveriesByCategory(discovery.categoryId))
    .filter((d) => d.id !== discovery.id)
    .slice(0, 4);

  return (
    <article className="pb-24">
      {/* Hero Image Area */}
      <div className="relative w-full h-[50vh] min-h-[400px] bg-navy-deep">
        <Image
          src={discovery.imageUrl}
          alt={discovery.title}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-8 left-6 lg:left-8">
          <Link href="/discover" className="inline-flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium hover:bg-black/50 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Discover
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto -mt-32 relative z-10">
        <div className="bg-white dark:bg-navy-dark rounded-3xl shadow-xl border border-purple-light/20 p-8 sm:p-12">
          {category && (
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white shadow-sm ${category.color} mb-6`}>
              <CategoryIcon name={category.icon} className="h-4 w-4" /> {category.name}
            </div>
          )}
          
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-navy-dark dark:text-white mb-6">
            {discovery.title}
          </h1>
          
          <p className="text-xl text-gray-text leading-relaxed font-medium mb-8">
            {discovery.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 border-y border-purple-light/20 py-6 mb-8">
            <a href={discovery.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-bright transition-colors shadow-sm">
              Visit Website <ExternalLink className="h-4 w-4" />
            </a>
            <button className="inline-flex items-center gap-2 bg-purple-light text-purple px-6 py-3 rounded-full font-semibold hover:bg-purple-light/80 transition-colors shadow-sm">
              <Heart className="h-4 w-4" /> Save ({discovery.saves})
            </button>
            <button className="inline-flex items-center gap-2 bg-gray-100 dark:bg-navy-deep text-navy-dark dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-navy-deep/80 transition-colors shadow-sm">
              <Share className="h-4 w-4" /> Share
            </button>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h3 className="font-heading text-2xl font-semibold mb-4 text-navy-dark dark:text-white">Why We Picked This</h3>
            <p className="text-gray-text leading-relaxed">
              {discovery.content}
            </p>
          </div>
          
          <div className="mt-12 flex flex-wrap gap-2">
            {discovery.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-navy-deep text-gray-text text-sm rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="px-6 lg:px-8 max-w-7xl mx-auto mt-24">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-navy-dark dark:text-white mb-8">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(r => (
              <DiscoveryCard key={r.id} discovery={r} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
