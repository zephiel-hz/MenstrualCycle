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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E78895] to-[#F3A6B4] flex items-center justify-center text-white shadow-md shadow-[#E78895]/20">
              <Moon className="w-6 h-6 fill-white" />
            </div>
            <span className="font-bold text-2xl text-[#2D2727] tracking-tight">Lunara</span>
          </Link>
          <h1 className="text-xl font-bold text-[#2D2727] mt-4">Lupa Kata Sandi</h1>
          <p className="text-xs text-[#79716B] mt-1">
            Masukkan email terdaftar untuk mengatur ulang kata sandi
          </p>
        </div>

        <div className="card-soft p-6 sm:p-8">
          {message ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#2D2727] leading-relaxed">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E78895] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2727] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#79716B]" />
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] placeholder:text-[#79716B]/60 focus:outline-none focus:ring-2 focus:ring-[#E78895]/40"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#E78895] hover:bg-[#d66d7d] text-white text-xs font-semibold shadow-md shadow-[#E78895]/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? "Mengirim..." : "Kirim Permintaan Reset"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#79716B] hover:text-[#2D2727]"
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
