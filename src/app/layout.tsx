// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Script from "next/script";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My_Hostel",
  description: "Built by @stainpl",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://js.paystack.co/v2/inline.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
