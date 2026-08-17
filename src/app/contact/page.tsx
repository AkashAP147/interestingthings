import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the team behind The Internet's Most Interesting Things.",
};

export default function ContactPage() {
  redirect("/search");
}
