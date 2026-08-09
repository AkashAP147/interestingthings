import Link from "next/link";
import { Globe, MessageCircle, Code2, Mail } from "lucide-react";
import { CopyEmailButton } from "@/components/CopyEmailButton";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-navy-dark border-t border-purple-light/20 mt-auto">
      <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-purple text-white p-2 rounded-xl">
                <Globe className="h-6 w-6" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-navy-dark dark:text-white">
                TIMIT.
              </span>
            </Link>
            <p className="text-sm leading-6 text-gray-text dark:text-gray-text">
              Discover. Be Amazed. Stay Curious. Every day, discover 5 things you didn't know existed.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-text hover:text-purple transition-colors">
                <span className="sr-only">Social</span>
                <MessageCircle className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-text hover:text-purple transition-colors">
                <span className="sr-only">Code</span>
                <Code2 className="h-6 w-6" />
              </a>
              <CopyEmailButton 
                email="akashscience147@gmail.com" 
                className="text-gray-text hover:text-purple transition-colors" 
              />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-navy-dark dark:text-white">Discover</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/discover" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">All Discoveries</Link>
                  </li>
                  <li>
                    <Link href="/trending" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Trending</Link>
                  </li>
                  <li>
                    <Link href="/random" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Surprise Me</Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-navy-dark dark:text-white">Categories</h3>
                <ul className="mt-6 space-y-4">
                  <li>
                    <Link href="/categories/weird-websites" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Weird Websites</Link>
                  </li>
                  <li>
                    <Link href="/categories/crazy-inventions" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Crazy Inventions</Link>
                  </li>
                  <li>
                    <Link href="/categories/interesting-datasets" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Interesting Datasets</Link>
                  </li>
                  <li>
                    <Link href="/categories" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors font-medium">View all &rarr;</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-navy-dark dark:text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/about" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">About</Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Contact</Link>
                  </li>
                  <li>
                    <Link href="/submit" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Submit a Discovery</Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-navy-dark dark:text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-gray-text hover:text-purple transition-colors">Terms of Service</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-purple-light/20 pt-8 sm:mt-20 lg:mt-24 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs leading-5 text-gray-text">
            &copy; {new Date().getFullYear()} The Internet's Most Interesting Things. All rights reserved.
          </p>
          <div className="flex items-center text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            Powered by&nbsp;<span className="text-[#F5A623]">Akash Patil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
