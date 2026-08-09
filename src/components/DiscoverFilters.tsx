"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { categories } from "@/lib/categories";
import { useCallback, useState, useEffect } from "react";

export function DiscoverFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync local input with URL if URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("q", searchInput);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-gray-text" />
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-navy-dark shadow-sm ring-1 ring-inset ring-purple-light placeholder:text-gray-text focus:ring-2 focus:ring-inset focus:ring-purple sm:text-lg sm:leading-6 dark:bg-navy-dark dark:text-white"
          placeholder="Search websites, inventions, products, datasets..."
        />
        <button type="submit" className="hidden">Search</button>
      </form>

      {/* Category Filters */}
      <div className="flex overflow-x-auto md:flex-wrap gap-2 mt-4 pb-2 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar">
        <button 
          onClick={() => updateParams("category", "all")}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
            currentCategory === "all" 
              ? "bg-navy-dark dark:bg-white text-white dark:text-navy-dark" 
              : "bg-white dark:bg-navy-deep text-gray-text ring-1 ring-inset ring-purple-light hover:bg-purple-light/50"
          }`}
        >
          All
        </button>
        {categories.map(c => (
          <button 
            key={c.id} 
            onClick={() => updateParams("category", c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
              currentCategory === c.id 
                ? "bg-navy-dark dark:bg-white text-white dark:text-navy-dark" 
                : "bg-white dark:bg-navy-deep text-gray-text ring-1 ring-inset ring-purple-light hover:bg-purple-light/50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      
      {/* Sorting */}
      <div className="flex items-center gap-4 mt-2 border-b border-purple-light/50 pb-4 text-sm font-medium text-gray-text overflow-x-auto hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
        <span className="shrink-0">Sort by:</span>
        <button 
          onClick={() => updateParams("sort", "newest")}
          className={`shrink-0 transition-colors ${currentSort === "newest" ? "text-purple font-bold" : "hover:text-purple"}`}
        >
          Newest
        </button>
        <button 
          onClick={() => updateParams("sort", "popular")}
          className={`shrink-0 transition-colors ${currentSort === "popular" ? "text-purple font-bold" : "hover:text-purple"}`}
        >
          Most Popular
        </button>
        <button 
          onClick={() => updateParams("sort", "saved")}
          className={`shrink-0 transition-colors ${currentSort === "saved" ? "text-purple font-bold" : "hover:text-purple"}`}
        >
          Most Saved
        </button>
        <button 
          onClick={() => updateParams("sort", "trending")}
          className={`shrink-0 transition-colors ${currentSort === "trending" ? "text-purple font-bold" : "hover:text-purple"}`}
        >
          Trending
        </button>
      </div>
    </div>
  );
}
