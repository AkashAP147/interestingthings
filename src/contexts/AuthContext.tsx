"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUserAction, syncAuthTokenAction } from "@/app/actions";
import { User } from "@/lib/user-db";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { generateKeyPair, exportKey } from "@/lib/e2ee";
import { setPublicKeyAction } from "@/app/actions";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isModalOpen: boolean;
  modalMode: "login" | "signup";
  openModal: (mode?: "login" | "signup") => void;
  closeModal: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser = null }: { children: ReactNode, initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser); // If we have user, don't flash loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const u = await getCurrentUserAction();
      setUser(u);
      
      // E2EE Key Management
      if (u) {
        let privKey = localStorage.getItem(`privKey_${u.id}`);
        if (!privKey) {
          // If the user already has keys on the server, they are on a new device.
          // Do NOT overwrite their keys. They must recover via Profile Settings.
          if (!u.publicKey && !u.encryptedPrivateKey) {
            try {
              const keypair = await generateKeyPair();
              const privStr = await exportKey(keypair.privateKey);
              const pubStr = await exportKey(keypair.publicKey);
              localStorage.setItem(`privKey_${u.id}`, privStr);
              await setPublicKeyAction(pubStr);
            } catch(err) {
              console.error("Failed to generate E2EE keys", err);
            }
          }
        }
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

  const openModal = (mode: "login" | "signup" = "login") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const logout = async () => {
    await signOut(auth);
    // syncAuthTokenAction(null) will be called by the listener
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isModalOpen, modalMode, openModal, closeModal, refreshUser, logout }}>
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
