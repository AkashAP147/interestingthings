"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ChevronDown, Filter } from "lucide-react";
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

      {/* Filters & Sorting Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2 border-b border-purple-light/20 pb-6">
        {/* Category Dropdown */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-purple" />
          </div>
          <select 
            value={currentCategory}
            onChange={(e) => updateParams("category", e.target.value)}
            className="w-full appearance-none bg-white dark:bg-navy-deep text-navy-dark dark:text-white text-sm font-semibold rounded-xl border border-purple-light/50 py-2.5 pl-10 pr-10 shadow-sm focus:ring-2 focus:ring-purple focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-text">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 sm:max-w-xs">
          <select 
            value={currentSort}
            onChange={(e) => updateParams("sort", e.target.value)}
            className="w-full appearance-none bg-white dark:bg-navy-deep text-navy-dark dark:text-white text-sm font-semibold rounded-xl border border-purple-light/50 py-2.5 pl-4 pr-10 shadow-sm focus:ring-2 focus:ring-purple focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="popular">Sort by: Popular</option>
            <option value="saved">Sort by: Most Saved</option>
            <option value="trending">Sort by: Trending</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-text">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
