export const dynamic = "force-dynamic";

import { Plus, CheckCircle2, Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminMessages } from "@/components/AdminMessages";
import { getPendingDiscoveries, readDB, getContactMessages } from "@/lib/db";
import { AdminQueue } from "@/components/AdminQueue";
import { AdminTable } from "@/components/AdminTable";
import { RunScraperButton } from "@/components/RunScraperButton";

export default async function AdminPage() {
  const pending = await getPendingDiscoveries();
  const allData = await readDB();
  const messages = await getContactMessages();
  const allPublished = allData.filter(d => d.status === "published");
  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-purple-light/20 pb-8">
        <div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-purple hover:text-purple-bright font-semibold mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-text mt-2">Manage discoveries, categories, and the daily edition.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <RunScraperButton />
          <Link href="/admin/add" className="inline-flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-bright transition-colors shadow-sm">
            <Plus className="h-5 w-5" /> Add Discovery
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8">

        {/* Notifications / Inbox */}
        <AdminMessages initialMessages={messages} />

        {/* AI Approval Queue */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-xl font-bold text-navy-dark dark:text-white flex items-center gap-2">
              <Bot className="h-6 w-6 text-purple" /> AI Discovery Queue
            </h2>
            <span className="bg-pink/10 text-pink px-3 py-1 rounded-full text-sm font-bold">
              {pending.length} Pending
            </span>
          </div>
          
          <AdminQueue initialPending={pending} />

          {/* Manage All Discoveries */}
          <div className="mt-8 bg-white dark:bg-navy-deep p-6 rounded-2xl shadow-sm border border-purple-light/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-navy-dark dark:text-white">
                All Discoveries
              </h2>
            </div>
            <AdminTable initialDiscoveries={allPublished} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
