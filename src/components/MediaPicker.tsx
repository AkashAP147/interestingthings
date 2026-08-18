"use client";

import { useState } from "react";
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { Smile, Search } from 'lucide-react';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY');

interface MediaPickerProps {
  onEmojiClick: (emojiData: any) => void;
  onGifClick: (gifUrl: string) => void;
}

export function MediaPicker({ onEmojiClick, onGifClick }: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>('emoji');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGifs = (offset: number) => {
    if (searchQuery) {
      return gf.search(searchQuery, { offset, limit: 15 });
    }
    return gf.trending({ offset, limit: 15 });
  };

  return (
    <div className="w-[350px] bg-white dark:bg-navy-deep rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-purple-light/20" style={{ height: '400px' }}>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'emoji' && (
          <div className="absolute inset-0">
            <EmojiPicker 
              onEmojiClick={onEmojiClick}
              theme={'auto' as any}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
            />
          </div>
        )}
        
        {activeTab === 'gif' && (
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-navy-deep">
            <div className="p-2 border-b border-gray-100 dark:border-navy-dark">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search GIFs via GIPHY"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-navy-dark rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none dark:text-white border border-purple-light/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1 scrollbar-hide bg-gray-50 dark:bg-navy-dark">
              <Grid 
                width={340} 
                columns={3} 
                gutter={4}
                fetchGifs={fetchGifs} 
                key={searchQuery} 
                onGifClick={(gif, e) => {
                  e.preventDefault();
                  onGifClick(gif.images.downsized_medium.url || gif.images.original.url);
                }}
                noLink
                hideAttribution
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50 dark:bg-navy-dark p-1 border-t border-purple-light/10">
        <button 
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 py-2 flex items-center justify-center rounded-xl transition-colors ${activeTab === 'emoji' ? 'bg-white dark:bg-navy-deep shadow-sm text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}
        >
          <Smile className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab('gif')}
          className={`flex-1 py-2 flex items-center justify-center rounded-xl transition-colors ${activeTab === 'gif' ? 'bg-white dark:bg-navy-deep shadow-sm text-purple' : 'text-gray-text hover:text-navy-dark dark:hover:text-white'}`}
        >
          <span className="font-bold text-xs">GIF</span>
        </button>
      </div>
    </div>
  );
}
