export default function EndSessionModal({
  elapsed,
  onConfirm,
  onCancel,
}: {
  elapsed: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-[#111111]/95 border border-white/10 p-8 rounded-3xl shadow-2xl w-[350px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold tracking-wide mb-2 text-[#f1e9e9]">
          End Session?
        </h2>
        <div className="text-5xl font-bold tracking-tighter mb-4 text-[#f1e9e9]">
          {Math.floor(elapsed / 60)}
          <span className="text-lg text-white/50 tracking-normal ml-1">
            MIN
          </span>
        </div>
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-left text-xs mb-6">
          <span className="text-[#e491c9] font-bold uppercase tracking-wider mb-2 block text-center">
            Warning
          </span>
          <ul className="list-disc pl-4 text-white/60 space-y-1">
            <li>
              Sessions shorter than{" "}
              <span className="text-white underline">5 mins</span> won't be
              saved to your stats.
            </li>
          </ul>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            <span className="mr-2">✔️</span> Yes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white/50 hover:text-white"
          >
            <span className="mr-2">❌</span> No
          </button>
        </div>
      </div>
    </div>
  );
}
