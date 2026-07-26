// components/layout/HeaderWidgets.tsx
import { useState, useRef, useEffect } from "react";
import { tagColors } from "../../lib/constants";
import { Todo } from "../../lib/types";

export default function HeaderWidgets({
  isRunning,
  isPaused,
  hasGuestBanner,
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
  user,
  defaultPfp,
  onUploadPfp,
  onSelectDefaultPfp,
  onSignIn,
  onLogout,
  onDeleteAccount,
  onChangeUsername,
}: any) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayUsername = user
    ? profile?.username || user?.user_metadata?.username || "USER"
    : "GUEST";
  const pfpSrc =
    user && profile?.profile_picture ? profile.profile_picture : defaultPfp;
  const defaultPfpOptions = [
    "/pfp/pfp1.jpg",
    "/pfp/pfp2.jpg",
    "/pfp/pfp3.jpg",
    "/pfp/pfp4.jpg",
    "/pfp/pfp5.jpg",
  ];

  return (
    // On mobile this is a real fixed flex column, so the three zones
    // below stack top-to-bottom and can never overlap. At sm+ it
    // becomes `display: contents` — i.e. invisible to layout — so
    // each child's own `sm:absolute` classes place it in the exact
    // original 3-corner desktop position, untouched.
    <div
      className={`fixed top-0 inset-x-0 z-10 flex flex-col gap-3 px-4 pb-4 ${hasGuestBanner ? "pt-16" : "pt-4"} sm:contents sm:p-0`}
    >
      {/* TOP LEFT: Clock */}
      <div
        className={`relative self-start sm:absolute sm:top-8 sm:left-8 flex flex-col items-start transition-opacity duration-500 group ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="flex items-baseline tracking-tight drop-shadow-md">
          <span className="text-3xl sm:text-4xl font-semibold font-sans text-[#f1e9e9]">
            {clock.time}
          </span>
          <span className="text-xs sm:text-sm font-bold ml-1 text-white/80 uppercase">
            {clock.ampm}
          </span>
        </div>
        <div className="text-xs sm:text-sm tracking-wide text-white/90 mt-0.5 mb-1 sm:mt-1 sm:mb-2 font-medium drop-shadow-md">
          {getFormattedDate(currentTime)}
        </div>
        <div className="w-32 sm:w-48 h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/10 shadow-sm">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${dayProgressPct}%` }}
          ></div>
        </div>

        <div className="absolute top-16 sm:top-20 left-0 w-48 p-3.5 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl z-50">
          <div className="text-sm font-bold text-[#f1e9e9]">
            {Math.floor(dayProgressPct)}% complete
          </div>
          <div className="text-xs text-white/60 mt-1">
            Ending in{" "}
            <span className="font-bold text-white">
              {hoursLeft} hr {minsLeft} mins
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start mt-2 sm:mt-4 drop-shadow-md">
          <span className="text-base sm:text-xl font-bold text-[#f1e9e9] font-mono tracking-tight leading-none">
            {todayHours > 0 ? `${todayHours}h ` : ""}
            {todayMins} min
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white/50 mt-0.5">
            Today's Focus
          </span>
        </div>
      </div>

      {/* TOP MIDDLE: Streak (Scaled Down) */}
      <div
        className={`relative self-center sm:absolute sm:top-8 sm:left-1/2 sm:-translate-x-1/2 flex transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
          <span className="text-xs text-white grayscale">🔥</span>
          <span className="text-[8px] font-bold tracking-widest uppercase text-white/90">
            {currentStreak}d Streak
          </span>
        </div>
      </div>

      {/* TOP RIGHT: Profile and Todos */}
      <div
        className={`relative self-end sm:absolute sm:top-8 sm:right-8 flex flex-col items-end gap-3 transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="relative" ref={menuRef}>
          {user ? (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90 drop-shadow-md">
                {displayUsername}
              </span>
              <img
                src={pfpSrc}
                alt="Profile"
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="bg-white text-black px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest hover:bg-white/80 transition-colors shadow-lg shadow-white/10"
            >
              Sign In
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-3 w-56 max-w-[85vw] bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-3">
                Change Profile Picture
              </h4>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {defaultPfpOptions.map((pfp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectDefaultPfp(pfp);
                      setShowProfileMenu(false);
                    }}
                    className="aspect-square rounded-full overflow-hidden border border-white/10 hover:border-white/80 transition-all hover:scale-110"
                  >
                    <img
                      src={pfp}
                      alt={`pfp${idx + 1}`}
                      className="w-full h-full object-cover opacity-100"
                    />
                  </button>
                ))}
              </div>

              <label className="w-full flex items-center justify-center py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer mb-4">
                Upload Custom
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    onUploadPfp(e);
                    setShowProfileMenu(false);
                  }}
                />
              </label>

              <div className="w-full h-[1px] bg-white/10 mb-3"></div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onChangeUsername();
                }}
                className="w-full text-left py-1 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors mb-2"
              >
                Change Username
              </button>

              <button
                onClick={onLogout}
                className="w-full text-left py-1 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors mb-2"
              >
                Logout
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onDeleteAccount();
                }}
                className="w-full text-left py-1 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Todos Box */}
        <div className="w-56 max-w-[70vw] sm:w-64 sm:max-w-none bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl mt-1">
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
                const progressSeconds = getTodoProgressSeconds(todo);
                const pct = Math.min(
                  100,
                  Math.floor((progressSeconds / 3600 / todo.targetHours) * 100),
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
      </div>
    </div>
  );
}
