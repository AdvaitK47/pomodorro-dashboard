// components/features/SupportButton.tsx
"use client";

import { useRef, useState, useEffect } from "react";

const UPI_ID = "7977646567@upi";
const PAYEE_NAME = "Dream Desk by Advait Kurle";

// No amount is included on purpose — leaving "am" out lets the donor
// choose how much to send inside their own UPI app.
const UPI_URI = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR`;

// Free, no-signup QR generation — just renders the UPI URI as an image.
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(UPI_URI)}`;

export default function SupportButton({
  isRunning,
  isPaused,
}: {
  isRunning: boolean;
  isPaused: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };

  return (
    <div
      ref={cardRef}
      className={`absolute bottom-20 sm:bottom-8 left-4 sm:left-8 z-10 transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
    >
      {open && (
        <div className="absolute bottom-full left-0 mb-3 w-60 max-w-[85vw] bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h4 className="text-xs font-bold text-[#f1e9e9] mb-1">
            Support Dream Desk
          </h4>
          <p className="text-[10px] text-white/40 mb-3">
            Any amount helps — scan or pay directly via UPI.
          </p>

          <div className="w-full flex justify-center mb-3">
            <img
              src={QR_SRC}
              alt="UPI QR code"
              className="w-32 h-32 rounded-lg bg-white p-1.5"
            />
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 mb-3 text-[10px] text-white/70 hover:border-white/30 transition-colors"
          >
            <span className="truncate">{UPI_ID}</span>
            <span className="shrink-0 font-bold text-white/50">
              {copied ? "Copied ✓" : "Copy"}
            </span>
          </button>

          <a
            href={UPI_URI}
            className="w-full flex items-center justify-center py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Pay via UPI App
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 shadow-xl hover:bg-black/60 transition-colors"
      >
        <span className="text-sm grayscale-0">❤️</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
          Support
        </span>
      </button>
    </div>
  );
}
