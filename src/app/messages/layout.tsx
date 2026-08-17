import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-navy-deep rounded-3xl border border-purple-light/20 shadow-lg h-full overflow-hidden flex">
        {children}
      </div>
    </div>
  );
}
