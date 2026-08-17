import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending Discoveries",
  description: "See what the community is loving right now on The Internet's Most Interesting Things.",
};

export default async function TrendingPage() {
  redirect("/search");
}
