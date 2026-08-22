import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getHomeFeedAction, getSavedPostIdsAction } from "@/app/actions";
import { HomeFeed } from "@/components/HomeFeed";

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;

  if (!userId) {
    redirect("/");
  }

  const { success, posts, error } = await getHomeFeedAction();
  const { savedIds } = await getSavedPostIdsAction();

  if (!success) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-navy-dark dark:text-white">Failed to load feed</h1>
        <p className="text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-deep pt-24 pb-24">
      <div className="max-w-xl mx-auto px-4 sm:px-0">
        <h1 className="text-2xl font-heading font-bold text-navy-dark dark:text-white mb-6">Home Feed</h1>
        <HomeFeed initialPosts={posts || []} initialSavedIds={savedIds || []} />
      </div>
    </div>
  );
}
