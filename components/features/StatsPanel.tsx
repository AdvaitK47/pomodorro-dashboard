// components/features/StatsPanel.tsx
import { tagColors } from "../../lib/constants";
import { SessionRecord, Todo } from "../../lib/types";
import { toLocalDateStr } from "../../lib/dateUtils";

export default function StatsPanel({
  setActiveTab,
  setShowWidget,
  statsSubTab,
  setStatsSubTab,
  timeframe,
  setTimeframe,
  chartMetric,
  setChartMetric,
  weekOffset,
  setWeekOffset,
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
  todayHours,
  todayMins,
  startedDayTime,
  endedDayTime,
  todaySessions,
  productivityScore,
  trendPercent,
  yesterdayTotalSeconds,
  weeklyChart,
  pieData,
  calendar,
  sessions,
  completedTodos,
  unfinishedTodos,
  todoTagStats,
  formatSessionTimes,
}: any) {
  return (
    <div className="z-20 flex flex-col sm:flex-row bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-full sm:w-[820px] max-w-[95vw] h-[85vh] sm:h-[520px] p-4 sm:p-6 transition-all -translate-y-2 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full sm:w-52 shrink-0 max-h-[38vh] sm:max-h-none border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-5 flex flex-col sm:justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
              Stats Menu
            </h3>
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
          </div>
          <div className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
            <button
              onClick={() => setStatsSubTab("today")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${statsSubTab === "today" ? "bg-white/10 text-white border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <span className="grayscale">☀️</span> Today
            </button>
            <button
              onClick={() => setStatsSubTab("general")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${statsSubTab === "general" ? "bg-white/10 text-white border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <span className="grayscale">🏠</span> General
            </button>
            <button
              onClick={() => setStatsSubTab("todos")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${statsSubTab === "todos" ? "bg-white/10 text-white border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <span className="grayscale">📝</span> Todos
            </button>
          </div>

          {/* Side Tags Manager */}
          <div className="mt-4 sm:mt-8 border-t border-white/10 pt-4 sm:pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Manage Tags
              </h3>
              {!isAddingTag && (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-[9px] font-bold text-white/40 hover:text-white"
                >
                  + NEW
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {tags.map((t: string, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: tagColors[i % tagColors.length],
                      }}
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
                        className="bg-transparent outline-none w-20 text-white"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => setEditingTagIndex(i)}
                        className="cursor-pointer truncate max-w-[80px]"
                      >
                        {t}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setTagToDelete({ index: i, name: t })}
                    className="text-white/30 hover:text-red-400 font-bold ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              {isAddingTag && (
                <div className="flex items-center px-3 py-1.5 rounded-lg border bg-black/40 border-white/40 text-xs">
                  <input
                    type="text"
                    placeholder="Tag name..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag();
                    }}
                    autoFocus
                    onBlur={handleAddTag}
                    className="bg-transparent outline-none w-full text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 pt-4 sm:pt-0 sm:pl-6 overflow-y-auto pr-1 sm:pr-2">
        {statsSubTab === "today" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full items-start">
            {/* Left Panel */}
            <div className="flex flex-col gap-5 sm:border-r border-white/10 sm:pr-6">
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Focus | {new Date().getDate()}{" "}
                  {new Date().toLocaleString("default", { month: "short" })} '
                  {new Date().getFullYear().toString().slice(-2)}
                </span>
                <div className="text-5xl font-bold font-sans mt-1 text-[#f1e9e9]">
                  {todayHours * 60 + todayMins} Min
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-center">
                <div>
                  <span className="text-[9px] text-white/40 uppercase block font-bold">
                    Started Day
                  </span>
                  <span className="text-xs font-bold mt-1 block">
                    {startedDayTime}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block font-bold">
                    Day Ended
                  </span>
                  <span className="text-xs font-bold mt-1 block">
                    {endedDayTime}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block font-bold">
                    Focus Count
                  </span>
                  <span className="text-xs font-bold mt-1 block">
                    {todaySessions.length}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
                  Breakdown by Sessions
                </h4>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {todaySessions.length === 0 ? (
                    <div className="text-xs text-white/30 py-4 text-center">
                      No sessions completed today
                    </div>
                  ) : (
                    [...todaySessions]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime(),
                      )
                      .map((s: SessionRecord, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-white/90">
                              {s.session_title || "Focus Session"}
                            </span>
                            <span className="text-[9px] text-white/40 mt-0.5">
                              {s.tag_name} |{" "}
                              {formatSessionTimes(
                                s.created_at,
                                s.duration_seconds,
                              )}
                            </span>
                          </div>
                          <span className="font-mono text-white/60">
                            {Math.floor(s.duration_seconds / 60)} min
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Focus Score Ring */}
            <div className="flex flex-col items-center justify-center pt-2">
              <h3 className="text-xl font-bold mb-1 text-[#f1e9e9]">
                Focus Score
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-4">
                RING
              </span>
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#e491c9"
                    strokeWidth="8"
                    strokeDasharray="263.89"
                    strokeDashoffset={
                      263.89 - (263.89 * productivityScore) / 100
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-sans text-[#f1e9e9]">
                    {productivityScore}%
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">
                    Productivity
                  </span>
                </div>
              </div>
              <div className="text-center mt-4">
                <span className="text-xs font-semibold">
                  Trending{" "}
                  <span className="text-emerald-400 font-bold">
                    {trendPercent >= 0 ? "up" : "down"} by{" "}
                    {Math.abs(trendPercent)}% ⬆️
                  </span>
                </span>
                <span className="text-[10px] text-white/30 block mt-0.5">
                  compared to yesterday
                </span>
                <span className="text-xs font-mono text-white/60 block mt-2">
                  Focus Time: {todayHours * 60 + todayMins} Min (Yesterday:{" "}
                  {Math.floor(yesterdayTotalSeconds / 60)} Min)
                </span>
              </div>
            </div>
          </div>
        ) : statsSubTab === "general" ? (
          <div>
            <div className="flex flex-wrap gap-2 justify-between items-center mb-1">
              <h2 className="text-2xl font-bold text-[#f1e9e9]">
                General Stats <span className="grayscale">📊</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl text-[10px]">
                  <button
                    onClick={() => setTimeframe("weekly")}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition ${timeframe === "weekly" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeframe("monthly")}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition ${timeframe === "monthly" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/40 mb-6">
              Overall productivity breakdown and tags ratio analytics.
            </p>

            {timeframe === "weekly" ? (
              <div className="flex flex-col gap-6">
                <div className="bg-[#111115] border border-white/10 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Focus by Tags [Daily]
                    </h3>
                    <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg text-[9px]">
                      <button
                        onClick={() => setChartMetric("mins")}
                        className={`px-2 py-0.5 rounded font-bold transition ${chartMetric === "mins" ? "bg-white/20 text-white" : "text-white/40"}`}
                      >
                        Duration [Mins]
                      </button>
                      <button
                        onClick={() => setChartMetric("count")}
                        className={`px-2 py-0.5 rounded font-bold transition ${chartMetric === "count" ? "bg-white/20 text-white" : "text-white/40"}`}
                      >
                        Session Count
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <button
                      onClick={() => setWeekOffset((w: number) => w + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition active:scale-90"
                      aria-label="Previous week"
                    >
                      ←
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-white/80 font-mono">
                        {weeklyChart.rangeLabel}
                      </span>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                        {weekOffset === 0
                          ? "This Week"
                          : weekOffset === 1
                            ? "Last Week"
                            : `${weekOffset} Weeks Ago`}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setWeekOffset((w: number) => Math.max(0, w - 1))
                      }
                      disabled={weekOffset === 0}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 transition active:scale-90 ${weekOffset === 0 ? "text-white/15 cursor-not-allowed" : "text-white/60 hover:text-white hover:border-white/30"}`}
                      aria-label="Next week"
                    >
                      →
                    </button>
                  </div>

                  {/* Chart Container */}
                  <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 px-2 pt-8 overflow-x-auto border-b border-white/10 pb-2">
                    {weeklyChart.dayData.map((data: any, idx: number) => {
                      const heightPct =
                        weeklyChart.maxValue > 0
                          ? Math.min(
                              70,
                              Math.max(
                                8,
                                (data.totalValue / weeklyChart.maxValue) * 70,
                              ),
                            )
                          : 0;

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1.5 flex-1 min-w-[28px] h-full justify-end relative"
                        >
                          <div
                            className="w-full max-w-[32px] flex flex-col justify-end gap-[1px] rounded-t-lg overflow-hidden shadow-lg relative"
                            style={{
                              height: `${heightPct}%`,
                              minHeight: data.totalValue > 0 ? "16px" : "4px",
                            }}
                          >
                            {Object.entries(data.tags).map(([t, val]: any) => {
                              const tagIndex = tags.indexOf(t);
                              const tagColor =
                                t === "Untagged"
                                  ? "#9ca3af"
                                  : tagIndex !== -1
                                    ? tagColors[tagIndex % tagColors.length]
                                    : "#9ca3af";

                              const pct = (val / data.totalValue) * 100;
                              return (
                                <div
                                  key={t}
                                  className="w-full transition-all relative flex items-center justify-center overflow-hidden"
                                  style={{
                                    height: `${pct}%`,
                                    minHeight: "14px",
                                    backgroundColor: tagColor,
                                  }}
                                >
                                  {val > 0 && (
                                    <span className="text-[8px] font-mono text-black font-bold whitespace-nowrap px-0.5">
                                      {val}
                                      {chartMetric === "mins" ? "m" : ""}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] font-bold text-white/60 mt-2">
                            {data.day}
                          </span>
                          <span className="text-[8px] text-white/30 -mt-1 font-mono">
                            {data.dateStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#111115] border border-white/10 rounded-2xl p-5 flex flex-col items-center">
                  <div className="flex justify-between items-center w-full mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Tags Ratio Breakdown
                    </h3>
                    <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg text-[9px]">
                      <button
                        onClick={() => setChartMetric("mins")}
                        className={`px-2 py-0.5 rounded font-bold transition ${chartMetric === "mins" ? "bg-white/20 text-white" : "text-white/40"}`}
                      >
                        Duration [Mins]
                      </button>
                      <button
                        onClick={() => setChartMetric("count")}
                        className={`px-2 py-0.5 rounded font-bold transition ${chartMetric === "count" ? "bg-white/20 text-white" : "text-white/40"}`}
                      >
                        Session Count
                      </button>
                    </div>
                  </div>
                  {pieData.grandTotal === 0 ? (
                    <div className="py-8 text-xs text-white/30">
                      No session data logged yet for pie chart
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-12 py-2 w-full justify-center">
                      <div
                        className="w-36 h-36 rounded-full shadow-lg"
                        style={{
                          background: `conic-gradient(${pieData.gradientString})`,
                        }}
                      ></div>
                      <div className="flex flex-col gap-1.5">
                        {pieData.slices.map((slice: any, i: number) => {
                          if (parseFloat(slice.percent) === 0) return null;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span
                                className="w-3 h-3 rounded-full shadow-md"
                                style={{ backgroundColor: slice.color }}
                              ></span>
                              <span className="text-white/80 font-medium">
                                {slice.tag}:
                              </span>
                              <span className="font-mono text-white/40">
                                {slice.percent}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 text-center">
                  Monthly Focus Calendar
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                      key={d}
                      className="text-center text-[9px] font-bold text-white/30 uppercase"
                    >
                      {d}
                    </div>
                  ))}
                  {calendar.days.map((day: number | null, idx: number) => {
                    if (!day)
                      return (
                        <div
                          key={idx}
                          className="invisible aspect-square"
                        ></div>
                      );
                    const dayDateStr = toLocalDateStr(
                      new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        day,
                      ),
                    );
                    const daySec = sessions
                      .filter(
                        (s: SessionRecord) =>
                          toLocalDateStr(new Date(s.created_at)) === dayDateStr,
                      )
                      .reduce(
                        (acc: number, s: SessionRecord) =>
                          acc + s.duration_seconds,
                        0,
                      );
                    const dayMins = Math.floor(daySec / 60);
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-mono transition-all border ${dayMins > 0 ? "bg-white/20 text-white border-white/30" : "bg-white/5 text-white/30 border-white/5"}`}
                      >
                        <span className="font-bold">{day}</span>
                        {dayMins > 0 && (
                          <span className="text-[8px] opacity-60 font-sans mt-0.5">
                            {dayMins}m
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-1 text-[#f1e9e9]">
              Todos Overview <span className="grayscale">📝</span>
            </h2>
            <p className="text-xs text-white/40 mb-6">
              What's done, what's pending, and how it breaks down by tag.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#111115] border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/80 mb-3">
                  ✓ Completed ({completedTodos.length})
                </h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {completedTodos.length === 0 ? (
                    <div className="text-xs text-white/30 py-4 text-center">
                      Nothing completed yet
                    </div>
                  ) : (
                    completedTodos.map((t: Todo) => {
                      const tagIdx = tags.indexOf(t.tag);
                      return (
                        <div
                          key={t.id}
                          className="flex justify-between items-center bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  tagColors[
                                    (tagIdx !== -1 ? tagIdx : 0) %
                                      tagColors.length
                                  ],
                              }}
                            ></span>
                            <span className="text-white/70 line-through truncate">
                              {t.name}
                            </span>
                          </div>
                          <span className="text-white/40 font-mono shrink-0 ml-2">
                            {t.scheduledDate}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="bg-[#111115] border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-3">
                  ⏳ Unfinished ({unfinishedTodos.length})
                </h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {unfinishedTodos.length === 0 ? (
                    <div className="text-xs text-white/30 py-4 text-center">
                      All caught up!
                    </div>
                  ) : (
                    unfinishedTodos.map((t: Todo) => {
                      const tagIdx = tags.indexOf(t.tag);
                      return (
                        <div
                          key={t.id}
                          className="flex justify-between items-center bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  tagColors[
                                    (tagIdx !== -1 ? tagIdx : 0) %
                                      tagColors.length
                                  ],
                              }}
                            ></span>
                            <span className="text-white/80 truncate">
                              {t.name}
                            </span>
                          </div>
                          <span className="text-white/40 font-mono shrink-0 ml-2">
                            {toLocalDateStr(new Date()) === t.scheduledDate
                              ? "Today"
                              : t.scheduledDate}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="bg-[#111115] border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
                Analytics by Tag
              </h3>
              {todoTagStats.length === 0 ? (
                <div className="text-xs text-white/30 py-4 text-center">
                  No todos yet
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {todoTagStats.map((stat: any) => {
                    const pct =
                      stat.totalTarget > 0
                        ? Math.min(
                            100,
                            Math.floor(
                              (stat.totalDone / stat.totalTarget) * 100,
                            ),
                          )
                        : 0;
                    return (
                      <div key={stat.tag}>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: stat.color }}
                            ></span>
                            <span className="text-white/80">{stat.tag}</span>
                          </div>
                          <span className="text-white/40 font-mono">
                            {stat.completedCount}/{stat.totalCount} done ·{" "}
                            {stat.totalDone.toFixed(1)}h / {stat.totalTarget}h
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: stat.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
