import Image from "next/image";
import { Terminal, Globe, Mail, Sparkles } from "lucide-react";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AboutPage() {
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
              <AdminLoginForm>
                <Image 
                  src="/akash.jpg" 
                  alt="Akash - Developer" 
                  fill 
                  className="object-cover object-center hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 288px, 320px"
                  priority
                />
              </AdminLoginForm>
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
      </div>
    </div>
  );
}
