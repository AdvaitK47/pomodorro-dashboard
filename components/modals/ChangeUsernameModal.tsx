// components/modals/ChangeUsernameModal.tsx
"use client";

import { useState } from "react";

export default function ChangeUsernameModal({
  currentUsername,
  onConfirm,
  onCancel,
}: {
  currentUsername: string;
  onConfirm: (newUsername: string) => void;
  onCancel: () => void;
}) {
  const [newUsername, setNewUsername] = useState(currentUsername);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-[#111111]/95 border border-white/10 p-8 rounded-3xl shadow-2xl w-[350px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold tracking-wide mb-6 text-[#f1e9e9]">
          Change Username
        </h2>

        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="New Username"
          autoFocus
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors text-white mb-6 text-center"
        />

        <div className="flex gap-3 w-full">
          <button
            onClick={() => onConfirm(newUsername)}
            disabled={!newUsername.trim() || newUsername === currentUsername}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white/50 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
