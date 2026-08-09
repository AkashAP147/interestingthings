"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUserAction, logoutAction } from "@/app/actions";
import { User } from "@/lib/user-db";

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
    refreshUser();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const logout = async () => {
    await logoutAction();
    setUser(null);
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
