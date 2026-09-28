import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Moon, Sparkles, Shield, Heart, Calendar, Lock, CheckCircle2 } from "lucide-react";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <header className="w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] flex items-center justify-center text-white shadow-md shadow-[#E07A5F]/20">
            <Moon className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl text-[#2D2727] tracking-tight">Lunara</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-[#2D2727] hover:text-[#E07A5F] transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#E07A5F] hover:bg-[#d0694e] rounded-full shadow-sm shadow-[#E07A5F]/20 transition-all"
          >
            Mulai Gratis
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCECE8] text-[#E07A5F] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your Personal Cycle Companion</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2D2727] tracking-tight leading-tight max-w-2xl">
          Pelacak Siklus Menstruasi yang Tenang, Pribadi, & Aman
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[#79716B] max-w-lg leading-relaxed">
          Catat fase siklus, suasana hati, dan gejala harianmu tanpa gangguan iklan dan tanpa kompromi privasi. Berjalan mulus di perangkat apa pun sebagai Progressive Web App.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-full bg-[#E07A5F] hover:bg-[#d0694e] text-white font-semibold text-sm shadow-lg shadow-[#E07A5F]/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-center"
          >
            Mulai Catat Siklus
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full bg-white hover:bg-[#FAF8F5] text-[#2D2727] border border-[#E8E0D5] font-semibold text-sm shadow-2xs hover:border-[#E07A5F]/40 transition-all text-center"
          >
            Masuk ke Akun
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full">
          <div className="card-soft p-5">
            <div className="w-9 h-9 rounded-xl bg-[#FCECE8] text-[#E07A5F] flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#2D2727]">Pelacakan Siklus Cerdas</h2>
            <p className="text-xs text-[#79716B] mt-1 leading-relaxed">
              Kalkulasi rata-rata panjang siklus, durasi menstruasi, dan estimasi periode berikutnya berdasarkan data historismu.
            </p>
          </div>

          <div className="card-soft p-5">
            <div className="w-9 h-9 rounded-xl bg-[#EBF4F0] text-[#81B29A] flex items-center justify-center mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#2D2727]">Jurnal Gejala & Mood</h2>
            <p className="text-xs text-[#79716B] mt-1 leading-relaxed">
              Catat aliran pendarahan, kram, sakit kepala, suasana hati, serta catatan harian dengan mudah.
            </p>
          </div>

          <div className="card-soft p-5">
            <div className="w-9 h-9 rounded-xl bg-[#F1EFF7] text-[#9B8EB9] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#2D2727]">Privacy by Design</h2>
            <p className="text-xs text-[#79716B] mt-1 leading-relaxed">
              Data terisolasi ketat di serverless database. Tanpa penjualan data, tanpa pelacak pihak ketiga, dan ekspor penuh kapan saja.
            </p>
          </div>
        </div>

        <div className="mt-12 w-full max-w-2xl text-left">
          <MedicalDisclaimer />
        </div>
      </main>

      <footer className="w-full border-t border-[#E8E0D5] py-6 text-center text-xs text-[#79716B]">
        <p>© {new Date().getFullYear()} Lunara. Dibuat dengan cinta & kepedulian untuk kesehatan wanita.</p>
      </footer>
    </div>
  );
}
