"use client";
import { Geist, Geist_Mono } from "next/font/google";
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

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-slate-50 text-slate-900`}>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4">
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">SK Sales</div>
              <div className="text-xs text-slate-500">CRM and operations workspace</div>
            </div>
            <div className="rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-red-700">
              <Logout />
            </div>
          </div>
        </header>

        <main className="flex flex-grow flex-col">
          {/* Pages rely on browser-only APIs (localStorage tokens), so render them client-side only.
              The <html>/<body> shell must always render to avoid hydration errors. */}
          {isClient ? children : null}
        </main>
      </body>
    </html>
  );
}
