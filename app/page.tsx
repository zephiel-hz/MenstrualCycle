import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sparkles, Calendar, Lock, Activity, HeartHandshake } from "lucide-react";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6] text-[#221B1F] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FAF0F2] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-[#F4EFF7] blur-3xl opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
        <BrandLogo size="lg" withText />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-[#7A6E75] hover:text-[#221B1F] transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#D8647F] hover:bg-[#C5536D] rounded-full shadow-sm shadow-[#D8647F]/20 transition-all hover:scale-105 active:scale-95"
          >
            Mulai Gratis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF0F2] border border-[#D8647F]/20 text-[#D8647F] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="tracking-wide">Koleksi Jurnal & Kesehatan Siklus Pribadi</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl font-normal text-[#221B1F] tracking-tight leading-[1.15] max-w-2xl">
          Pelacak Siklus yang Tenang, Pribadi, & Berestetika
        </h1>

        <p className="mt-5 text-sm sm:text-base text-[#7A6E75] max-w-xl leading-relaxed">
          Catat ritme fase biologis tubuh, variasi suasana hati, dan gejala harianmu dalam antarmuka editorial tanpa iklan, tanpa pelacak pihak ketiga, dan sepenuhnya privat.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white font-semibold text-sm shadow-lg shadow-[#D8647F]/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-center"
          >
            Mulai Catat Siklus
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full bg-white hover:bg-[#F4EFEA] text-[#221B1F] border border-[#E8E0D5] font-semibold text-sm shadow-2xs hover:border-[#D8647F]/40 transition-all text-center"
          >
            Masuk ke Akun
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full">
          <div className="surface-card p-5 group hover:border-[#D8647F]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#221B1F]">Ritme Siklus Cerdas</h2>
            <p className="text-xs text-[#7A6E75] mt-1.5 leading-relaxed">
              Kalkulasi rata-rata panjang siklus, durasi menstruasi, fase subur, dan estimasi periode mendatang secara presisi.
            </p>
          </div>

          <div className="surface-card p-5 group hover:border-[#588B76]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#EBF4F0] text-[#588B76] flex items-center justify-center mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#221B1F]">Jurnal Gejala & PMS</h2>
            <p className="text-xs text-[#7A6E75] mt-1.5 leading-relaxed">
              Catat intensitas aliran darah, gejala fisik, fluktuasi emosi, dan antisipasi fase PMS sebelum haid dimulai.
            </p>
          </div>

          <div className="surface-card p-5 group hover:border-[#8E78A5]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#F4EFF7] text-[#8E78A5] flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#221B1F]">Kedaulatan & Privasi Data</h2>
            <p className="text-xs text-[#7A6E75] mt-1.5 leading-relaxed">
              Data terisolasi ketat di database serverless pribadi. Tanpa iklan, tanpa pelacak, dan ekspor data mandiri kapan saja.
            </p>
          </div>
        </div>

        <div className="mt-12 w-full max-w-2xl text-left">
          <MedicalDisclaimer />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#F0EAE1] py-6 text-center text-xs text-[#A3969F] relative z-10">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <HeartHandshake className="w-3.5 h-3.5 text-[#D8647F]" />
          <span>Lunara &bull; Dibuat untuk kenyamanan & kesehatan wanita</span>
        </div>
        <p>© {new Date().getFullYear()} Lunara. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
