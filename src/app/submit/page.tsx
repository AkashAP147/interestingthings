import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Discovery - TIMIT",
  description: "Share the most interesting things you've found on the internet.",
};

export default function SubmitPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="bg-purple-light/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12">
        <Sparkles className="w-12 h-12 text-purple" />
      </div>
      <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-navy-dark dark:text-white">
        Submit a Discovery
      </h1>
      <p className="text-xl text-gray-text mb-12 max-w-2xl mx-auto">
        Found something weird, fascinating, or beautiful? We are building a new submission system so you can share it directly with the community.
      </p>
      
      <div className="bg-white dark:bg-navy-deep rounded-3xl shadow-xl p-8 max-w-xl mx-auto border border-purple-light/20">
        <div className="h-2 w-full bg-gradient-to-r from-purple-light to-blue rounded-full mb-8"></div>
        <h3 className="font-bold text-2xl mb-4 text-navy-dark dark:text-white">Under Construction 🚧</h3>
        <p className="text-gray-text mb-6">
          Our curation team currently reviews all items manually to ensure only the highest quality content makes it to the feed. The community submission portal will be opening in our next update!
        </p>
        <div className="p-4 bg-gray-50 dark:bg-navy-dark rounded-xl border border-dashed border-purple-light/30 text-sm font-medium text-purple">
          Check back soon!
        </div>
      </div>
    </div>
  );
}
