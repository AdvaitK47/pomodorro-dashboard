// components/features/ThemePanel.tsx
import Image from "next/image";
import { RefObject, useEffect, useState } from "react";
import { backgrounds, overlayOptions } from "../../lib/constants";
import { OverlayEffect } from "../../lib/types";

export default function ThemePanel({
  setActiveTab,
  setShowWidget,
  selectedBg,
  setSelectedBg,
  useCustomBg,
  setUseCustomBg,
  customBg,
  customBgInputRef,
  handleCustomBgUpload,
  handleRemoveCustomBg,
  overlayEffect,
  setOverlayEffect,
  isGuest = false,
}: {
  setActiveTab: (tab: "focus" | "stats" | "theme" | "todos") => void;
  setShowWidget: (show: boolean) => void;
  selectedBg: number;
  setSelectedBg: (index: number) => void;
  useCustomBg: boolean;
  setUseCustomBg: (use: boolean) => void;
  customBg: string | null;
  customBgInputRef: RefObject<HTMLInputElement>;
  handleCustomBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveCustomBg: () => void;
  overlayEffect: OverlayEffect;
  setOverlayEffect: (effect: OverlayEffect) => void;
  isGuest?: boolean;
}) {
  const [lockMessage, setLockMessage] = useState(false);

  useEffect(() => {
    if (!lockMessage) return;
    const t = setTimeout(() => setLockMessage(false), 2200);
    return () => clearTimeout(t);
  }, [lockMessage]);

  const showLockToast = () => setLockMessage(true);

  return (
    <div className="z-20 flex flex-col bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-full sm:w-[820px] max-w-[95vw] h-[85vh] sm:h-[520px] p-4 sm:p-6 transition-all -translate-y-2 overflow-y-auto relative">
      {/* Sign in to unlock toast */}
      {lockMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2 max-w-[85vw] text-center">
          <span>🔒</span>
          <span>Sign in to unlock this theme</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("focus");
              setShowWidget(false);
            }}
            className="text-white/50 hover:text-white transition p-1 grayscale"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f1e9e9]">
            Theme <span className="grayscale">🎨</span>
          </h2>
        </div>
      </div>
      <p className="text-xs text-white/40 mb-4 sm:mb-6">
        {isGuest
          ? "Sign in to unlock more backgrounds and ambient overlays."
          : "Pick a background and an ambient overlay to set the mood."}
      </p>

      <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
        Background
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {backgrounds.map((bg, i) => {
          const locked = isGuest && i !== 0;
          return (
            <button
              key={i}
              onClick={() => {
                if (locked) {
                  showLockToast();
                  return;
                }
                setSelectedBg(i);
                setUseCustomBg(false);
              }}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                selectedBg === i && !useCustomBg
                  ? "border-white shadow-lg scale-[1.02]"
                  : "border-white/10 hover:border-white/30"
              } ${locked ? "cursor-pointer" : ""}`}
            >
              <Image
                src={bg}
                alt={`Background ${i + 1}`}
                fill
                className={`object-cover ${locked ? "opacity-40 grayscale" : ""}`}
              />
              {selectedBg === i && !useCustomBg && !locked && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}
              {locked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-base drop-shadow">🔒</span>
                </div>
              )}
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Default
                </span>
              )}
            </button>
          );
        })}

        <input
          ref={customBgInputRef}
          type="file"
          accept="image/*"
          onChange={handleCustomBgUpload}
          className="hidden"
        />
        <button
          onClick={() => {
            if (isGuest) {
              showLockToast();
              return;
            }
            if (customBg) {
              setUseCustomBg(true);
            } else {
              customBgInputRef.current?.click();
            }
          }}
          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center ${useCustomBg ? "border-white shadow-lg scale-[1.02]" : "border-white/10 border-dashed hover:border-white/30"} ${customBg ? "" : "bg-black/30"}`}
        >
          {customBg ? (
            <img
              src={customBg}
              alt="Custom background"
              className={`absolute inset-0 w-full h-full object-cover ${isGuest ? "opacity-40 grayscale" : ""}`}
            />
          ) : (
            <span className="text-white/40 text-2xl">
              {isGuest ? "🔒" : "+"}
            </span>
          )}
          {useCustomBg && customBg && !isGuest && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
          )}
          {isGuest && customBg && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-base drop-shadow">🔒</span>
            </div>
          )}
          {customBg && !isGuest && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCustomBg();
              }}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white/70 hover:text-white hover:bg-red-500/60 text-xs font-bold transition"
            >
              ×
            </span>
          )}
          <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            {customBg ? "Custom" : "Upload"}
          </span>
        </button>
      </div>
      {customBg && !isGuest && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 -mt-4 sm:-mt-6 mb-6">
          <button
            onClick={() => customBgInputRef.current?.click()}
            className="text-[10px] text-white/40 hover:text-white transition"
          >
            Replace custom background
          </button>
          <button
            onClick={handleRemoveCustomBg}
            className="text-[10px] text-red-400/70 hover:text-red-400 transition"
          >
            Remove custom background
          </button>
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
        Ambient Overlay
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {overlayOptions.map((opt) => {
          const locked = isGuest && opt.id !== "none";
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (locked) {
                  showLockToast();
                  return;
                }
                setOverlayEffect(opt.id);
              }}
              className={`relative flex flex-col items-center gap-2 py-3 sm:py-4 rounded-xl border transition-all ${
                overlayEffect === opt.id
                  ? "bg-white/15 border-white/40 text-white"
                  : "bg-black/30 border-white/10 text-white/50 hover:border-white/25 hover:text-white/80"
              } ${locked ? "opacity-50" : ""}`}
            >
              {locked && (
                <span className="absolute top-1.5 right-1.5 text-[10px]">
                  🔒
                </span>
              )}
              <span className="text-2xl grayscale-0">{opt.icon}</span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
