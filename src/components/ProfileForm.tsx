"use client";

import { useState, useRef } from "react";
import { Loader2, Camera, CheckCircle2, User, AtSign, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfileAction } from "@/app/actions";

export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // State for the uploaded image base64 string
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

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
        const MAX_SIZE = 400;
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
        
        // Convert back to base64 (jpeg for smaller size)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
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
        <div 
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-32 h-32 rounded-full bg-purple-light/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-navy-dark shadow-md transition-transform group-hover:scale-105">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-purple" />
            )}
            {/* Overlay for hover */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white mb-1" />
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </div>
          
          <button 
            type="button"
            className="absolute bottom-0 right-2 bg-purple text-white p-2.5 rounded-full shadow-lg hover:bg-purple-bright transition-colors group-hover:scale-110"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-text mt-4 font-medium">Click your avatar to upload a new photo</p>
        
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

        {/* Contact (Email/Phone) */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-navy-dark dark:text-white mb-2">
            Contact (Email or Phone)
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              name="contact"
              type="text"
              defaultValue={user.contact || ""}
              placeholder="Email or phone number"
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-dark border-0 ring-1 ring-inset ring-purple-light/30 focus:ring-2 focus:ring-purple text-navy-dark dark:text-white"
            />
          </div>
        </div>
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
    </form>
  );
}
