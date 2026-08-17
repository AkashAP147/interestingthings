import { getUserByIdentifier } from "@/lib/user-db";
import { getCurrentUserAction } from "@/app/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { User as UserIcon, Calendar, Activity, Star } from "lucide-react";
import FollowButton from "@/components/profile/FollowButton";
import Link from "next/link";

export async function generateMetadata(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const targetUser = await getUserByIdentifier(params.username);
  
  if (!targetUser) return { title: "User Not Found - TIMIT" };
  
  const displayName = targetUser.name || targetUser.username || "User";
  return {
    title: `${displayName} (@${targetUser.username}) - TIMIT`,
    description: `Check out ${displayName}'s profile on The Internet's Most Interesting Things.`,
  };
}

export default async function PublicProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const username = params.username.toLowerCase();
  
  const targetUser = await getUserByIdentifier(username);
  if (!targetUser) notFound();

  const currentUser = await getCurrentUserAction();
  
  const isOwnProfile = currentUser?.id === targetUser.id;
  const isFollowing = currentUser?.following?.includes(targetUser.id) || false;
  
  const followerCount = targetUser.followers?.length || 0;
  const followingCount = targetUser.following?.length || 0;
  const joinDate = new Date(targetUser.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-navy-dark rounded-3xl shadow-xl overflow-hidden border border-purple-light/10">
        
        {/* Cover Photo / Header Banner */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-purple-light to-blue relative">
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]"></div>
        </div>

        <div className="px-6 md:px-12 pb-12">
          {/* Profile Picture & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 mb-8 gap-4">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-navy-dark bg-gray-100 dark:bg-navy-deep overflow-hidden relative shrink-0 shadow-lg flex items-center justify-center text-gray-400 z-10">
              {targetUser.profilePicture ? (
                <Image src={targetUser.profilePicture} alt={targetUser.username || "Profile"} fill className="object-cover" sizes="160px" />
              ) : (
                <UserIcon className="h-16 w-16" />
              )}
            </div>
            
            <div className="flex items-center gap-3 md:pb-4 z-10">
              {isOwnProfile ? (
                <Link 
                  href="/profile" 
                  className="px-6 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center bg-gray-100 text-navy-dark dark:bg-navy-deep dark:text-white hover:bg-gray-200 border border-gray-200 dark:border-purple-light/20"
                >
                  Edit Profile
                </Link>
              ) : currentUser ? (
                <FollowButton targetUserId={targetUser.id} initialIsFollowing={isFollowing} />
              ) : (
                <Link 
                  href={`/login?redirect=/profile/${username}`}
                  className="px-6 py-2.5 rounded-full font-semibold bg-purple text-white hover:bg-purple-bright transition-colors shadow-lg"
                >
                  Follow
                </Link>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-navy-dark dark:text-white flex items-center gap-2">
              {targetUser.name || targetUser.username || "Unknown User"}
              {targetUser.verified && (
                <span className="bg-blue/10 text-blue p-1 rounded-full" title="Verified">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.441A1.5 1.5 0 017.5 3h5a1.5 1.5 0 011.233.441l2.842 2.842A1.5 1.5 0 0117 7.5v5a1.5 1.5 0 01-.441 1.233l-2.842 2.842A1.5 1.5 0 0112.5 17h-5a1.5 1.5 0 01-1.233-.441l-2.842-2.842A1.5 1.5 0 013 12.5v-5a1.5 1.5 0 01.441-1.233l2.842-2.842zM8.707 11.707a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L9.414 9.586 8.707 8.879a1 1 0 00-1.414 1.414l1.414 1.414z" clipRule="evenodd"></path></svg>
                </span>
              )}
            </h1>
            {targetUser.username && (
              <p className="text-purple font-medium text-lg">@{targetUser.username}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 mt-4 text-gray-text text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {joinDate}
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                {targetUser.streakCount || 0} Day Streak
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-navy-deep rounded-2xl border border-purple-light/10">
            <div className="text-center">
              <p className="text-gray-text text-sm font-medium mb-1">Followers</p>
              <p className="text-2xl font-bold text-navy-dark dark:text-white">{followerCount}</p>
            </div>
            <div className="text-center border-l border-purple-light/10">
              <p className="text-gray-text text-sm font-medium mb-1">Following</p>
              <p className="text-2xl font-bold text-navy-dark dark:text-white">{followingCount}</p>
            </div>
            <div className="text-center border-l border-purple-light/10">
              <p className="text-gray-text text-sm font-medium mb-1">Curiosity Points</p>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-400">
                <Star className="w-5 h-5 fill-current" />
                {targetUser.curiosityPoints || 0}
              </div>
            </div>
            <div className="text-center border-l border-purple-light/10">
              <p className="text-gray-text text-sm font-medium mb-1">Saved Posts</p>
              <p className="text-2xl font-bold text-navy-dark dark:text-white">{targetUser.likes?.length || 0}</p>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-text py-12 border-2 border-dashed border-purple-light/20 rounded-2xl">
            <p className="text-lg">Recent activity is private.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
