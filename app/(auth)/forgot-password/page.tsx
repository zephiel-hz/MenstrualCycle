"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound, Lock, ArrowRight, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

  // Step 1: Send Reset OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ type: "forgot_password", email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim kode pemulihan");
      }

      setMessage(data.message || `Kode pemulihan 6 digit telah dikirim ke ${email}`);
      setStep(2);
      setResendTimer(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Masukkan 6 digit kode pemulihan lengkap");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengatur ulang kata sandi");
      }

      setIsSuccess(true);
      setMessage(data.message || "Kata sandi Anda telah berhasil diperbarui.");
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
        body: JSON.stringify({ type: "forgot_password", email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ulang kode");
      }

      setMessage("Kode pemulihan baru telah dikirim.");
      setResendTimer(60);
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
            {isSuccess ? "Kata Sandi Diperbarui" : step === 1 ? "Lupa Kata Sandi" : "Atur Kata Sandi Baru"}
          </h1>
          <p className="text-xs text-[#7A6E75] mt-1">
            {isSuccess
              ? "Silakan masuk dengan kata sandi baru Anda"
              : step === 1
              ? "Masukkan email terdaftar untuk menerima 6-digit kode pemulihan"
              : `Masukkan kode 6 digit dari email ${email}`}
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EBF4F0] text-[#588B76] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#221B1F] leading-relaxed">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-semibold shadow-md shadow-[#D8647F]/20 hover:shadow-lg transition-all cursor-pointer"
              >
                Masuk Sekarang
              </Link>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Enter Email */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                {isLoading ? "Mengirim..." : "Kirim Kode Pemulihan"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7A6E75] hover:text-[#221B1F] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter OTP & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {message && (
                <div className="p-3 rounded-xl bg-[#EBF4F0] border border-[#588B76]/20 text-xs text-[#588B76] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D8647F]" />
                  Kode Pemulihan (6 Digit)
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
              </div>

              <div>
                <label className="block text-xs font-medium text-[#221B1F] mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#7A6E75]" />
                  Kata Sandi Baru (Minimal 8 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                disabled={isLoading || otp.length !== 6 || newPassword.length < 8}
                className="w-full py-3 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-semibold shadow-md shadow-[#D8647F]/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
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
                  Ganti email
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
        </div>
      </div>
    </div>
  );
}
