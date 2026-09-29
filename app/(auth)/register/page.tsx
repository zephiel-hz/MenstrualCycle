"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, ArrowRight, AlertCircle, Lock, Mail, User, KeyRound, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  // Step 1: Input details, Step 2: Input OTP
  const [step, setStep] = useState<1 | 2>(1);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          type: "register",
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim kode verifikasi");
      }

      setSuccessMsg(data.message || `Kode verifikasi telah dikirim ke ${email}`);
      setStep(2);
      setResendTimer(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Masukkan 6 digit kode verifikasi lengkap");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/verify-register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verifikasi kode gagal");
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

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          type: "register",
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ulang kode");
      }

      setSuccessMsg("Kode verifikasi baru telah dikirim.");
      setResendTimer(60);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim ulang kode";
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
            {step === 1 ? "Buat Akun Pribadi" : "Verifikasi Email"}
          </h1>
          <p className="text-xs text-[#7A6E75] mt-1">
            {step === 1
              ? "Mulai pelacakan siklus yang tenang, privat, dan bebas iklan"
              : `Masukkan 6 digit kode yang dikirim ke ${email}`}
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          {step === 1 ? (
            /* STEP 1: Fill Form */
            <form onSubmit={handleRequestOtp} className="space-y-4">
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
                {isLoading ? "Mengirim Kode..." : "Lanjutkan & Kirim Kode"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: Input OTP */
            <form onSubmit={handleVerifyRegister} className="space-y-4">
              {successMsg && (
                <div className="p-3 rounded-xl bg-[#EBF4F0] border border-[#588B76]/20 text-xs text-[#588B76] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D8647F]" />
                  Kode Verifikasi (6 Digit)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-center font-mono text-2xl tracking-[0.4em] font-bold text-[#221B1F] placeholder:text-[#A3969F]/40 focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
                />
                <span className="text-[11px] text-[#A3969F] mt-1.5 block text-center">
                  Cek kotak masuk atau folder spam email Anda
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-semibold shadow-md shadow-[#D8647F]/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? "Memverifikasi..." : "Verifikasi & Masuk ke Lunara"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-[#7A6E75] hover:text-[#221B1F] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Ubah data
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="text-[#D8647F] hover:underline disabled:text-[#A3969F] disabled:no-underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {resendTimer > 0 ? `Kirim Ulang (${resendTimer}s)` : "Kirim Ulang Kode"}
                </button>
              </div>
            </form>
          )}

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
