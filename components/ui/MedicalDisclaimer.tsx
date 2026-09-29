import React from "react";
import { Info } from "lucide-react";

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#7A6E75] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#EFE8DE]">
        <Info className="w-3.5 h-3.5 text-[#D8647F] shrink-0" />
        <span>Perkiraan berdasarkan catatan mandirimu, bukan diagnosis medis.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EFE8DE] text-xs text-[#7A6E75] leading-relaxed">
      <Info className="w-4 h-4 text-[#D8647F] shrink-0 mt-0.5" />
      <p>
        <strong className="text-[#221B1F]">Catatan Privasi & Kesehatan:</strong> Lunara dibuat untuk membantu mencatat dan memahami pola siklus berdasarkan data yang kamu masukkan. Informasi dan perkiraan dalam aplikasi bukan diagnosis medis dan tidak menggantikan konsultasi dengan tenaga medis profesional.
      </p>
    </div>
  );
};
