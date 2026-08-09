import Link from "next/link";
import { Sparkles, Dice5, ArrowRight, TrendingUp } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getDailyDiscoveries, getTrendingDiscoveries } from "@/lib/data";
import { categories } from "@/lib/categories";
import { SubscribeButton } from "@/components/SubscribeButton";

export default async function Home() {
  const dailyDiscoveries = await getDailyDiscoveries();
  const trendingDiscoveries = await getTrendingDiscoveries();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 max-w-[1600px] mx-auto pt-24 pb-16 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-light via-background to-background opacity-70"></div>
        <h1 className="font-heading text-5xl font-bold tracking-tight text-navy-dark dark:text-white sm:text-7xl mb-6">
          The Internet Is Full of <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple to-blue">
            Things You’ve Never Seen.
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-text max-w-3xl mx-auto">
          We find the weirdest websites, strangest products, fascinating datasets, crazy inventions and beautiful corners of the internet — so you don't have to.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <SubscribeButton variant="primary" />
          <Link
            href="/random"
            className="w-full sm:w-auto rounded-full bg-white dark:bg-navy-deep px-8 py-3.5 text-base font-semibold text-navy-dark dark:text-white shadow-sm ring-1 ring-inset ring-purple-light hover:bg-purple-light/50 transition-colors flex items-center justify-center gap-2"
          >
            <Dice5 className="h-5 w-5 text-purple" /> Surprise Me
          </Link>
        </div>
      </section>

      {/* Daily 5 Section */}
      <section id="daily-5" className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-3xl font-bold text-navy-dark dark:text-white">Today's Edition</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {dailyDiscoveries.map((discovery, index) => (
            <div key={discovery.id}>
               <DiscoveryCard discovery={discovery} index={index} />
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-purple-light/10 dark:bg-navy-deep py-20 w-full mt-24">
        <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
          <h2 className="font-heading text-3xl font-bold text-navy-dark dark:text-white mb-12 text-center">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex flex-col items-start justify-between rounded-2xl p-6 shadow-sm ring-1 ring-purple-light bg-white dark:bg-navy-deep hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${category.color} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <CategoryIcon name={category.icon} className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-navy-dark dark:text-white group-hover:text-purple transition-colors">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm text-gray-text line-clamp-2">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-navy-dark text-white py-24">
        <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-pink" /> Trending Now
            </h2>
            <Link href="/trending" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-pink hover:text-white transition-colors">
              View all trending <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingDiscoveries.slice(0, 3).map((discovery, index) => (
              <Link key={discovery.id} href={`/discover/${discovery.slug}`} className="group relative flex flex-col gap-4">
                <div className="flex items-start gap-4 border-b border-white/10 pb-6">
                  <span className="font-heading text-4xl font-bold text-white/20 group-hover:text-pink transition-colors">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-semibold group-hover:text-blue transition-colors">
                      {discovery.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                      {discovery.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/trending" className="mt-8 flex sm:hidden items-center justify-center gap-1 text-sm font-semibold text-pink hover:text-white transition-colors w-full">
            View all trending <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section id="subscribe" className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full mb-12">
        <div className="bg-navy-dark rounded-3xl p-12 text-center relative overflow-hidden">
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get 5 Interesting Things Every Day
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-purple-light">
            One email. Five discoveries. Zero boredom.
          </p>
          <form className="mx-auto mt-10 flex max-w-md gap-x-4 flex-col sm:flex-row gap-y-4">
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="min-w-0 flex-auto rounded-full border-0 bg-white/10 px-6 py-3.5 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 placeholder:text-white/60"
              placeholder="Enter your email"
            />
            <button
              type="submit"
              className="flex-none rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-navy-dark shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors flex items-center justify-center gap-2"
            >
              Subscribe <Sparkles className="h-4 w-4 text-purple" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
