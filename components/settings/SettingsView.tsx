"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  User,
  AlertCircle,
  Sliders,
  FileJson,
  FileSpreadsheet,
  Info,
  Smartphone,
  Share,
  ShieldCheck,
  Bell,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface SettingsViewProps {
  user: {
    email: string;
    displayName?: string | null;
    timezone?: string;
  };
  settings: {
    reminderPeriod: boolean;
    reminderLogging: boolean;
    reminderSymptoms: boolean;
    reminderPms?: boolean;
    cycleLengthDefault: number;
    periodDurationDefault: number;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings: initialSettings,
}) => {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [timezone, setTimezone] = useState(user.timezone || "Asia/Jakarta");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [reminderPeriod, setReminderPeriod] = useState(initialSettings.reminderPeriod);
  const [reminderLogging, setReminderLogging] = useState(initialSettings.reminderLogging);
  const [reminderSymptoms, setReminderSymptoms] = useState(initialSettings.reminderSymptoms);
  const [reminderPms, setReminderPms] = useState(initialSettings.reminderPms ?? true);
  const [cycleLengthDefault, setCycleLengthDefault] = useState(
    initialSettings.cycleLengthDefault || 28
  );
  const [periodDurationDefault, setPeriodDurationDefault] = useState(
    initialSettings.periodDurationDefault || 5
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const [notifPermission, setNotifPermission] = useState<string>("default");

  const [isStandalone, setIsStandalone] = useState(false);
  const [canPromptPwa, setCanPromptPwa] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setNotifPermission(Notification.permission);
      }
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream;
      setIsIosDevice(isIos);

      if (window.__RICILS_PWA_PROMPT__) {
        setCanPromptPwa(true);
      }

      const onPromptAvailable = () => setCanPromptPwa(true);
      window.addEventListener("ricils:pwa-prompt-available", onPromptAvailable);
      return () => {
        window.removeEventListener("ricils:pwa-prompt-available", onPromptAvailable);
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    const prompt = window.__RICILS_PWA_PROMPT__;
    if (prompt) {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanPromptPwa(false);
        window.__RICILS_PWA_PROMPT__ = null;
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setProfileMsg(null);
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ displayName, timezone }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui profil");
      setProfileMsg("Profil berhasil diperbarui.");
      setTimeout(() => setProfileMsg(null), 3000);
    } catch {
      setProfileMsg("Terjadi kesalahan.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      setSettingsMsg(null);

      if (
        (reminderPeriod || reminderLogging || reminderSymptoms || reminderPms) &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          reminderPeriod,
          reminderLogging,
          reminderSymptoms,
          reminderPms,
          cycleLengthDefault,
          periodDurationDefault,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan preferensi");
      setSettingsMsg("Pengaturan berhasil disimpan.");
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch {
      setSettingsMsg("Terjadi kesalahan.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExport = (type: "json" | "csv") => {
    window.location.href = `/api/export?format=${type}`;
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "HAPUS") {
      setDeleteError("Ketik 'HAPUS' untuk konfirmasi.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteError(null);

      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus akun");
      }

      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus akun";
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold tracking-widest text-[#D8647F] uppercase mb-1 block">
          Preferensi & Keamanan
        </span>
        <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[#221B1F] tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-xs text-[#7A6E75] mt-1">
          Kelola profil pribadi, estimasi acuan siklus, notifikasi, dan hak privasi datamu.
        </p>
      </div>

      {/* PWA Installation Card */}
      <div className="surface-card p-5 sm:p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-[#221B1F]">Aplikasi Ricil&apos;s (PWA)</h3>
          </div>
          <span
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
              isStandalone
                ? "bg-[#EBF4F0] text-[#588B76]"
                : "bg-[#FAF0F2] text-[#D8647F]"
            }`}
          >
            {isStandalone ? "✓ Aplikasi Terpasang (Standalone)" : "Mode Browser Web"}
          </span>
        </div>

        {isStandalone ? (
          <p className="text-xs text-[#7A6E75] leading-relaxed">
            Ricil&apos;s telah berjalan sebagai aplikasi native di perangkat Anda dengan akses offline cepat, navigasi layar penuh tanpa bilah browser, dan responsivitas instan.
          </p>
        ) : (
          <div className="space-y-3 text-xs text-[#7A6E75]">
            <p className="leading-relaxed">
              Pasang Ricil&apos;s ke Layar Utama (*Home Screen*) HP atau Laptop Anda untuk pengalaman bebas hambatan seperti aplikasi native:
            </p>

            {canPromptPwa && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="px-4 py-2.5 rounded-full bg-[#D8647F] hover:bg-[#C5536D] text-white text-xs font-medium shadow-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Pasang Ricil&apos;s ke Layar Utama
                </button>
              </div>
            )}

            {isIosDevice ? (
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#EFE8DE] space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium text-[#221B1F]">
                  <Share className="w-3.5 h-3.5 text-[#D8647F]" />
                  <span>Cara Pasang di iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-[#7A6E75]">
                  <li>Buka website ini menggunakan <strong>Safari</strong>.</li>
                  <li>Ketuk tombol <strong>Bagikan (Ikon Kotak Panah Atas ↑)</strong> di bilah bawah Safari.</li>
                  <li>Pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</li>
                </ol>
              </div>
            ) : (
              !canPromptPwa && (
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#EFE8DE] text-[11px] space-y-1">
                  <p className="font-medium text-[#221B1F]">Cara Pasang Manual di Chrome / Edge / Android:</p>
                  <p>
                    Ketuk menu <strong>titik tiga (⋮)</strong> di kanan atas browser → Pilih{" "}
                    <strong>&quot;Instal Aplikasi&quot;</strong> atau{" "}
                    <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Profil Pengguna */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F0EAE1]">
          <div className="w-6 h-6 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-semibold text-[#221B1F]">Profil Pengguna</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#221B1F] mb-1.5">
              Email Terdaftar
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA]/70 border border-[#E8E0D5] text-xs text-[#7A6E75] cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5">
                Zona Waktu
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          {profileMsg && (
            <div className="text-xs text-[#588B76] bg-[#EBF4F0] p-2.5 rounded-xl border border-[#588B76]/20 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{profileMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 text-xs font-medium text-white bg-[#221B1F] hover:bg-black rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </div>

      {/* Preferensi & Pengingat */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F0EAE1]">
          <div className="w-6 h-6 rounded-full bg-[#EBF4F0] text-[#588B76] flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-semibold text-[#221B1F]">Preferensi Siklus & Notifikasi</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5">
                Panjang Siklus Acuan (Hari)
              </label>
              <input
                type="number"
                min={15}
                max={60}
                value={cycleLengthDefault}
                onChange={(e) => setCycleLengthDefault(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
              />
              <span className="text-[10px] text-[#A3969F] mt-1 block">
                Acuan awal sebelum terkumpul 3 siklus historis
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#221B1F] mb-1.5">
                Durasi Haid Acuan (Hari)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={periodDurationDefault}
                onChange={(e) => setPeriodDurationDefault(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-[#D8647F]/30 focus:border-[#D8647F] transition-all"
              />
              <span className="text-[10px] text-[#A3969F] mt-1 block">
                Perkiraan durasi pendarahan normal
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#D8647F]" />
                <span className="text-xs font-semibold text-[#221B1F]">
                  Pengingat Web & PWA
                </span>
              </div>
              <span
                className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                  notifPermission === "granted"
                    ? "bg-[#EBF4F0] text-[#588B76]"
                    : notifPermission === "denied"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-[#F4EFEA] text-[#7A6E75]"
                }`}
              >
                {notifPermission === "granted"
                  ? "Diizinkan"
                  : notifPermission === "denied"
                  ? "Diblokir Browser"
                  : "Belum Diminta"}
              </span>
            </div>

            {notifPermission === "denied" && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Izin notifikasi diblokir</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Untuk mengaktifkan kembali, klik ikon gembok/setelan situs di samping URL browser Anda, ubah pilihan <strong>Notifikasi</strong> menjadi <strong>Izinkan</strong>, lalu muat ulang halaman.
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reminderPeriod}
                  onChange={(e) => setReminderPeriod(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D8647F] focus:ring-[#D8647F] accent-[#D8647F]"
                />
                <span className="text-xs text-[#221B1F] group-hover:text-[#D8647F] transition-colors">
                  Pengingat perkiraan menstruasi
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reminderPms}
                  onChange={(e) => setReminderPms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D8647F] focus:ring-[#D8647F] accent-[#D8647F]"
                />
                <span className="text-xs text-[#221B1F] group-hover:text-[#D8647F] transition-colors">
                  Pengingat saat memasuki fase PMS (Sindrom Pra-Menstruasi)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reminderLogging}
                  onChange={(e) => setReminderLogging(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D8647F] focus:ring-[#D8647F] accent-[#D8647F]"
                />
                <span className="text-xs text-[#221B1F] group-hover:text-[#D8647F] transition-colors">
                  Pengingat mencatat siklus harian
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reminderSymptoms}
                  onChange={(e) => setReminderSymptoms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D8647F] focus:ring-[#D8647F] accent-[#D8647F]"
                />
                <span className="text-xs text-[#221B1F] group-hover:text-[#D8647F] transition-colors">
                  Pengingat mencatat gejala fisik & suasana hati
                </span>
              </label>
            </div>
          </div>

          {settingsMsg && (
            <div className="text-xs text-[#588B76] bg-[#EBF4F0] p-2.5 rounded-xl border border-[#588B76]/20 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 text-xs font-medium text-white bg-[#D8647F] hover:bg-[#C5536D] rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>

      {/* Ekspor Data */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[#F0EAE1]">
          <div className="w-6 h-6 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-semibold text-[#221B1F]">Kedaulatan & Ekspor Data</h3>
        </div>
        <p className="text-xs text-[#7A6E75] mb-4 leading-relaxed">
          Seluruh data siklus dan catatan kesehatanmu adalah milikmu. Unduh salinan data lengkap dalam format JSON atau CSV spreadsheet kapan saja.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleExport("json")}
            className="px-4 py-2 rounded-full bg-white border border-[#E8E0D5] hover:border-[#D8647F] text-xs font-medium text-[#221B1F] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileJson className="w-3.5 h-3.5 text-[#D8647F]" />
            Unduh Format JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="px-4 py-2 rounded-full bg-white border border-[#E8E0D5] hover:border-[#588B76] text-xs font-medium text-[#221B1F] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#588B76]" />
            Unduh Format CSV (Excel)
          </button>
        </div>
      </div>

      {/* Danger Zone: Hapus Akun */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#FCF4F6] border border-[#D8647F]/25">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-[#D8647F]" />
          <h3 className="text-xs font-semibold text-[#8B263E]">Zona Bahaya: Hapus Akun</h3>
        </div>
        <p className="text-xs text-[#8B263E]/80 mb-4 leading-relaxed">
          Tindakan ini permanen. Semua data akun, riwayat menstruasi, catatan harian, dan preferensi akan dihapus seketika dari server dan tidak dapat dipulihkan.
        </p>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2 text-xs font-medium text-white bg-[#8B263E] hover:bg-[#721F33] rounded-full shadow-xs transition-colors cursor-pointer"
        >
          Hapus Akun Saya
        </button>
      </div>

      {/* Modal Hapus Akun */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteError(null);
          setDeletePassword("");
          setDeleteConfirmText("");
        }}
        title="Konfirmasi Hapus Akun"
        maxWidth="md"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>
              Perhatian: Tindakan ini akan menghapus seluruh data Anda tanpa bisa dipulihkan.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#221B1F] mb-1">
              Masukkan Kata Sandi Anda
            </label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#221B1F] mb-1">
              Ketik <strong className="text-red-600 font-bold">HAPUS</strong> untuk mengonfirmasi
            </label>
            <input
              type="text"
              required
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="HAPUS"
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E0D5] text-xs text-[#221B1F] focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {deleteError && (
            <div className="text-xs text-red-600 bg-red-100 p-2.5 rounded-xl">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EAE1]">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#7A6E75] hover:bg-[#F4EFEA] rounded-full transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDeletingAccount}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeletingAccount ? "Menghapus..." : "Ya, Hapus Akun Selamanya"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
