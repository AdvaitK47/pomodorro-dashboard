import { useState } from "react";
import Image from "next/image";
import { tagColors } from "../../lib/constants";
import { Todo } from "../../lib/types";

export default function HeaderWidgets({
  isRunning,
  isPaused,
  clock,
  currentTime,
  dayProgressPct,
  hoursLeft,
  minsLeft,
  todayHours,
  todayMins,
  currentStreak,
  todayTodos,
  tags,
  getTodoProgressSeconds,
  getFormattedDate,
  profile,
  onLogout,
}: any) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      {/* TOP LEFT: Clock + Today's Focus */}
      <div
        className={`absolute top-8 left-8 flex flex-col items-start transition-opacity duration-500 group ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="flex items-baseline tracking-tight drop-shadow-md">
          <span className="text-4xl font-semibold font-sans text-[#f1e9e9]">
            {clock.time}
          </span>
          <span className="text-sm font-bold ml-1 text-white/80 uppercase">
            {clock.ampm}
          </span>
        </div>
        <div className="text-sm tracking-wide text-white/90 mt-1 mb-2 font-medium">
          {getFormattedDate(currentTime)}
        </div>
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${dayProgressPct}%` }}
          ></div>
        </div>
        <div className="flex flex-col items-start mt-4">
          <span className="text-xl font-bold text-[#f1e9e9] font-mono tracking-tight leading-none">
            {todayHours > 0 ? `${todayHours}h ` : ""}
            {todayMins} min
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 mt-0.5">
            Today's Focus
          </span>
        </div>
      </div>

      {/* TOP RIGHT - Streak & Profile Dropdown */}
      <div
        className={`absolute top-8 right-8 flex gap-4 items-start transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        {/* Today's Todos box */}
        <div className="w-56 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2 flex justify-between">
            <span>Today's Todos</span>
            <span>{todayTodos.length}</span>
          </h3>
          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
            {todayTodos.length === 0 ? (
              <span className="text-[10px] text-white/30 italic">
                No tasks scheduled.
              </span>
            ) : (
              todayTodos.map((todo: Todo) => {
                const pct = Math.min(
                  100,
                  Math.floor(
                    (getTodoProgressSeconds(todo) / 3600 / todo.targetHours) *
                      100,
                  ),
                );
                const done = pct >= 100;
                const tagIdx = tags.indexOf(todo.tag);
                return (
                  <div key={todo.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              tagColors[
                                (tagIdx !== -1 ? tagIdx : 0) % tagColors.length
                              ],
                          }}
                        ></span>
                        <span
                          className={`truncate ${done ? "text-white/40 line-through" : "text-white/80"}`}
                        >
                          {todo.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 font-mono ${done ? "text-emerald-400" : "text-white/40"}`}
                      >
                        {done ? "✓" : `${pct}%`}
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-black/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${done ? "bg-emerald-400" : "bg-white"}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Details & Streak */}
        <div className="relative">
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-black/40 pl-4 pr-1 py-1 rounded-full border border-white/10 backdrop-blur-md cursor-pointer hover:bg-black/60 transition"
          >
            <span className="text-xs text-white grayscale">🔥</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">
              {currentStreak} <span className="text-white/30 px-1">|</span>{" "}
              {profile?.username || "User"}
            </span>
            <img
              src={profile?.profile_picture || "/default-avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full bg-white/10 object-cover"
            />
          </div>

          {/* Logout Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-32 bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <button
                onClick={onLogout}
                className="w-full px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition text-left"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
