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
            Buat Akun Pribadi
          </h1>
          <p className="text-xs text-[#7A6E75] mt-1">
            Mulai pelacakan siklus yang tenang, privat, dan bebas iklan
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7A6E75]" />
                Nama Panggilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Luna"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] placeholder:text-[#A3969F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7A6E75]" />
                Email
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

            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7A6E75]" />
                Kata Sandi (Minimal 8 Karakter)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {isLoading ? "Mendaftarkan..." : "Daftar Akun"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#F0EAE1] text-center text-xs text-[#7A6E75]">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#D8647F] font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
