"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Droplet, Calendar, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatISODateOnly } from "@/lib/utils";

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onLogSaved?: () => void;
}

const FLOWS = [
  { id: "none", label: "Tidak Ada", desc: "Bersih / Kering" },
  { id: "light", label: "Ringan", desc: "Flek / Sedikit" },
  { id: "medium", label: "Sedang", desc: "Normal" },
  { id: "heavy", label: "Berat", desc: "Banyak" },
] as const;

const MOODS = [
  { id: "senang", label: "Senang", emoji: "😊" },
  { id: "baik", label: "Baik", emoji: "🙂" },
  { id: "netral", label: "Netral", emoji: "😐" },
  { id: "sedih", label: "Sedih", emoji: "😔" },
  { id: "stres", label: "Stres", emoji: "😫" },
  { id: "mudah_marah", label: "Mudah Marah", emoji: "😤" },
  { id: "cemas", label: "Cemas", emoji: "😰" },
  { id: "berenergi", label: "Berenergi", emoji: "✨" },
];

const SYMPTOMS = [
  { id: "kram", label: "Kram" },
  { id: "sakit_kepala", label: "Sakit Kepala" },
  { id: "kembung", label: "Kembung" },
  { id: "jerawat", label: "Jerawat" },
  { id: "nyeri_punggung", label: "Nyeri Punggung" },
  { id: "lelah", label: "Lelah" },
  { id: "mual", label: "Mual" },
  { id: "payudara_sensitif", label: "Payudara Sensitif" },
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
      const res = await fetch(`/api/logs?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setExistingLogId(data.log.id);
          setFlow(data.log.flow || "none");
          setSelectedMoods(Array.isArray(data.log.mood) ? data.log.mood : []);
          setSelectedSymptoms(Array.isArray(data.log.symptoms) ? data.log.symptoms : []);
          setNotes(data.log.notes || "");
        } else {
          setExistingLogId(null);
          setFlow("none");
          setSelectedMoods([]);
          setSelectedSymptoms([]);
          setNotes("");
        }
      }
    } catch {
      setErrorMessage("Gagal memuat data log.");
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

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          date,
          flow,
          mood: selectedMoods,
          symptoms: selectedSymptoms,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan catatan.");
      }

      setSuccessMessage("Catatan berhasil disimpan!");
      setTimeout(() => {
        onLogSaved?.();
        onClose();
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan catatan.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingLogId) return;
    if (!confirm("Hapus catatan harian untuk tanggal ini?")) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      const res = await fetch(`/api/logs/${existingLogId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus catatan.");

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
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Harian" maxWidth="md">
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#2D2727] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E78895]" />
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              fetchLogForDate(e.target.value);
            }}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-sm text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E78895]/40"
          />
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#79716B]">Memuat catatan...</div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-2 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#E78895]" />
                Aliran Darah (Menstruasi)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FLOWS.map((item) => {
                  const isSelected = flow === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFlow(item.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FCEEF1] border-[#E78895] text-[#E78895] font-semibold ring-1 ring-[#E78895]"
                          : "bg-white border-[#E8E0D5] text-[#2D2727] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span className="block text-xs">{item.label}</span>
                      <span className="block text-[10px] text-[#79716B] mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-2">
                Suasana Hati (Mood)
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const isSelected = selectedMoods.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleMood(m.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#EBF4F0] border-[#81B29A] text-[#81B29A] ring-1 ring-[#81B29A]"
                          : "bg-white border-[#E8E0D5] text-[#79716B] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-2">
                Gejala Fisik
              </label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => {
                  const isSelected = selectedSymptoms.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSymptom(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#F1EFF7] border-[#9B8EB9] text-[#9B8EB9] ring-1 ring-[#9B8EB9]"
                          : "bg-white border-[#E8E0D5] text-[#79716B] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2727] mb-1.5">
                Catatan Pribadi (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bagaimana perasaan atau aktivitasmu hari ini?"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] placeholder:text-[#79716B]/60 focus:outline-none focus:ring-2 focus:ring-[#E78895]/40 resize-none"
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

        <div className="flex items-center justify-between pt-3 border-t border-[#F2ECE4]">
          {existingLogId ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#79716B] hover:bg-[#F2ECE4] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#E78895] hover:bg-[#d66d7d] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
