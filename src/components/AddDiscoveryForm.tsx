"use client";

import { useState } from "react";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { manualAddDiscoveryAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categories } from "@/lib/categories";

export function AddDiscoveryForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await manualAddDiscoveryAction(formData);
      if (res.success) {
        router.push("/admin");
      } else {
        setError(res.error || "Failed to add discovery");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-deep p-8 rounded-2xl shadow-sm border border-purple-light/20 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-navy-dark rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-text" />
        </Link>
        <h2 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">
          Add New Discovery
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">Title</label>
          <input 
            name="title"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            placeholder="e.g. A fascinating article about black holes"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">URL (Link)</label>
          <input 
            name="url"
            type="url"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">Category</label>
          <select 
            name="categoryId"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
          >
            <option value="">Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">Description / Why it's interesting</label>
          <textarea 
            name="description"
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white resize-none"
            placeholder="Explain why this deserves to be on the front page..."
          />
        </div>

        {error && <p className="text-pink text-sm">{error}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-purple text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Publish Discovery
        </button>
      </form>
    </div>
  );
}
