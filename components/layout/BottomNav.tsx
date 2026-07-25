// components/layout/BottomNav.tsx
export default function BottomNav({
  isRunning,
  activeTab,
  setActiveTab,
  showWidget,
  setShowWidget,
}: {
  isRunning: boolean;
  activeTab: "focus" | "stats" | "theme" | "todos";
  setActiveTab: (tab: "focus" | "stats" | "theme" | "todos") => void;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
}) {
  if (isRunning) return null;

  return (
    <div className="absolute bottom-5 z-10 flex gap-6 px-5 py-2 bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl">
      <button
        onClick={() => {
          setActiveTab("focus");
          setShowWidget(true);
        }}
        className={`flex flex-col items-center transition group ${activeTab === "focus" && showWidget ? "text-white opacity-100" : "text-white/40 hover:text-white/80"}`}
      >
        <svg
          className="w-4 h-4 mb-0.5 group-hover:-translate-y-0.5 transition-transform grayscale"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-[8px] font-bold uppercase tracking-widest">
          Focus
        </span>
      </button>
      <button
        onClick={() => {
          setActiveTab("stats");
          setShowWidget(false);
        }}
        className={`flex flex-col items-center transition group ${activeTab === "stats" ? "text-white opacity-100" : "text-white/40 hover:text-white/80"}`}
      >
        <svg
          className="w-4 h-4 mb-0.5 group-hover:-translate-y-0.5 transition-transform grayscale"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-[8px] font-bold uppercase tracking-widest">
          Stats
        </span>
      </button>
      <button
        onClick={() => {
          setActiveTab("theme");
          setShowWidget(false);
        }}
        className={`flex flex-col items-center transition group ${activeTab === "theme" ? "text-white opacity-100" : "text-white/40 hover:text-white/80"}`}
      >
        <svg
          className="w-4 h-4 mb-0.5 group-hover:-translate-y-0.5 transition-transform grayscale"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h10a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5M7 21V9m0 0l4.5-4.5a2 2 0 012.83 0l1.17 1.17a2 2 0 010 2.83L11 13"
          />
        </svg>
        <span className="text-[8px] font-bold uppercase tracking-widest">
          Theme
        </span>
      </button>
      <button
        onClick={() => {
          setActiveTab("todos");
          setShowWidget(false);
        }}
        className={`flex flex-col items-center transition group ${activeTab === "todos" ? "text-white opacity-100" : "text-white/40 hover:text-white/80"}`}
      >
        <svg
          className="w-4 h-4 mb-0.5 group-hover:-translate-y-0.5 transition-transform grayscale"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <span className="text-[8px] font-bold uppercase tracking-widest">
          Todos
        </span>
      </button>
    </div>
  );
}
