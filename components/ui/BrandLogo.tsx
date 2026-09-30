import React from "react";
import { Moon } from "lucide-react";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  badge?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  withText = false,
  badge,
  className = "",
}) => {
  const sizeMap = {
    sm: {
      box: "w-8 h-8 rounded-xl shadow-xs",
      icon: "w-4 h-4",
      text: "text-base",
      badge: "text-[9px] px-1.5 py-0.5",
    },
    md: {
      box: "w-10 h-10 rounded-2xl shadow-sm",
      icon: "w-5 h-5",
      text: "text-xl",
      badge: "text-[10px] px-2 py-0.5",
    },
    lg: {
      box: "w-12 h-12 rounded-2xl shadow-md",
      icon: "w-6 h-6",
      text: "text-2xl",
      badge: "text-[11px] px-2.5 py-0.5",
    },
    xl: {
      box: "w-16 h-16 rounded-3xl shadow-lg",
      icon: "w-8 h-8",
      text: "text-3xl",
      badge: "text-xs px-3 py-1",
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Squircle Box with exact luxury rose gradient matching screenshot */}
      <div
        className={`${sizeMap.box} bg-gradient-to-br from-[#F292A7] via-[#E2748F] to-[#D35773] flex items-center justify-center text-white shadow-[#D8647F]/25 flex-shrink-0 transition-transform`}
        style={{
          boxShadow: "0 6px 16px -2px rgba(216, 100, 127, 0.35)",
        }}
      >
        <Moon
          className={`${sizeMap.icon} fill-white text-white`}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </div>

      {withText && (
        <div className="flex items-center gap-2">
          <span className={`font-editorial font-normal ${sizeMap.text} text-[#221B1F] tracking-tight leading-none`}>
            Lunara
          </span>
          {badge && (
            <span
              className={`font-semibold tracking-wider rounded-full bg-[#FAF0F2] text-[#D8647F] border border-[#D8647F]/15 uppercase ${sizeMap.badge}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
