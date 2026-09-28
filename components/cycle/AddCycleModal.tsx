"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle } from "lucide-react";
import { formatISODateOnly } from "@/lib/utils";

interface AddCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCycleAdded?: () => void;
}

export const AddCycleModal: React.FC<AddCycleModalProps> = ({
  isOpen,
  onClose,
  onCycleAdded,
}) => {
  const [startDate, setStartDate] = useState<string>(formatISODateOnly(new Date()));
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": "true" },
        body: JSON.stringify({
          startDate,
          endDate: endDate || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan siklus.");
      }

      onCycleAdded?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan siklus.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Siklus Menstruasi" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#2D2727] mb-1">
            Tanggal Mulai Menstruasi (Wajib)
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-sm text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E78895]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2D2727] mb-1">
            Tanggal Selesai (Opsional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-sm text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E78895]/40"
          />
          <p className="text-[11px] text-[#79716B] mt-1">
            Biarkan kosong jika menstruasi saat ini masih berlangsung.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2D2727] mb-1">
            Catatan Siklus
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan tambahan mengenai siklus ini..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#2D2727] focus:outline-none focus:ring-2 focus:ring-[#E78895]/40 resize-none"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2ECE4]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#79716B] hover:bg-[#F2ECE4] rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#E78895] hover:bg-[#d66d7d] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Siklus"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
