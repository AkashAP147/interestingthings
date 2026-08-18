"use client";

import { useState } from "react";
import { X, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type ConnectionUser = {
  id: string;
  username?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

interface ProfileStatsModalProps {
  followers: ConnectionUser[];
  following: ConnectionUser[];
  friends: ConnectionUser[];
  followerCount: number;
  followingCount: number;
  compact?: boolean;
}

export default function ProfileStatsModal({
  followers,
  following,
  friends,
  followerCount,
  followingCount,
  compact = false
}: ProfileStatsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "friends">("followers");

  const openModal = (tab: "followers" | "following" | "friends") => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const activeList = activeTab === "followers" ? followers : activeTab === "following" ? following : friends;

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-6 text-sm mt-4">
          <button onClick={() => openModal("followers")} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-navy-dark dark:text-white">{followerCount}</span>
            <span className="text-gray-text font-medium">Followers</span>
          </button>
          <button onClick={() => openModal("following")} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-navy-dark dark:text-white">{followingCount}</span>
            <span className="text-gray-text font-medium">Following</span>
          </button>
          <button onClick={() => openModal("friends")} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-navy-dark dark:text-white">{friends.length}</span>
            <span className="text-pink font-medium">Friends</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-navy-deep rounded-2xl border border-purple-light/10">
          <button onClick={() => openModal("followers")} className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-dark p-2 rounded-xl transition-colors">
            <p className="text-gray-text text-sm font-medium mb-1">Followers</p>
            <p className="text-2xl font-bold text-navy-dark dark:text-white">{followerCount}</p>
          </button>
          <button onClick={() => openModal("following")} className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-dark p-2 rounded-xl transition-colors border-l border-r border-gray-200 dark:border-navy-dark">
            <p className="text-gray-text text-sm font-medium mb-1">Following</p>
            <p className="text-2xl font-bold text-navy-dark dark:text-white">{followingCount}</p>
          </button>
          <button onClick={() => openModal("friends")} className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-dark p-2 rounded-xl transition-colors">
            <p className="text-pink text-sm font-medium mb-1">Friends</p>
            <p className="text-2xl font-bold text-navy-dark dark:text-white">{friends.length}</p>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-deep w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-dark">
              <h2 className="font-bold text-lg text-navy-dark dark:text-white capitalize">{activeTab}</h2>
              <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-navy-dark rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-text" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-navy-dark">
              {(["followers", "following", "friends"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab 
                      ? "text-purple border-b-2 border-purple" 
                      : "text-gray-text hover:text-navy-dark dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeList.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No {activeTab} yet.</p>
              ) : (
                activeList.map((u) => (
                  <Link href={`/profile/${u.username || u.id}`} key={u.id} onClick={closeModal}>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-dark transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white shrink-0 shadow-sm relative">
                          {u.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.profilePicture} alt={u.name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-navy-dark dark:text-white group-hover:text-purple transition-colors">
                            {u.name || u.username || "Unknown"}
                          </p>
                          {u.username && (
                            <p className="text-xs text-gray-text">@{u.username}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
