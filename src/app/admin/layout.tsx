import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserAction();
  if (user?.id !== "akash") {
    redirect("/");
  }
  return <>{children}</>;
}
