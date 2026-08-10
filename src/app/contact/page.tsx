"use client";

import { useState } from "react";
import { Send, Mail, MessageSquare, Code2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

import { submitContactMessage } from "@/app/actions";

export default function ContactPage() {
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
    <div className="min-h-screen bg-white dark:bg-navy-dark">
      <Navbar />
      
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink/10 text-pink text-sm font-semibold mb-6">
              <Mail className="w-4 h-4" />
              <span>Get in touch</span>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-navy-dark dark:text-white sm:text-6xl">
              Send a Transmission
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-text dark:text-gray-300">
              Found a weird corner of the internet? Have a brilliant idea? Or just want to say hi? Drop us a message below.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-xl sm:mt-20">
            {isSubmitted ? (
              <div className="rounded-3xl bg-green/10 p-12 text-center border border-green/20 backdrop-blur-sm shadow-xl animate-in fade-in zoom-in duration-500">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green/20 text-green mb-6 shadow-[0_0_15px_rgba(22,185,129,0.3)]">
                  <Send className="h-8 w-8 ml-1" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-navy-dark dark:text-white">Transmission Sent!</h3>
                <p className="mt-3 text-lg text-gray-text dark:text-gray-300">Thanks for reaching out. We've received your signal and will reply soon.</p>
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

            <div className="mt-16 flex justify-center gap-8 border-t border-purple-light/50 dark:border-white/10 pt-8 animate-in fade-in duration-1000 delay-300">
              <a href="mailto:akashscience147@gmail.com" className="text-gray-text hover:text-pink transition-colors transform hover:scale-110">
                <span className="sr-only">Email</span>
                <Mail className="h-7 w-7" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-text hover:text-blue transition-colors transform hover:scale-110">
                <span className="sr-only">Social</span>
                <MessageSquare className="h-7 w-7" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-text hover:text-purple-bright transition-colors transform hover:scale-110">
                <span className="sr-only">GitHub</span>
                <Code2 className="h-7 w-7" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
