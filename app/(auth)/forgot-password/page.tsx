"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Moon, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses permintaan");
      }

      setMessage(data.message || "Instruksi pemulihan telah disiapkan.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBF9F6] relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#FAF0F2] blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#F4EFF7] blur-3xl opacity-60 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D8647F] to-[#EAA1B2] flex items-center justify-center text-white shadow-md shadow-[#D8647F]/20 group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5 fill-white" />
            </div>
            <span className="font-editorial text-2xl text-[#221B1F] tracking-tight font-normal">
              Lunara
            </span>
          </Link>
          <h1 className="font-editorial text-2xl font-normal text-[#221B1F] mt-4">
            Lupa Kata Sandi
          </h1>
          <p className="text-xs text-[#7A6E75] mt-1">
            Masukkan email terdaftar untuk mengatur ulang kata sandi
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          {message ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EBF4F0] text-[#588B76] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#221B1F] leading-relaxed">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8647F] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#7A6E75]" />
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] placeholder:text-[#A3969F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-semibold shadow-md shadow-[#D8647F]/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? "Mengirim..." : "Kirim Permintaan Reset"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7A6E75] hover:text-[#221B1F]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
