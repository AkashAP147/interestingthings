"use client";

import { useState } from "react";
import { ContactMessage } from "@/lib/db";
import { markMessageReadAction } from "@/app/actions";
import { Mail, Check, Inbox } from "lucide-react";

function formatTimeAgo(dateString: string) {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function AdminMessages({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleMarkRead = async (id: string) => {
    setLoadingId(id);
    await markMessageReadAction(id);
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status: 'read' } : m));
    setLoadingId(null);
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (messages.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-deep p-8 rounded-2xl shadow-sm border border-purple-light/20 flex flex-col items-center justify-center text-center">
        <div className="bg-purple-light/10 p-4 rounded-full text-purple-bright mb-4">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="font-heading text-lg font-bold text-navy-dark dark:text-white">Inbox Zero!</h3>
        <p className="text-gray-text mt-2">No transmissions received yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-deep p-6 rounded-2xl shadow-sm border border-purple-light/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-navy-dark dark:text-white flex items-center gap-2">
          <Mail className="h-6 w-6 text-pink" /> 
          Inbox Notifications
        </h2>
        {unreadCount > 0 && (
          <span className="bg-pink text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            {unreadCount} New
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`p-5 rounded-xl border transition-all ${
              msg.status === 'unread' 
                ? 'bg-pink/5 border-pink/20 dark:border-pink/10 shadow-sm' 
                : 'bg-transparent border-purple-light/20 opacity-75'
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-navy-dark dark:text-white">{msg.name}</h3>
                  <a href={`mailto:${msg.email}`} className="text-sm font-semibold text-purple hover:underline">
                    {msg.email}
                  </a>
                  <span className="text-xs text-gray-text">
                    • {formatTimeAgo(msg.createdAt)} ago
                  </span>
                </div>
                <p className="text-navy-dark/80 dark:text-gray-300 whitespace-pre-wrap mt-2">{msg.message}</p>
              </div>
              
              {msg.status === 'unread' && (
                <button
                  onClick={() => handleMarkRead(msg.id)}
                  disabled={loadingId === msg.id}
                  className="shrink-0 flex items-center gap-2 bg-white dark:bg-navy-dark border border-purple-light/20 px-3 py-1.5 rounded-lg text-sm font-semibold text-navy-dark dark:text-white hover:bg-green/10 hover:text-green hover:border-green/20 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {loadingId === msg.id ? 'Marking...' : 'Mark Read'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
