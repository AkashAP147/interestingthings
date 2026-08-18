"use client";

import { useState, useEffect } from "react";
import { Search, User as UserIcon, Loader2, Clock, X } from "lucide-react";
import { searchUsersAction } from "@/app/actions";
import Link from "next/link";

export function UserSearchClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    const history = localStorage.getItem("timit_search_history");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch(e) {}
    }
  }, []);

  const saveToHistory = (user: any) => {
    const newHistory = [user, ...searchHistory.filter(h => h.id !== user.id)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("timit_search_history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("timit_search_history");
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const res = await searchUsersAction(searchQuery);
        if (res.success) {
          setSearchResults(res.users || []);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-2xl border-0 py-4 pl-12 pr-12 text-navy-dark dark:text-white shadow-lg ring-1 ring-inset ring-purple-light/20 bg-white dark:bg-navy-deep focus:ring-2 focus:ring-inset focus:ring-purple sm:text-lg sm:leading-6 transition-all outline-none"
          placeholder="Search users..."
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 text-purple animate-spin" />
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {searchQuery.length === 0 && searchHistory.length > 0 && (
        <div className="mt-4 bg-white dark:bg-navy-deep rounded-2xl border border-purple-light/20 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-purple-light/10 bg-purple-light/5">
            <h3 className="font-semibold text-navy-dark dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple" />
              Recent Searches
            </h3>
            <button 
              onClick={clearHistory}
              className="text-xs font-bold text-gray-text hover:text-pink transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="divide-y divide-purple-light/10">
            {searchHistory.map(historyUser => (
              <div key={historyUser.id} className="flex items-center justify-between p-2 hover:bg-purple-light/5 transition-colors group">
                <Link 
                  href={`/profile/${historyUser.username || historyUser.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-light to-blue overflow-hidden shrink-0 flex items-center justify-center text-white">
                    {historyUser.profilePicture ? (
                      <img src={historyUser.profilePicture} alt={historyUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-navy-dark dark:text-white text-sm flex items-center gap-1">
                      {historyUser.name || historyUser.username}
                    </div>
                    {historyUser.username && <div className="text-xs text-gray-text">@{historyUser.username}</div>}
                  </div>
                </Link>
                <button 
                  className="p-2 text-gray-text hover:text-pink opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newHistory = searchHistory.filter(h => h.id !== historyUser.id);
                    setSearchHistory(newHistory);
                    localStorage.setItem("timit_search_history", JSON.stringify(newHistory));
                  }}
                  title="Remove from history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="mt-4 p-6 bg-white dark:bg-navy-deep rounded-2xl border border-purple-light/10 text-center text-gray-text shadow-md">
          No users found matching "{searchQuery}"
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="mt-4 bg-white dark:bg-navy-deep rounded-2xl border border-purple-light/20 shadow-xl overflow-hidden divide-y divide-purple-light/10">
          {searchResults.map(resultUser => (
            <Link 
              key={resultUser.id} 
              href={`/profile/${resultUser.username || resultUser.id}`}
              onClick={() => saveToHistory(resultUser)}
              className="flex items-center gap-4 p-4 hover:bg-purple-light/5 transition-colors"
            >
              <div className="h-12 w-12 rounded-full border-2 border-white dark:border-navy-dark bg-gradient-to-br from-purple-light to-blue overflow-hidden relative shrink-0 flex items-center justify-center text-white">
                {resultUser.profilePicture ? (
                  <img src={resultUser.profilePicture} alt={resultUser.username} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="font-bold text-navy-dark dark:text-white flex items-center gap-1">
                  {resultUser.name || resultUser.username}
                  {resultUser.verified && (
                    <span className="bg-blue/10 text-blue p-0.5 rounded-full" title="Verified">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.441A1.5 1.5 0 017.5 3h5a1.5 1.5 0 011.233.441l2.842 2.842A1.5 1.5 0 0117 7.5v5a1.5 1.5 0 01-.441 1.233l-2.842 2.842A1.5 1.5 0 0112.5 17h-5a1.5 1.5 0 01-1.233-.441l-2.842-2.842A1.5 1.5 0 013 12.5v-5a1.5 1.5 0 01.441-1.233l2.842-2.842zM8.707 11.707a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L9.414 9.586 8.707 8.879a1 1 0 00-1.414 1.414l1.414 1.414z" clipRule="evenodd"></path></svg>
                    </span>
                  )}
                </div>
                {resultUser.username && <div className="text-sm text-purple">@{resultUser.username}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
