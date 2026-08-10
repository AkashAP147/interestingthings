"use client";

import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { adminLoginAction } from "@/app/actions";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();

  if (!isOpen) {
    if (children) {
      return (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block w-full h-full">
          {children}
        </div>
      );
    }
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-20 flex items-center justify-center w-full max-w-sm mx-auto py-4 text-gray-text hover:text-purple transition-colors"
      >
        <Lock className="h-4 w-4 mr-2" /> Admin Access
      </button>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await adminLoginAction(id, pass);
      if (res.success) {
        await refreshUser();
        router.push("/admin");
      } else {
        setError(res.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children && (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block w-full h-full">
          {children}
        </div>
      )}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-navy-deep p-6 rounded-3xl border border-purple-light/20 w-full max-w-sm shadow-2xl relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-navy-dark dark:text-white flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-purple" /> Admin Login
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-text hover:text-pink text-sm font-semibold">Cancel</button>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Admin ID" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
            {error && <p className="text-pink text-sm text-center">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="mt-2 bg-navy-dark text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-navy-dark/90 transition-colors shadow-sm disabled:opacity-70 dark:bg-purple"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Access"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
