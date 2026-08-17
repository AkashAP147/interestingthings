import { categories } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function CategoriesIndexPage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/");
  }
  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
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
            href={`/categories/${category.slug}`}
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
  );
}
