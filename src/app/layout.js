"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logout from "./logout";
import "./globals.css";

// Font imports
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Prevent scrolling increment/decrement on number inputs
    const handleWheel = (event) => {
      if (event.target.type === "number") {
        event.preventDefault(); // Disable scroll behavior (increment/decrement)
      }
    };

    // Add event listener on mount
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Prevents rendering on the server

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/logo123.png" alt="Loyalty Automation" className="h-12 w-auto max-w-[170px] object-contain" />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-900">Loyalty Automation Pvt Ltd</div>
                <div className="text-xs text-slate-500">CRM and operations workspace</div>
              </div>
            </div>
            <div className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              <Logout />
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  
  

  );
}
