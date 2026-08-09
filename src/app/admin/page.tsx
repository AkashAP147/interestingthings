import { Plus, Edit2, Trash2, CheckCircle2, Bot } from "lucide-react";
import { getPendingDiscoveries, readDB } from "@/lib/db";
import { AdminQueue } from "@/components/AdminQueue";
import { AdminTable } from "@/components/AdminTable";

export default async function AdminPage() {
  const pending = await getPendingDiscoveries();
  const allData = await readDB();
  const allPublished = allData.filter(d => d.status === "published");
  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-12 flex flex-col gap-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-purple-light/20 pb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-text mt-2">Manage discoveries, categories, and the daily edition.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-bright transition-colors shadow-sm">
          <Plus className="h-5 w-5" /> Add Discovery
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Daily Selection */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-navy-deep p-6 rounded-2xl shadow-sm border border-purple-light/20">
            <h2 className="font-heading text-xl font-bold text-navy-dark dark:text-white flex items-center gap-2 mb-6">
              Today's 5 Discoveries
            </h2>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-dark rounded-xl border border-purple-light/30">
                  <div className="flex items-center gap-3">
                    <span className="text-purple-bright font-bold">{num}.</span>
                    <span className="text-sm font-medium text-navy-dark dark:text-white truncate max-w-[150px]">
                      Selected Discovery {num}
                    </span>
                  </div>
                  <button className="text-gray-text hover:text-pink transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 bg-green text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green/90 transition-colors shadow-sm">
              <CheckCircle2 className="h-5 w-5" /> Publish Today's Edition
            </button>
          </div>
        </div>

        {/* Right Column - AI Approval Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
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
