"use client";

import { useState } from "react";
import { User as UserIcon, Edit2, X } from "lucide-react";
import { ProfileForm } from "./ProfileForm";

export function EditProfileModal({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="relative group cursor-pointer h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center overflow-hidden text-white font-heading text-3xl font-bold shadow-md"
        onClick={() => setIsOpen(true)}
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.name || "User"} className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="h-10 w-10" />
        )}
        
        {/* Pencil Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-navy-deep rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 mt-10 mb-10">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-100 dark:bg-navy-dark text-gray-500 hover:text-navy-dark dark:text-gray-400 dark:hover:text-white rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-[85vh] overflow-y-auto p-2">
              <ProfileForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
