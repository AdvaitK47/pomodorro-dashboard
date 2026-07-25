export default function SuccessModal({
  data,
  sessionTitle,
  selectedTag,
  onClose,
}: {
  data: {
    durationStr: string;
    pauses: number;
    startTime: string;
    endTime: string;
    isFirstOfDay: boolean;
  };
  sessionTitle: string;
  selectedTag: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-[#111111]/90 border border-white/10 p-8 rounded-3xl shadow-2xl w-[400px] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        {data.isFirstOfDay && (
          <div className="w-full bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
            🔥 Daily Streak Updated!
          </div>
        )}
        <h2 className="text-2xl font-bold mb-2 text-[#f1e9e9]">
          Session Saved! 🎉
        </h2>
        <p className="text-sm text-white/60 mb-6">
          Logged{" "}
          <span className="text-white font-bold">{data.durationStr}</span> of
          focus.
        </p>
        <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 mb-6 text-sm flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-white/40">Title</span>
            <span className="font-semibold text-[#e491c9]">{sessionTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Tag</span>
            <span className="font-semibold">{selectedTag}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Timeframe</span>
            <span className="font-mono">
              {data.startTime} - {data.endTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Interruptions</span>
            <span className="font-mono">{data.pauses} pauses</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
