import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflineFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="w-24 h-24 bg-purple/10 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-purple" />
      </div>
      <h1 className="text-2xl font-bold text-navy-dark dark:text-white mb-2">
        You are offline
      </h1>
      <p className="text-gray-500 max-w-sm mb-8">
        It looks like you've lost your internet connection. We couldn't load this page from the cache.
      </p>
      <Link 
        href="/"
        className="bg-purple text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-purple-light transition-colors"
      >
        Go to Home
      </Link>
    </div>
  );
}
