"use client";

import Image from "next/image";
import { Terminal, Globe, Mail, Sparkles, Send } from "lucide-react";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/app/actions";

export default function AboutPage() {
  const { user } = useAuth();
  
  // Contact Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await submitContactMessage(formData);
    
    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
    } else {
      alert("Failed to send message.");
    }
  };

  return (
    <div className="px-6 lg:px-12 max-w-[1600px] mx-auto w-full py-16 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center bg-purple-light/20 p-4 rounded-3xl mb-6 text-purple">
            <Sparkles className="h-10 w-10" />
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white sm:text-5xl mb-4">
            About the Developer
          </h1>
          <p className="text-xl text-gray-text">
            Meet the mind behind the dopamine.
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-navy-deep rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-light/30 flex flex-col md:flex-row items-center gap-12">
          
          {/* Image */}
          <div className="relative w-72 h-[400px] md:w-80 md:h-[450px] shrink-0 mx-auto md:mx-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple via-blue to-green rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-full h-full rounded-3xl border-4 border-white dark:border-navy-dark shadow-2xl overflow-hidden bg-purple-light/20">
              <Image 
                src="/akash.jpg" 
                alt="Akash - Developer" 
                fill 
                className="object-cover object-center hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 288px, 320px"
                priority
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-heading text-3xl font-bold text-navy-dark dark:text-white mb-4">
              Hi, I'm Akash! 👋
            </h2>
            <div className="space-y-4 text-gray-text text-lg leading-relaxed">
              <p>
                I built <strong>The Internet's Most Interesting Things</strong> because I was tired of algorithmic feeds showing me the same boring content. I wanted a place that provided pure, curated dopamine—a digital museum of the weirdest websites, crazy inventions, and fascinating datasets.
              </p>
              <p>
                As a passionate developer, I focus on crafting premium, buttery-smooth user experiences that feel like magic. I believe web applications shouldn't just be functional; they should be beautiful, responsive, and a joy to use.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-4 mt-8">
              <a href="#" className="p-3 bg-gray-100 dark:bg-navy-dark rounded-full text-gray-text hover:text-purple hover:bg-purple-light/20 transition-all shadow-sm hover:shadow-md">
                <Terminal className="h-5 w-5" />
              </a>
              <a href="#" className="p-3 bg-gray-100 dark:bg-navy-dark rounded-full text-gray-text hover:text-blue hover:bg-blue/20 transition-all shadow-sm hover:shadow-md">
                <Globe className="h-5 w-5" />
              </a>
              <CopyEmailButton 
                email="akashscience147@gmail.com" 
                className="p-3 bg-gray-100 dark:bg-navy-dark rounded-full text-gray-text hover:text-blue hover:bg-blue/20 transition-all shadow-sm hover:shadow-md"
                iconClassName="h-5 w-5"
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-20 w-full max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink/10 text-pink text-sm font-semibold mb-6">
              <Mail className="w-4 h-4" />
              <span>Get in touch</span>
            </div>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white sm:text-5xl">
              Send a Transmission
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-text dark:text-gray-300">
              Found a weird corner of the internet? Have a brilliant idea? Or just want to say hi? Drop a message below.
            </p>
          </div>

          <div className="mx-auto mt-12">
            {isSubmitted ? (
              <div className="rounded-3xl bg-green/10 p-12 text-center border border-green/20 backdrop-blur-sm shadow-xl animate-in fade-in zoom-in duration-500">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green/20 text-green mb-6 shadow-[0_0_15px_rgba(22,185,129,0.3)]">
                  <Send className="h-8 w-8 ml-1" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">Transmission Sent!</h3>
                <p className="mt-3 text-lg text-gray-text dark:text-gray-300">Thanks for reaching out. I've received your signal and will reply soon.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-8 font-semibold text-purple-bright hover:text-purple transition-colors inline-flex items-center gap-2 group"
                >
                  Send another message <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/50 dark:bg-navy-deep/50 p-8 sm:p-10 rounded-3xl border border-purple-light/20 dark:border-white/5 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  {!user ? (
                    <>
                      <div className="sm:col-span-2">
                        <label htmlFor="name" className="block text-sm font-semibold leading-6 text-navy-dark dark:text-white">
                          Name
                        </label>
                        <div className="mt-2.5">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="block w-full rounded-xl border-0 px-4 py-3.5 text-navy-dark dark:text-white shadow-sm ring-1 ring-inset ring-purple-light/50 dark:ring-white/10 bg-white dark:bg-navy-dark/80 focus:ring-2 focus:ring-inset focus:ring-purple-bright sm:text-sm sm:leading-6 transition-all outline-none"
                            placeholder="Anonymous Surfer"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-semibold leading-6 text-navy-dark dark:text-white">
                          Email
                        </label>
                        <div className="mt-2.5">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            className="block w-full rounded-xl border-0 px-4 py-3.5 text-navy-dark dark:text-white shadow-sm ring-1 ring-inset ring-purple-light/50 dark:ring-white/10 bg-white dark:bg-navy-dark/80 focus:ring-2 focus:ring-inset focus:ring-purple-bright sm:text-sm sm:leading-6 transition-all outline-none"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="name" value={user.name || user.username || "Authenticated User"} />
                      <input type="hidden" name="email" value={user.contact || ""} />
                      <div className="sm:col-span-2 bg-purple-light/10 p-4 rounded-2xl flex items-center gap-4 border border-purple-light/30 shadow-sm mb-2">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            (user.name || user.username || "U")[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple tracking-wider uppercase mb-0.5">Sending as</p>
                          <p className="font-bold text-navy-dark dark:text-white text-lg leading-tight">{user.name || user.username}</p>
                          {user.contact && <p className="text-sm text-gray-text">{user.contact}</p>}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold leading-6 text-navy-dark dark:text-white">
                      Message
                    </label>
                    <div className="mt-2.5">
                      <textarea
                        name="message"
                        id="message"
                        rows={4}
                        required
                        className="block w-full rounded-xl border-0 px-4 py-3.5 text-navy-dark dark:text-white shadow-sm ring-1 ring-inset ring-purple-light/50 dark:ring-white/10 bg-white dark:bg-navy-dark/80 focus:ring-2 focus:ring-inset focus:ring-purple-bright sm:text-sm sm:leading-6 transition-all outline-none resize-none"
                        placeholder="I found this crazy website..."
                        defaultValue={''}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-purple-bright px-3.5 py-4 text-center text-base font-semibold text-white shadow-md hover:shadow-xl hover:from-purple-bright hover:to-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? "Transmitting..." : "Send Message"}
                    {!isSubmitting && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
