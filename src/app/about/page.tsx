import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission behind The Internet's Most Interesting Things and the team curating the web's best hidden gems.",
};

export default function AboutPage() {
  return <AboutClient />;
}
