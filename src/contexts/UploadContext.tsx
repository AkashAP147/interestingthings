"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { uploadChunkAction, finalizeUploadAction, sendMessageAction } from "@/app/actions";
import { encryptPayload } from "@/lib/e2ee";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface UploadState {
  id: string;
  progress: number;
  status: "uploading" | "success" | "error";
  fileName: string;
}

interface UploadContextType {
  uploads: UploadState[];
  startUpload: (file: File, activeChatId: string, myPubKey: string | null, recipientPubKey: string | null) => Promise<void>;
  dismissUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const dismissUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const startUpload = async (file: File, activeChatId: string, myPubKey: string | null, recipientPubKey: string | null) => {
    const uploadId = `upload_${Date.now()}`;
    setUploads((prev) => [
      ...prev,
      { id: uploadId, progress: 0, status: "uploading", fileName: file.name },
    ]);

    try {
      const base64Media = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(base64Media.length / CHUNK_SIZE);
      const CONCURRENCY = 4;
      let chunksUploaded = 0;

      for (let i = 0; i < totalChunks; i += CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < CONCURRENCY && i + j < totalChunks; j++) {
          const chunkIndex = i + j;
          const chunk = base64Media.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);
          
          const uploadPromise = (async () => {
            let chunkSuccess = false;
            let attempts = 0;
            while (!chunkSuccess && attempts < 5) {
              try {
                const res = await uploadChunkAction(tempId, chunkIndex, chunk);
                if (res.error) throw new Error(res.error);
                chunkSuccess = true;
                chunksUploaded++;
                setUploads((prev) =>
                  prev.map((u) =>
                    u.id === uploadId
                      ? { ...u, progress: Math.round((chunksUploaded / totalChunks) * 100) }
                      : u
                  )
                );
              } catch (err) {
                attempts++;
                if (attempts >= 5) throw err;
                await new Promise((r) => setTimeout(r, 1500 * attempts));
              }
            }
          })();
          batch.push(uploadPromise);
        }
        await Promise.all(batch);
      }

      const finalRes = await finalizeUploadAction(tempId, totalChunks);
      if (finalRes.success && finalRes.base64Media) {
        
        let finalPayload = undefined;
        let finalImageUrl = finalRes.base64Media;

        if (recipientPubKey && myPubKey) {
          try {
            finalPayload = await encryptPayload("", finalRes.base64Media, [myPubKey, recipientPubKey]);
            finalImageUrl = ""; // Encrypted properly
          } catch(err) {
            console.error("Encryption failed in background", err);
          }
        }

        await sendMessageAction(activeChatId, "", finalImageUrl || undefined, finalPayload);
        
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: "success", progress: 100 } : u))
        );

        setTimeout(() => dismissUpload(uploadId), 3000);
      } else {
        throw new Error("Finalize failed");
      }
    } catch (err) {
      console.error("Background upload failed:", err);
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: "error" } : u))
      );
    }
  };

  return (
    <UploadContext.Provider value={{ uploads, startUpload, dismissUpload }}>
      {children}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {uploads.map((upload) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-navy-deep border border-purple-light/20 shadow-xl rounded-2xl p-4 w-72 pointer-events-auto flex flex-col gap-3 relative overflow-hidden"
            >
              {upload.status === "uploading" && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-purple transition-all duration-300 ease-out" 
                  style={{ width: `${upload.progress}%` }}
                />
              )}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {upload.status === "uploading" && <Loader2 className="w-5 h-5 text-purple animate-spin" />}
                  {upload.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {upload.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-dark dark:text-white truncate">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-gray-text">
                    {upload.status === "uploading" && `Uploading ${upload.progress}%`}
                    {upload.status === "success" && "Sent successfully"}
                    {upload.status === "error" && "Upload failed"}
                  </p>
                </div>
                {upload.status !== "uploading" && (
                  <button 
                    onClick={() => dismissUpload(upload.id)}
                    className="p-1 text-gray-text hover:text-navy-dark dark:hover:text-white transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUploads must be used within an UploadProvider");
  }
  return context;
}
