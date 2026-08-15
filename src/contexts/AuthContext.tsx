"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUserAction, syncAuthTokenAction } from "@/app/actions";
import { User } from "@/lib/user-db";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const u = await getCurrentUserAction();
      setUser(u);
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          await syncAuthTokenAction(token);
          await refreshUser();
        } else {
          await syncAuthTokenAction(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth sync error", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const logout = async () => {
    await signOut(auth);
    // syncAuthTokenAction(null) will be called by the listener
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isModalOpen, openModal, closeModal, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
