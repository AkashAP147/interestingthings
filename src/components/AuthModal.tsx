"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { requestAuthAction, verifyAuthAction } from "@/app/actions";

export function AuthModal() {
  const { isModalOpen, closeModal, refreshUser } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await requestAuthAction(contact);
      if (res.success && res.userId) {
        setPendingUserId(res.userId);
        setStep(2);
      } else {
        setError("Something went wrong");
      }
    } catch (err) {
      setError("Failed to request code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !pendingUserId) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await verifyAuthAction(pendingUserId, code);
      if (res.success) {
        await refreshUser();
        closeModal();
        // Reset state
        setTimeout(() => {
          setStep(1);
          setContact("");
          setCode("");
          setPendingUserId("");
        }, 500);
      } else {
        setError(res.error || "Invalid code");
      }
    } catch (err) {
      setError("Failed to verify code");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-navy-deep w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-light/20 overflow-hidden"
        >
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-text hover:text-navy-dark dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto bg-purple-light/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-purple">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">
              {step === 1 ? "Join the Curated" : "Verify It's You"}
            </h2>
            <p className="text-gray-text mt-2 text-sm">
              {step === 1 
                ? "Discover 5 amazing things every single day. No spam, just pure internet gold."
                : "Enter the code we just sent you (Psst... use 1234 for the demo!)"
              }
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequest} 
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="sr-only">Email or Phone</label>
                  <input 
                    type="text" 
                    placeholder="Email or Phone number" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
                  />
                </div>
                {error && <p className="text-pink text-sm text-center">{error}</p>}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-purple text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerify} 
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="sr-only">Verification Code</label>
                  <input 
                    type="text" 
                    placeholder="Enter code (1234)" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white text-center tracking-[0.5em] font-bold text-lg"
                  />
                </div>
                {error && <p className="text-pink text-sm text-center">{error}</p>}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-green text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green/90 transition-colors shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Login"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
