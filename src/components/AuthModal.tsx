"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { setUsernameAction, resolveUsernameToEmailAction } from "@/app/actions";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { isModalOpen, modalMode, closeModal, refreshUser } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(modalMode === "signup");
  const [step, setStep] = useState<1 | 2>(1);
  const [usernameInput, setUsernameInput] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync isSignUp when modalMode changes
  useEffect(() => {
    setIsSignUp(modalMode === "signup");
    setStep(1);
    setError("");
  }, [modalMode, isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !password) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      if (step === 2) {
        const res = await setUsernameAction(usernameInput);
        if (!res.success) {
          setError(res.error || "Failed to set username.");
          setIsSubmitting(false);
          return;
        }
        closeModal();
        window.location.href = "/profile";
        return;
      }

      let emailToUse = contact.trim().toLowerCase();
      // If it's a username (doesn't contain an @)
      if (!emailToUse.includes("@")) {
        if (isSignUp) {
          setError("Please enter a valid email address to sign up.");
          setIsSubmitting(false);
          return;
        }
        
        // Resolve the username to their real email address
        const resolvedEmail = await resolveUsernameToEmailAction(emailToUse);
        if (resolvedEmail) {
          emailToUse = resolvedEmail;
        } else {
          // Fallback to legacy dummy email if not found (for old test accounts)
          emailToUse = `${emailToUse.replace(/^@/, '')}@timit.app`;
        }
      }

      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}`.trim() });
        // Force token refresh so the auth state listener gets the updated token with 'name'
        const token = await userCredential.user.getIdToken(true);
        
        // Manually sync the token right away to prevent race conditions before Step 2
        const { syncAuthTokenAction } = await import("@/app/actions");
        const syncRes = await syncAuthTokenAction(token);
        if (!syncRes.success) {
          throw new Error(syncRes.error || "Failed to sync authentication token.");
        }

        setStep(2);
        setIsSubmitting(false);
        return;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        
        // Ensure the server cookie is set before reloading
        const token = await userCredential.user.getIdToken(true);
        const { syncAuthTokenAction } = await import("@/app/actions");
        const syncRes = await syncAuthTokenAction(token);
        if (!syncRes.success) {
          throw new Error(syncRes.error || "Failed to sync authentication token on the server.");
        }
        
        window.location.reload();
      }
      
      closeModal();
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

  const handleForgotPassword = async () => {
    if (!contact) {
      setError("Please enter your email address first.");
      return;
    }
    
    const emailToUse = contact.trim().toLowerCase();
    if (!emailToUse.includes("@")) {
      setError("Password resets are only available if you signed up with a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await sendPasswordResetEmail(auth, emailToUse);
      setError("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Failed to send reset email. Please try again.");
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

          {step === 2 ? (
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto bg-purple-light/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-purple">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">
                Claim Your Username
              </h2>
              <p className="text-gray-text mt-2 text-sm">
                This is how other users will see you.
              </p>
            </div>
          ) : (
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
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 2 ? (
              <div>
                <label className="sr-only">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                  <input 
                    type="text" 
                    placeholder="coolperson123" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <>
                {isSignUp && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="sr-only">First Name</label>
                      <input 
                        type="text" 
                        placeholder="First Name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="sr-only">Surname</label>
                      <input 
                        type="text" 
                        placeholder="Surname" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="sr-only">{isSignUp ? "Email Address" : "Username or Email"}</label>
                  <input 
                    type={isSignUp ? "email" : "text"} 
                    placeholder={isSignUp ? "Email Address" : "Username or Email"} 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
                  />
                </div>
                <div className="relative">
                  <label className="sr-only">Password</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-purple transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </>
            )}
            {error && <p className={cn("text-sm text-center", error.includes("sent") ? "text-green-500" : "text-pink")}>{error}</p>}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-purple text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-bright transition-colors shadow-md disabled:opacity-70 mt-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{step === 2 ? "Finish Setup" : (isSignUp ? "Create Account" : "Log In")} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {!isSignUp && step === 1 && (
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-text hover:text-purple transition-colors hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {step === 1 && (
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
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
