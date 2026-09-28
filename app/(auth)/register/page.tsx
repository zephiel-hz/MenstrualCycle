"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, ArrowRight, AlertCircle, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ email, password, displayName: displayName.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registrasi gagal");
      }

      router.push("/dashboard");
      router.refresh();
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
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E78895] to-[#F3A6B4] flex items-center justify-center text-white shadow-md shadow-[#E78895]/20 group-hover:scale-105 transition-transform">
              <Moon className="w-6 h-6 fill-white" />
            </div>
            <span className="font-bold text-2xl text-[#2D2727] tracking-tight">Lunara</span>
          </Link>
          <h1 className="text-xl font-bold text-[#2D2727] mt-4">Buat Akun Pribadi</h1>
          <p className="text-xs text-[#79716B] mt-1">Mulai pelacakan siklus yang aman dan privat</p>
        </div>

        <div className="card-soft p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#79716B]" />
                Nama Panggilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Luna"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] placeholder:text-[#79716B]/60 focus:outline-none focus:ring-2 focus:ring-[#E78895]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#79716B]" />
                Email
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

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#79716B]" />
                Kata Sandi (Minimal 8 Karakter)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {isLoading ? "Mendaftarkan..." : "Daftar Akun"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#F2ECE4] text-center text-xs text-[#79716B]">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#E78895] font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
