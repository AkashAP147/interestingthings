"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export function AuthModal() {
  const { isModalOpen, closeModal, refreshUser } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !password) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, contact, password);
      } else {
        await signInWithEmailAndPassword(auth, contact, password);
      }
      
      closeModal();
      setTimeout(() => {
        setContact("");
        setPassword("");
        setIsSignUp(false);
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "An error occurred during authentication.");
      }
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
              {isSignUp ? "Join the Curated" : "Welcome Back"}
            </h2>
            <p className="text-gray-text mt-2 text-sm">
              {isSignUp 
                ? "Discover 5 amazing things every single day. No spam, just pure internet gold."
                : "Log in to save your favorite discoveries and see what's new."
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="sr-only">Email</label>
              <input 
                type="email" 
                placeholder="Email address" 
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
              />
            </div>
            {error && <p className="text-pink text-sm text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-purple text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-70 mt-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isSignUp ? "Create Account" : "Log In"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }} 
              className="text-purple font-semibold hover:underline"
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
