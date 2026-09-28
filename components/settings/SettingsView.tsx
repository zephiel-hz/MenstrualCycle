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
  Bell,
  CheckCircle2,
  Info,
  Smartphone,
  Share,
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
  const [cycleLengthDefault, setCycleLengthDefault] = useState(
    initialSettings.cycleLengthDefault || 28
  );
  const [periodDurationDefault, setPeriodDurationDefault] = useState(
    initialSettings.periodDurationDefault || 5
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [testNotifMsg, setTestNotifMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [showToastPreview, setShowToastPreview] = useState(false);

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

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
      setIsIosDevice(isIos);

      if (window.__LUNARA_PWA_PROMPT__) {
        setCanPromptPwa(true);
      }

      const onPromptAvailable = () => setCanPromptPwa(true);
      window.addEventListener("lunara:pwa-prompt-available", onPromptAvailable);
      return () => window.removeEventListener("lunara:pwa-prompt-available", onPromptAvailable);
    }
  }, []);

  const handleInstallPwa = async () => {
    const prompt = window.__LUNARA_PWA_PROMPT__;
    if (prompt) {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanPromptPwa(false);
        window.__LUNARA_PWA_PROMPT__ = null;
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsTestingNotif(true);
      setTestNotifMsg(null);
      setShowToastPreview(false);

      if (typeof window === "undefined" || !("Notification" in window)) {
        setTestNotifMsg({
          type: "error",
          text: "Browser ini tidak mendukung Web Notification API. Silakan gunakan browser modern seperti Chrome, Edge, Safari, atau Firefox.",
        });
        return;
      }

      let perm = Notification.permission;
      if (perm === "default") {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = await new Promise((resolve) => Notification.requestPermission(resolve));
        }
        setNotifPermission(perm);
      }

      if (perm === "denied") {
        setTestNotifMsg({
          type: "error",
          text: "Izin notifikasi diblokir browser. Untuk memunculkannya: Klik ikon gembok / slider di sebelah kiri URL pada address bar -> Ubah Notifikasi menjadi 'Izinkan' (Allow) -> Muat ulang (Refresh) halaman.",
        });
        return;
      }

      if (perm === "granted") {
        setShowToastPreview(true);

        const title = "🌸 Lunara - Pengingat Siklus";
        const bodyText = "Halo! Ini adalah notifikasi uji coba dari Lunara. Pengingat siklus menstruasi dan catatan harian Anda aktif.";

        let sentViaSw = false;
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && reg.showNotification) {
              await reg.showNotification(title, {
                body: bodyText,
                tag: "lunara-test-notif-" + Date.now(),
              });
              sentViaSw = true;
            }
          } catch (swErr) {
            console.warn("Service worker notification error:", swErr);
          }
        }

        if (!sentViaSw) {
          try {
            new Notification(title, {
              body: bodyText,
              tag: "lunara-test-notif-" + Date.now(),
            });
          } catch (notifErr) {
            console.warn("Direct notification error:", notifErr);
          }
        }

        setTestNotifMsg({
          type: "success",
          text: "✅ Notifikasi berhasil dipicu! Jika banner pop-up OS tidak muncul, periksa Notification Center Windows / Fokus / Do Not Disturb perangkat Anda.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memunculkan notifikasi.";
      setTestNotifMsg({ type: "error", text: msg });
    } finally {
      setIsTestingNotif(false);
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
        (reminderPeriod || reminderLogging || reminderSymptoms) &&
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
    window.location.href = `/api/export?type=${type}`;
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
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2727] tracking-tight">
          Pengaturan & Privasi
        </h1>
        <p className="text-xs text-[#79716B] mt-0.5">
          Kelola profil, preferensi siklus, pengingat, aplikasi PWA, dan data kesehatan pribadimu.
        </p>
      </div>

      {/* PWA Installation Card */}
      <div className="card-soft p-5 sm:p-6 bg-gradient-to-br from-white via-white to-[#FAF8F5]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#F2ECE4]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#E07A5F]" />
            <h3 className="text-sm font-bold text-[#2D2727]">Aplikasi Lunara (PWA)</h3>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isStandalone
              ? "bg-green-100 text-green-700"
              : "bg-[#FCECE8] text-[#E07A5F]"
          }`}>
            {isStandalone ? "✓ Aplikasi Terpasang (Standalone)" : "Mode Browser Web"}
          </span>
        </div>

        {isStandalone ? (
          <p className="text-xs text-[#79716B]">
            Lunara sudah berjalan sebagai aplikasi terpasang di layar utama perangkat Anda dengan akses offline dan tampilan layar penuh tanpa bilah browser.
          </p>
        ) : (
          <div className="space-y-3 text-xs text-[#79716B]">
            <p>
              Anda dapat memasang Lunara ke Layar Utama (*Home Screen*) HP atau Laptop Anda kapan saja agar bisa dibuka langsung seperti aplikasi native:
            </p>

            {canPromptPwa && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Pasang Lunara Sekarang
                </button>
              </div>
            )}

            {isIosDevice ? (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#2D2727]">
                  <Share className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>Cara Pasang di iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-[#79716B]">
                  <li>Buka website ini menggunakan <strong>Safari</strong>.</li>
                  <li>Ketuk tombol <strong>Bagikan (Ikon Kotak Panah Atas ↑)</strong> di bilah bawah Safari.</li>
                  <li>Pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</li>
                </ol>
              </div>
            ) : !canPromptPwa && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-[11px] space-y-1">
                <p className="font-semibold text-[#2D2727]">Cara Pasang Manual di Chrome / Edge / Android:</p>
                <p>Ketuk menu <strong>titik tiga (⋮)</strong> di kanan atas browser $ightarrow$ Pilih <strong>&quot;Instal Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profil Akun */}
      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F2ECE4]">
          <User className="w-4 h-4 text-[#E07A5F]" />
          <h3 className="text-sm font-bold text-[#2D2727]">Profil Pengguna</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2727] mb-1">
              Email Terdaftar
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F2ECE4]/60 border border-[#E8E0D5] text-xs text-[#79716B] cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1">
                Zona Waktu
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          {profileMsg && (
            <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
              {profileMsg}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D2727] hover:bg-black rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </div>

      {/* Preferensi & Pengingat */}
      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F2ECE4]">
          <Sliders className="w-4 h-4 text-[#81B29A]" />
          <h3 className="text-sm font-bold text-[#2D2727]">Preferensi & Pengingat</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1">
                Panjang Siklus Acuan (Hari)
              </label>
              <input
                type="number"
                min={15}
                max={60}
                value={cycleLengthDefault}
                onChange={(e) => setCycleLengthDefault(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
              />
              <span className="text-[10px] text-[#79716B] mt-0.5 block">
                Digunakan sebagai acuan awal sebelum data historis terkumpul
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1">
                Durasi Haid Acuan (Hari)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={periodDurationDefault}
                onChange={(e) => setPeriodDurationDefault(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
              />
              <span className="text-[10px] text-[#79716B] mt-0.5 block">
                Perkiraan durasi hari pendarahan
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2ECE4] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2D2727] block">Pengingat (Web / PWA)</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                notifPermission === "granted"
                  ? "bg-green-100 text-green-700"
                  : notifPermission === "denied"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#F2ECE4] text-[#79716B]"
              }`}>
                Status Izin: {notifPermission === "granted" ? "Diizinkan (Aktif)" : notifPermission === "denied" ? "Diblokir oleh Browser" : "Belum Diminta (Default)"}
              </span>
            </div>

            {notifPermission === "denied" && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mengapa popup izin tidak muncul?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Browser Anda sebelumnya telah menyetel izin notifikasi ke status <strong>Diblokir</strong> (Block) untuk situs ini, sehingga browser secara otomatis tidak memunculkan popup permintaan izin lagi.
                </p>
                <div className="pt-1 text-[11px] text-amber-900 font-medium">
                  <strong>Cara Mengaktifkannya:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5 text-amber-800">
                    <li>Lihat bilah alamat (URL) di bagian atas browser (sebelah kiri <code className="bg-amber-100 px-1 rounded">localhost:3000</code>).</li>
                    <li>Klik ikon <strong>Setelan Situs / Ikon Gembok / Slider</strong>.</li>
                    <li>Ubah pilihan <strong>Notifikasi</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
                    <li>Muat ulang (Refresh) halaman ini.</li>
                  </ol>
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderPeriod}
                onChange={(e) => setReminderPeriod(e.target.checked)}
                className="w-4 h-4 rounded text-[#E07A5F] focus:ring-[#E07A5F]"
              />
              <span className="text-xs text-[#2D2727]">Pengingat perkiraan menstruasi</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderLogging}
                onChange={(e) => setReminderLogging(e.target.checked)}
                className="w-4 h-4 rounded text-[#E07A5F] focus:ring-[#E07A5F]"
              />
              <span className="text-xs text-[#2D2727]">Pengingat mencatat siklus harian</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderSymptoms}
                onChange={(e) => setReminderSymptoms(e.target.checked)}
                className="w-4 h-4 rounded text-[#E07A5F] focus:ring-[#E07A5F]"
              />
              <span className="text-xs text-[#2D2727]">Pengingat mencatat gejala fisik & mood</span>
            </label>

            {/* Test Notification Button */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <div>
                <p className="text-xs font-semibold text-[#2D2727]">Uji Notifikasi Perangkat</p>
                <p className="text-[11px] text-[#79716B]">Klik untuk meminta izin atau mengirim notifikasi langsung ke perangkat.</p>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTestingNotif}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E07A5F]/40 text-xs font-semibold text-[#E07A5F] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                {isTestingNotif ? "Memproses..." : "Kirim Notifikasi Uji Coba"}
              </button>
            </div>

            {testNotifMsg && (
              <div
                className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${
                  testNotifMsg.type === "success"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : testNotifMsg.type === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {testNotifMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p>{testNotifMsg.text}</p>
                </div>
              </div>
            )}

            {/* In-app Toast Preview simulation */}
            {showToastPreview && (
              <div className="p-3 rounded-2xl bg-white border-2 border-[#E07A5F] shadow-lg flex items-start gap-3 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-[#FCECE8] text-[#E07A5F] flex items-center justify-center shrink-0 font-bold text-sm">
                  🌸
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#2D2727]">Lunara - Pengingat Siklus</p>
                    <span className="text-[10px] text-[#79716B]">Baru saja</span>
                  </div>
                  <p className="text-[11px] text-[#79716B] mt-0.5">
                    Halo! Ini adalah notifikasi uji coba dari Lunara. Pengingat siklus menstruasi dan catatan harian Anda aktif.
                  </p>
                </div>
              </div>
            )}
          </div>

          {settingsMsg && (
            <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
              {settingsMsg}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#E07A5F] hover:bg-[#d0694e] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>

      {/* Ekspor Data */}
      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[#F2ECE4]">
          <Download className="w-4 h-4 text-[#E07A5F]" />
          <h3 className="text-sm font-bold text-[#2D2727]">Ekspor Data Mandiri</h3>
        </div>
        <p className="text-xs text-[#79716B] mb-4">
          Data kesehatan adalah hak milikmu sepenuhnya. Kamu dapat mengunduh salinan seluruh riwayat siklus, catatan harian, dan profil dalam format JSON atau CSV kapan saja.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport("json")}
            className="px-4 py-2 rounded-xl bg-white border border-[#E8E0D5] hover:border-[#E07A5F] text-xs font-semibold text-[#2D2727] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileJson className="w-4 h-4 text-[#E07A5F]" />
            Unduh JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="px-4 py-2 rounded-xl bg-white border border-[#E8E0D5] hover:border-[#81B29A] text-xs font-semibold text-[#2D2727] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#81B29A]" />
            Unduh CSV (Zip)
          </button>
        </div>
      </div>

      {/* Hapus Akun & Data (Danger Zone) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-red-50/50 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-red-700">Zona Bahaya: Hapus Akun</h3>
        </div>
        <p className="text-xs text-red-600/90 mb-4 leading-relaxed">
          Tindakan ini permanen. Semua data akun, profil, riwayat menstruasi, catatan harian, dan preferensi akan dihapus secara permanen dari server dan tidak dapat dipulihkan.
        </p>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
            <label className="block text-xs font-semibold text-[#2D2727] mb-1">
              Masukkan Kata Sandi Anda
            </label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2727] mb-1">
              Ketik <strong className="text-red-600 font-bold">HAPUS</strong> untuk mengonfirmasi
            </label>
            <input
              type="text"
              required
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="HAPUS"
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {deleteError && (
            <div className="text-xs text-red-600 bg-red-100 p-2.5 rounded-xl">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2ECE4]">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#79716B] hover:bg-[#F2ECE4] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDeletingAccount}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeletingAccount ? "Menghapus..." : "Ya, Hapus Akun Selamanya"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
