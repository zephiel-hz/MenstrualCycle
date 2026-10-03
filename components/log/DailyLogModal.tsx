"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Droplet, Calendar, Trash2, CheckCircle2, AlertCircle, Smile, Activity, Sparkles, Check, WifiOff } from "lucide-react";
import { formatISODateOnly } from "@/lib/utils";
import {
  getCachedLogByDate,
  getCachedLogs,
  hydrateLocalCache,
  offlineSaveDailyLog,
  offlineDeleteDailyLog,
  isOnline,
} from "@/lib/offline/syncManager";

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onLogSaved?: () => void;
}

const FLOWS = [
  { id: "none", label: "Tidak Ada", desc: "Bersih / Kering", drops: 0 },
  { id: "light", label: "Ringan", desc: "Flek / Sedikit", drops: 1 },
  { id: "medium", label: "Sedang", desc: "Aliran Normal", drops: 2 },
  { id: "heavy", label: "Banyak", desc: "Aliran Deras", drops: 3 },
] as const;

const MOODS = [
  { id: "senang", label: "Senang & Gembira" },
  { id: "baik", label: "Tenang & Santai" },
  { id: "netral", label: "Netral / Biasa" },
  { id: "sedih", label: "Sensitif / Sedih" },
  { id: "stres", label: "Stres / Lelah" },
  { id: "mudah_marah", label: "Mudah Terpancing" },
  { id: "cemas", label: "Khawatir / Cemas" },
  { id: "berenergi", label: "Penuh Energi ✨" },
];

const SYMPTOMS = [
  { id: "kram", label: "Kram Perut" },
  { id: "sakit_kepala", label: "Sakit Kepala" },
  { id: "kembung", label: "Perut Kembung" },
  { id: "jerawat", label: "Jerawat Hormonal" },
  { id: "nyeri_punggung", label: "Nyeri Punggung" },
  { id: "lelah", label: "Mudah Lelah" },
  { id: "mual", label: "Mual" },
  { id: "payudara_sensitif", label: "Payudara Nyeri" },
  { id: "insomnia", label: "Sulit Tidur" },
  { id: "nafsu_makan_naik", label: "Nafsu Makan Naik" },
];

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  onLogSaved,
}) => {
  const [date, setDate] = useState<string>(initialDate || formatISODateOnly(new Date()));
  const [flow, setFlow] = useState<string>("none");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const targetDate = initialDate || formatISODateOnly(new Date());
    setDate(targetDate);
    fetchLogForDate(targetDate);
  }, [isOpen, initialDate]);

  const fetchLogForDate = async (targetDate: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Check local IndexedDB cache first
      const allLogs = await getCachedLogs();
      const localCached = allLogs.find((l) => l.date === targetDate);
      if (localCached) {
        setExistingLogId(localCached.id || null);
        setFlow(localCached.flow || "none");
        setSelectedMoods(Array.isArray(localCached.mood) ? localCached.mood : []);
        setSelectedSymptoms(Array.isArray(localCached.symptoms) ? localCached.symptoms : []);
        setNotes(localCached.notes || "");
      } else {
        setExistingLogId(null);
        setFlow("none");
        setSelectedMoods([]);
        setSelectedSymptoms([]);
        setNotes("");
      }

      // 2. If online, fetch latest from server and update IndexedDB cache
      if (isOnline()) {
        try {
          const res = await fetch(`/api/logs?date=${targetDate}`, {
            headers: { "bypass-tunnel-reminder": "true" },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.log) {
              setExistingLogId(data.log.id);
              setFlow(data.log.flow || "none");
              setSelectedMoods(Array.isArray(data.log.mood) ? data.log.mood : []);
              setSelectedSymptoms(Array.isArray(data.log.symptoms) ? data.log.symptoms : []);
              setNotes(data.log.notes || "");
              await hydrateLocalCache({ logs: [data.log] });
            } else if (!localCached) {
              setExistingLogId(null);
              setFlow("none");
              setSelectedMoods([]);
              setSelectedSymptoms([]);
              setNotes("");
            }
          }
        } catch {
          // If network fetch fails, stay with localCached
        }
      }
    } catch {
      setErrorMessage("Gagal memuat catatan harian.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMood = (id: string) => {
    setSelectedMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await offlineSaveDailyLog({
        id: existingLogId,
        date,
        flow,
        mood: selectedMoods,
        symptoms: selectedSymptoms,
        notes: notes.trim() || null,
      });

      if (!result.success) {
        throw new Error("Gagal menyimpan catatan.");
      }

      if (result.isOffline) {
        setSuccessMessage("Catatan tersimpan di perangkat (Mode Offline) & akan disinkronkan saat online.");
      } else {
        setSuccessMessage("Catatan harian berhasil disimpan!");
      }

      setTimeout(() => {
        onLogSaved?.();
        onClose();
      }, 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan catatan.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingLogId && !date) return;
    if (!confirm("Hapus catatan harian untuk tanggal ini?")) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await offlineDeleteDailyLog(existingLogId, date);

      onLogSaved?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus catatan.";
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Jurnal & Kondisi Harian" maxWidth="md">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#221B1F] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D8647F]" />
            Tanggal Pencatatan
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              fetchLogForDate(e.target.value);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F3] border border-[#EFE9E2] text-xs text-[#221B1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#D8647F]/40 transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#7D7277]">
            <div className="w-6 h-6 border-2 border-[#D8647F]/30 border-t-[#D8647F] rounded-full animate-spin mx-auto mb-2" />
            Memuat data tanggal terpilih...
          </div>
        ) : (
          <>
            {/* Flow Intensity Cards */}
            <div>
              <label className="block text-xs font-semibold text-[#221B1F] mb-2 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#D8647F]" />
                Intensitas Aliran Darah
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FLOWS.map((item) => {
                  const isSelected = flow === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFlow(item.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FAF0F2] border-[#D8647F] text-[#D8647F] font-semibold ring-1 ring-[#D8647F] shadow-xs"
                          : "bg-white border-[#EFE9E2] text-[#221B1F] hover:bg-[#FAF6F3]"
                      }`}
                    >
                      <div className="flex justify-center gap-0.5 mb-1.5">
                        {item.drops === 0 ? (
                          <span className="text-xs text-[#7D7277]">•</span>
                        ) : (
                          Array.from({ length: item.drops }).map((_, i) => (
                            <Droplet
                              key={i}
                              className={`w-3 h-3 ${
                                isSelected
                                  ? "text-[#D8647F] fill-[#D8647F]"
                                  : "text-[#7D7277] fill-transparent"
                              }`}
                            />
                          ))
                        )}
                      </div>
                      <span className="block text-xs">{item.label}</span>
                      <span className="block text-[10px] text-[#7D7277] mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Chips */}
            <div>
              <label className="block text-xs font-semibold text-[#221B1F] mb-2 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-[#588B76]" />
                Suasana Hati & Emosi
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const isSelected = selectedMoods.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleMood(m.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#EBF4F0] border-[#588B76] text-[#588B76] font-semibold ring-1 ring-[#588B76] shadow-2xs"
                          : "bg-white border-[#EFE9E2] text-[#7D7277] hover:bg-[#FAF6F3]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Physical Symptoms */}
            <div>
              <label className="block text-xs font-semibold text-[#221B1F] mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#8E78A5]" />
                Respons Tubuh & Gejala
              </label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => {
                  const isSelected = selectedSymptoms.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSymptom(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#F2EEF7] border-[#8E78A5] text-[#8E78A5] font-semibold ring-1 ring-[#8E78A5] shadow-2xs"
                          : "bg-white border-[#EFE9E2] text-[#7D7277] hover:bg-[#FAF6F3]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diary Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#221B1F] mb-1.5">
                Catatan Diary Pribadi
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan pengalaman, energi tubuh, atau pola makanmu hari ini..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF6F3] border border-[#EFE9E2] text-xs text-[#221B1F] placeholder:text-[#7D7277]/60 focus:outline-none focus:ring-2 focus:ring-[#D8647F]/40 resize-none transition-all leading-relaxed"
              />
            </div>
          </>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#EFE9E2]">
          {existingLogId ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#7D7277] hover:bg-[#FAF6F3] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#D8647F] hover:bg-[#C5536D] active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
