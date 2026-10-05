"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="surface-card max-w-md w-full p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-editorial text-xl font-normal text-[#221B1F]">
            Terjadi Kendala Memuat Halaman
          </h2>
          <p className="text-xs text-[#7A6E75] mt-1.5 leading-relaxed">
            Halaman mengalami sedikit kendala teknis saat memuat data. Jangan khawatir, datamu tersimpan dengan aman.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#FAF9F6] border border-[#E8E0D5] hover:border-[#D8647F] text-[#221B1F] text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
