import React from "react";
import { Info } from "lucide-react";

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#79716B] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E0D5]">
        <Info className="w-3.5 h-3.5 text-[#E78895] shrink-0" />
        <span>Perkiraan berdasarkan data yang kamu catat, bukan diagnosis medis.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E0D5] text-xs text-[#79716B] leading-relaxed">
      <Info className="w-4 h-4 text-[#E78895] shrink-0 mt-0.5" />
      <p>
        <strong>Catatan Privasi & Kesehatan:</strong> Lunara dibuat untuk membantu mencatat dan memahami pola siklus berdasarkan data yang kamu masukkan. Informasi dan perkiraan dalam aplikasi bukan diagnosis medis dan tidak menggantikan konsultasi dengan tenaga kesehatan profesional.
      </p>
    </div>
  );
};
