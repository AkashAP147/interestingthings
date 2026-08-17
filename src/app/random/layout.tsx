import { getCurrentUserAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function RandomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/");
  }

  return <>{children}</>;
}
