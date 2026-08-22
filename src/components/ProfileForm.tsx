"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfileAction, backupPrivateKeyAction, createLinkDeviceTokenAction } from "@/app/actions";
import { encryptPrivateKeyWithPassword, decryptPrivateKeyWithPassword } from "@/lib/e2ee";
import { Loader2, Camera, CheckCircle2, User, AtSign, Phone, Mail, Eye, X, Lock, Key } from "lucide-react";
import QRCode from "react-qr-code";
import { useSearchParams } from "next/navigation";

function E2EEManager({ user }: { user: any }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrPwd, setQrPwd] = useState("");
  const [qrUuid, setQrUuid] = useState("");
  const [qrError, setQrError] = useState("");

  const privKey = typeof window !== 'undefined' ? localStorage.getItem(`privKey_${user.id}`) : null;
  const hasLocalKey = !!privKey;
  const hasServerBackup = !!user.encryptedPrivateKey;

  const handleBackup = async () => {
    if (!password) return;
    setStatus("loading");
    try {
      const privKey = localStorage.getItem(`privKey_${user.id}`);
      if (!privKey) throw new Error("No local key to backup");
      
      const payload = await encryptPrivateKeyWithPassword(privKey, password);
      const res = await backupPrivateKeyAction(JSON.stringify(payload));
      
      if (res.success) {
        setStatus("success");
        setMsg("Key securely backed up to the server.");
        window.location.reload();
      } else {
        throw new Error("Failed to save to server");
      }
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message || "An error occurred");
    }
  };

  const handleRecover = async () => {
    if (!password) return;
    setStatus("loading");
    try {
      const payload = JSON.parse(user.encryptedPrivateKey);
      const decrypted = await decryptPrivateKeyWithPassword(payload, password);
      if (decrypted) {
        localStorage.setItem(`privKey_${user.id}`, decrypted);
        setStatus("success");
        setMsg("Key successfully recovered! You can now read messages.");
        window.location.reload();
      } else {
        throw new Error("Incorrect password or corrupted key");
      }
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message || "Recovery failed");
    }
  };

  if (hasLocalKey && hasServerBackup) {
    return (
      <div className="bg-green/10 text-green p-4 rounded-xl flex flex-col gap-3 mt-8" id="e2ee-section">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-semibold">Your encryption key is securely backed up.</span>
        </div>
        <div className="border-t border-green/20 pt-3">
          <button 
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="text-sm font-bold hover:underline"
          >
            {showQR ? "Hide Recovery QR Code" : "Show Recovery QR Code"}
          </button>
          {showQR && (
            <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl w-fit shadow-sm border border-purple-light/20">
              {!qrPwd ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-navy-dark font-medium">Enter Master Password to reveal QR:</p>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      id="qr-pwd-input" 
                      className="border border-purple-light/50 rounded-lg px-3 py-1.5 text-sm text-navy-dark focus:outline-none focus:border-purple"
                      placeholder="Password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') document.getElementById('btn-generate-qr')?.click();
                      }}
                    />
                    <button 
                      id="btn-generate-qr"
                      type="button"
                      className="bg-purple text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-bright"
                      onClick={async () => {
                        const val = (document.getElementById('qr-pwd-input') as HTMLInputElement).value;
                        if (!val) return;
                        try {
                          const payload = JSON.parse(user.encryptedPrivateKey);
                          const dec = await decryptPrivateKeyWithPassword(payload, val);
                          if (dec) {
                            const res = await generateRecoverySessionAction(val);
                            if (res.success && res.uuid) {
                              setQrUuid(res.uuid);
                              setQrPwd(val);
                              setQrError("");
                            } else {
                              setQrError("Failed to generate session.");
                            }
                          } else {
                            setQrError("Incorrect password");
                          }
                        } catch(e) {
                          setQrError("Error verifying password");
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                  {qrError && <p className="text-pink text-xs font-semibold">{qrError}</p>}
                </div>
              ) : (
                <>
                  <QRCode value={`REC:${qrUuid}`} size={200} level="Q" />
                  <p className="text-[10px] text-center text-gray-500 mt-3 max-w-[180px]">
                    Scan this from the login page on your new device to securely log in. Expires in 5 minutes.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-light/10 p-4 sm:p-6 rounded-2xl border border-purple-light/30 flex flex-col gap-4 mt-8" id="e2ee-section">
      <div className="flex items-center gap-2 text-navy-dark dark:text-white font-bold text-lg">
        <Key className="w-5 h-5 text-purple" />
        Encryption Key Management
      </div>
      <p className="text-sm text-gray-text">
        {!hasLocalKey && hasServerBackup 
          ? "You are on a new device. Enter your Master Password to unlock your encrypted messages." 
          : "Set a Master Password to back up your encryption key. This lets you read your messages on other devices."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          id="e2ee-password-input"
          type="password" 
          placeholder="Master Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-navy-deep border border-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
        />
        <button 
          type="button"
          onClick={!hasLocalKey && hasServerBackup ? handleRecover : handleBackup}
          disabled={status === "loading" || !password}
          className="bg-purple text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-bright disabled:opacity-50"
        >
          {status === "loading" ? "Processing..." : (!hasLocalKey && hasServerBackup ? "Recover Key" : "Backup Key")}
        </button>
      </div>
      {msg && <p className={`text-sm font-medium ${status === 'error' ? 'text-pink' : 'text-green'}`}>{msg}</p>}
      
      {hasLocalKey && (
        <div className="border-t border-purple-light/20 pt-3 mt-2">
          <button 
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="text-sm font-bold text-purple hover:underline"
          >
            {showQR ? "Hide Link Device QR Code" : "Show Link Device QR Code"}
          </button>
          {showQR && (
            <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl w-fit shadow-sm border border-purple-light/20">
              {!qrUuid ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-navy-dark font-medium text-center">Generate a secure QR code to link a new device without a password.</p>
                  <button 
                    id="btn-generate-qr-2"
                    type="button"
                    className="bg-purple text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-bright"
                    onClick={async () => {
                      try {
                        const localKey = localStorage.getItem(`privKey_${user.id}`);
                        if (!localKey) {
                          setQrError("No local private key found.");
                          return;
                        }

                        const res = await createLinkDeviceTokenAction();
                        if (res.success && res.token) {
                          const encryptionKey = crypto.randomUUID();
                          const payloadString = JSON.stringify({ token: res.token, privateKey: localKey });
                          const encryptedPayload = await encryptPrivateKeyWithPassword(payloadString, encryptionKey);
                          
                          const uuid = crypto.randomUUID();
                          
                          const { database } = await import("@/lib/firebase");
                          await database.ref(`linkSessions/${uuid}`).set({
                            payload: encryptedPayload,
                            expiresAt: Date.now() + 5 * 60 * 1000
                          });

                          setQrUuid(uuid);
                          setQrPwd(encryptionKey);
                          setQrError("");
                        } else {
                          setQrError("Failed to generate token.");
                        }
                      } catch (e) {
                        setQrError("An error occurred.");
                      }
                    }}
                  >
                    Generate Link QR
                  </button>
                  {qrError && <p className="text-xs text-pink mt-1">{qrError}</p>}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-bold text-green mb-1">Scan this QR on your new device</p>
                  <div className="p-2 bg-white rounded-lg">
                    <QRCode value={`LINK:${qrUuid}:${qrPwd}`} size={200} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">QR code expires in 5 minutes.</p>
                  <button 
                    onClick={() => { setQrUuid(""); setQrPwd(""); }}
                    className="text-xs text-purple hover:underline mt-2 font-medium"
                  >
                    Reset QR Code
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProfileForm() {
  const { user, refreshUser, logout } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // State for the uploaded image base64 string
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || "");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  useEffect(() => {
    if (searchParams.get("edit") === "e2ee") {
      setTimeout(() => {
        const el = document.getElementById("e2ee-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("e2ee-password-input")?.focus();
        }
      }, 500);
    }
  }, [searchParams]);

  // Handle file selection and resize via canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 to keep base64 string small
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert back to base64 (webp for better quality and compression)
        const dataUrl = canvas.toDataURL("image/webp", 0.92);
        setPreviewImage(dataUrl);
        setError("");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateUserProfileAction(formData);
      if (res.success) {
        setSuccess(true);
        await refreshUser();
      } else {
        setError(res.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-deep p-8 rounded-3xl shadow-sm border border-purple-light/20 flex flex-col gap-6 w-full max-w-2xl mx-auto">
      
      {/* Profile Picture (Clickable Avatar) */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-purple-light/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-navy-dark shadow-md transition-transform group-hover:scale-105">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-purple" />
            )}
            {/* Overlay for hover */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {previewImage && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                  title="Preview"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                title="Change Photo"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-text mt-4 font-medium">Hover to preview or change your avatar</p>
        
        <input 
          type="file" 
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Hidden input to submit the base64 string to the server action */}
        <input type="hidden" name="profilePicture" value={previewImage} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
            Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              name="name"
              type="text"
              defaultValue={user.name || ""}
              placeholder="Your full name"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
            Username
          </label>
          <div className="relative">
            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              name="username"
              type="text"
              defaultValue={user.username || ""}
              placeholder="coolperson123"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              name="contact"
              type="email"
              defaultValue={user.contact || ""}
              placeholder="Your email address"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              name="phone"
              type="tel"
              defaultValue={user.phone || ""}
              placeholder="Your mobile number"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
          Bio
        </label>
        <textarea 
          name="bio"
          defaultValue={user.bio || ""}
          placeholder="Tell everyone a bit about yourself..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white resize-none"
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          {error && <p className="text-pink text-sm font-medium">{error}</p>}
          {success && (
            <p className="text-green text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Profile updated successfully!
            </p>
          )}
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto bg-purple text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-bright transition-colors shadow-sm disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
        </button>
      </div>

      {/* E2EE Manager Section */}
      <E2EEManager user={user} />

      <div className="mt-8 pt-8 border-t border-purple-light/20 flex justify-end">
        <button 
          type="button" 
          onClick={logout}
          className="text-red-500 font-semibold text-sm hover:text-red-600 transition-colors"
        >
          Logout from account
        </button>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full flex justify-center animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 transition-colors"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="h-8 w-8" />
            </button>
            <img 
              src={previewImage} 
              alt="Profile Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </form>
  );
}
