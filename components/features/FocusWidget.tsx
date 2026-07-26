// components/features/FocusWidget.tsx
import { tagColors } from "../../lib/constants";

export default function FocusWidget({
  isRunning,
  isPaused,
  selectedTag,
  setSelectedTag,
  sessionTitle,
  setSessionTitle,
  adjustTimer,
  formatRunningTime,
  timeInSeconds,
  mode,
  setMode,
  sessionProgressPct,
  togglePause,
  triggerCompleteFlow,
  showWidget,
  setShowWidget,
  activeTab,
  inputHrs,
  setInputHrs,
  inputMins,
  setInputMins,
  isAddingTag,
  setIsAddingTag,
  tags,
  editingTagIndex,
  setEditingTagIndex,
  handleUpdateTag,
  setTagToDelete,
  newTagInput,
  setNewTagInput,
  handleAddTag,
  handleStart,
}: any) {
  if (!isRunning && (!showWidget || activeTab !== "focus")) return null;

  return (
    <>
      {isRunning ? (
        <div className="z-10 flex flex-col items-center scale-75 sm:scale-90 transition-all duration-500 px-4">
          <div className="mb-6 sm:mb-8">
            <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-white/10 border border-white/20 rounded-full font-bold text-[10px] uppercase tracking-widest backdrop-blur-md text-white/90 shadow-lg max-w-[80vw] truncate">
              {selectedTag || "Untagged"} - {sessionTitle || "Focus Session"}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => adjustTimer(-300)}
              className="text-3xl text-white/40 hover:text-white transition-colors pb-2 active:scale-90 hidden md:block"
            >
              −
            </button>
            <div className="flex flex-col items-center">
              <div className="text-6xl sm:text-8xl md:text-9xl font-bold font-sans tracking-tighter drop-shadow-2xl mb-2 text-[#f1e9e9]">
                {formatRunningTime(timeInSeconds)}
              </div>
              {mode === "pomodoro" ? (
                <div className="flex items-center gap-4 mb-8 w-56 sm:w-80 max-w-[80vw]">
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000 ease-linear"
                      style={{ width: `${sessionProgressPct}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold tracking-wider">
                    {sessionProgressPct}%
                  </span>
                </div>
              ) : (
                <div className="h-10"></div>
              )}
            </div>
            <button
              onClick={() => adjustTimer(300)}
              className="text-4xl text-white/40 hover:text-white transition-colors pb-2 active:scale-90 hidden md:block"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center mt-2">
            <button
              onClick={togglePause}
              className="px-6 py-3 sm:px-10 sm:py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={triggerCompleteFlow}
              className="px-6 py-3 sm:px-10 sm:py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              Complete
            </button>
          </div>
        </div>
      ) : (
        <div className="z-10 flex flex-col items-center p-5 bg-[#111111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-[320px] max-w-[90vw] -translate-y-6 transition-all">
          <div className="w-full flex justify-between items-center mb-4 px-1">
            <button
              onClick={() => setShowWidget(false)}
              className="text-white/50 hover:text-white transition p-1 grayscale"
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
            <h2 className="text-base font-semibold tracking-wide text-[#f1e9e9]">
              {mode === "pomodoro" ? "Pomodoro" : "Stopwatch"}
            </h2>
            <div className="w-4" />
          </div>

          <div className="w-full mb-3 px-1">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session Name (e.g. Coding)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-center font-medium outline-none focus:border-white/40 transition-colors text-white"
            />
          </div>

          {mode === "pomodoro" ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  value={inputHrs}
                  onChange={(e) => setInputHrs(e.target.value.slice(0, 2))}
                  className="w-16 text-5xl font-bold font-sans tracking-tighter text-center bg-black/40 outline-none border border-white/15 rounded-xl focus:border-white/60 transition-colors py-1.5 text-[#f1e9e9]"
                />
                <span className="text-[10px] font-bold tracking-widest text-white/40 mt-1.5">
                  HR
                </span>
              </div>
              <span className="text-3xl font-bold mb-5 text-white/40">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  value={inputMins}
                  onChange={(e) => setInputMins(e.target.value.slice(0, 2))}
                  className="w-16 text-5xl font-bold font-sans tracking-tighter text-center bg-black/40 outline-none border border-white/15 rounded-xl focus:border-white/60 transition-colors py-1.5 text-[#f1e9e9]"
                />
                <span className="text-[10px] font-bold tracking-widest text-white/40 mt-1.5">
                  MIN
                </span>
              </div>
            </div>
          ) : (
            <div className="text-6xl font-bold font-sans tracking-tighter mb-6 py-2 text-[#f1e9e9]">
              00:00
            </div>
          )}

          <div className="w-full mb-5 px-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Tag:
              </span>
              {!isAddingTag && (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-[10px] font-bold text-white/40 hover:text-white"
                >
                  + NEW TAG
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1">
              {tags.length === 0 && !isAddingTag && (
                <span className="text-xs text-white/30 italic py-1">
                  No tags available. Add one.
                </span>
              )}
              {tags.map((t: string, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedTag(selectedTag === t ? "" : t)}
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${selectedTag === t ? "bg-white/20 border-white/40 text-white" : "bg-black/40 border-white/10 text-white/60 hover:border-white/20"}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tagColors[i % tagColors.length] }}
                  ></span>
                  {editingTagIndex === i ? (
                    <input
                      type="text"
                      defaultValue={t}
                      autoFocus
                      onBlur={(e) => handleUpdateTag(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleUpdateTag(i, e.currentTarget.value);
                      }}
                      className="bg-transparent outline-none w-16 text-white"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => setEditingTagIndex(i)}
                      className="truncate max-w-[80px]"
                    >
                      {t}
                    </span>
                  )}
                </div>
              ))}
              {isAddingTag && (
                <div className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 border-white/40 text-xs">
                  <input
                    type="text"
                    placeholder="New..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag();
                    }}
                    autoFocus
                    onBlur={handleAddTag}
                    className="bg-transparent outline-none w-16 text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all text-xs tracking-wider shadow-lg mb-3 active:scale-95"
          >
            Start Session
          </button>
          <div className="text-[10px] text-white/40 tracking-wide text-center">
            {mode === "pomodoro" ? (
              <>
                Not into pomodoro? Try{" "}
                <span
                  onClick={() => setMode("stopwatch")}
                  className="text-white font-semibold cursor-pointer hover:underline"
                >
                  Stopwatch
                </span>
              </>
            ) : (
              <>
                Want a countdown? Switch to{" "}
                <span
                  onClick={() => setMode("pomodoro")}
                  className="text-white font-semibold cursor-pointer hover:underline"
                >
                  Pomodoro
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
