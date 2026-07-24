"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

interface SessionRecord {
  id?: number;
  created_at: string;
  tag_name: string;
  duration_seconds: number;
}

const tagColors = [
  "bg-[#1e3a8a]",
  "bg-[#064e3b]",
  "bg-[#78350f]",
  "bg-[#4c1d95]",
  "bg-[#831843]",
  "bg-[#14532d]",
  "bg-[#312e81]",
];

export default function Home() {
  const [showWidget, setShowWidget] = useState(true);
  const [activeTab, setActiveTab] = useState<"focus" | "stats">("focus");
  const [statsSubTab, setStatsSubTab] = useState<"today" | "general">("today");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly");

  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputHrs, setInputHrs] = useState("00");
  const [inputMins, setInputMins] = useState("25");
  const [timeInSeconds, setTimeInSeconds] = useState(25 * 60);

  const initialTimeRef = useRef(25 * 60);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const [pauseCount, setPauseCount] = useState(0);

  // New confirmation modal state
  const [confirmEnd, setConfirmEnd] = useState<{
    show: boolean;
    elapsed: number;
  } | null>(null);

  const [popupData, setPopupData] = useState<{
    show: boolean;
    durationStr: string;
    pauses: number;
    startTime: string;
    endTime: string;
    isFirstOfDay: boolean;
  } | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("Loading...");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTags();
    fetchSessions();
  }, []);

  const fetchTags = async () => {
    const { data } = await supabase.from("tags").select("name");
    if (data && data.length > 0) {
      const fetched = data.map((t) => t.name);
      setTags(fetched);
      setSelectedTag(fetched[0]);
    } else {
      setSelectedTag("No Tags Yet");
    }
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*");
    if (!error && data) {
      setSessions(data as SessionRecord[]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playSuccessSound = () => {
    try {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      );
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.log("Audio play blocked by browser, ignoring.");
    }
  };

  const executeCompleteSession = async (durationSec: number) => {
    // Feature 1: No session under 5 minutes (300 seconds) is counted
    if (durationSec < 300) {
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    const endTime = new Date();
    const startTime =
      sessionStartTimeRef.current ||
      new Date(endTime.getTime() - durationSec * 1000);

    const todayStr = new Date().toISOString().split("T")[0];
    const todaySessions = sessions.filter(
      (s) => new Date(s.created_at).toISOString().split("T")[0] === todayStr,
    );
    const isFirstOfDay = todaySessions.length === 0;

    const newRecord = {
      tag_name: selectedTag,
      duration_seconds: durationSec,
    };

    const optimisticRecord = {
      ...newRecord,
      created_at: new Date().toISOString(),
    };
    setSessions((prev) => [...prev, optimisticRecord as SessionRecord]);

    await supabase.from("sessions").insert([newRecord]);

    const hrs = Math.floor(durationSec / 3600);
    const mins = Math.floor((durationSec % 3600) / 60);
    const durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    playSuccessSound();
    setPopupData({
      show: true,
      durationStr: durStr,
      pauses: pauseCount,
      startTime: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isFirstOfDay: isFirstOfDay,
    });

    setIsRunning(false);
    setIsPaused(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Don't tick if the confirmation modal is open
    if (isRunning && !isPaused && !confirmEnd?.show) {
      interval = setInterval(() => {
        setTimeInSeconds((prev) => {
          if (mode === "pomodoro") {
            if (prev <= 1) {
              executeCompleteSession(initialTimeRef.current);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, mode, selectedTag, confirmEnd]);

  const handleStart = () => {
    if (mode === "pomodoro") {
      const hrs = parseInt(inputHrs) || 0;
      const mins = parseInt(inputMins) || 0;
      const totalSec = hrs * 3600 + mins * 60;
      setTimeInSeconds(totalSec);
      initialTimeRef.current = totalSec;
    } else {
      setTimeInSeconds(0);
      initialTimeRef.current = 0;
    }
    sessionStartTimeRef.current = new Date();
    setPauseCount(0);
    setIsRunning(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (!isPaused) setPauseCount((p) => p + 1);
    setIsPaused(!isPaused);
  };

  const triggerCompleteFlow = () => {
    if (isRunning) {
      let elapsed = 0;
      if (mode === "pomodoro") {
        elapsed = initialTimeRef.current - timeInSeconds;
      } else {
        elapsed = timeInSeconds;
      }
      setConfirmEnd({ show: true, elapsed });
    }
  };

  const formatRunningTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  const handleAddTag = async () => {
    const newTag = newTagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setSelectedTag(newTag);
      await supabase.from("tags").insert([{ name: newTag }]);
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleUpdateTag = async (index: number, newValue: string) => {
    const updatedName = newValue.trim();
    if (!updatedName) {
      setEditingTagIndex(null);
      return;
    }
    const oldTag = tags[index];
    const newTags = [...tags];
    newTags[index] = updatedName;
    setTags(newTags);
    if (selectedTag === oldTag) setSelectedTag(updatedName);
    setEditingTagIndex(null);
    await supabase
      .from("tags")
      .update({ name: updatedName })
      .eq("name", oldTag);
  };

  const handleDeleteTag = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const tagToDelete = tags[index];
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the "${tagToDelete}" tag?`,
    );
    if (!isConfirmed) return;

    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    if (selectedTag === tagToDelete) {
      setSelectedTag(newTags[0] || "No Tags Yet");
    }
    await supabase.from("tags").delete().eq("name", tagToDelete);
  };

  // --- STATS CALCULATIONS ---
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toISOString().split("T")[0] === todayStr,
  );
  const todayTotalSeconds = todaySessions.reduce(
    (acc, s) => acc + s.duration_seconds,
    0,
  );
  const todayHours = Math.floor(todayTotalSeconds / 3600);
  const todayMins = Math.floor((todayTotalSeconds % 3600) / 60);

  const getTagTime = (tagName: string, filterTodayOnly = true) => {
    const targetSessions = filterTodayOnly ? todaySessions : sessions;
    const totalSec = targetSessions
      .filter((s) => s.tag_name === tagName)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const calculateStreaks = () => {
    if (sessions.length === 0) return { currentStreak: 0, maxStreak: 0 };
    const uniqueDays = Array.from(
      new Set(
        sessions.map((s) => new Date(s.created_at).toISOString().split("T")[0]),
      ),
    ).sort();

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDays.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (currentStreak === 0 && dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    for (let i = 0; i < uniqueDays.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24),
        );
        if (diffDays === 1) tempStreak++;
        else tempStreak = 1;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    }
    return { currentStreak, maxStreak };
  };

  const { currentStreak, maxStreak } = calculateStreaks();

  const generateWeeklyData = () => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayData = weekDays.map((day) => ({
      day,
      tags: {} as Record<string, number>,
      totalSec: 0,
    }));

    sessions.forEach((s) => {
      const d = new Date(s.created_at);
      let dayIndex = d.getDay() - 1;
      if (dayIndex === -1) dayIndex = 6;
      const tag = s.tag_name;
      dayData[dayIndex].tags[tag] =
        (dayData[dayIndex].tags[tag] || 0) + s.duration_seconds;
      dayData[dayIndex].totalSec += s.duration_seconds;
    });

    const maxSec = Math.max(...dayData.map((d) => d.totalSec), 1);
    return { dayData, maxSec };
  };
  const weeklyChart = generateWeeklyData();

  const generateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const activeDays = new Set(
      sessions.map((s) => new Date(s.created_at).getDate()),
    );
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return { days, activeDays };
  };
  const calendar = generateCalendar();

  // Date and Day Progress Formatters
  const getFormattedDate = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;
  };

  const getAmPmTime = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes().toString().padStart(2, "0");
    let seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return { time: `${hours}:${minutes}:${seconds}`, ampm };
  };

  const clock = getAmPmTime(currentTime);
  const dayProgressPct =
    ((currentTime.getHours() * 3600 +
      currentTime.getMinutes() * 60 +
      currentTime.getSeconds()) /
      86400) *
    100;

  return (
    <main className="relative h-screen w-screen flex flex-col items-center justify-center text-white font-sans overflow-hidden select-none">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-[-1]">
        <Image
          src="/bg.jpg"
          alt="Aesthetic Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 transition-all duration-700"></div>
      </div>

      {/* TOP LEFT: Clock, Date & Day Progress */}
      <div
        className={`absolute top-8 left-8 flex flex-col items-start transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="flex items-baseline tracking-tight drop-shadow-md">
          <span className="text-4xl font-semibold font-sans">{clock.time}</span>
          <span className="text-sm font-bold ml-1 text-white/80 uppercase">
            {clock.ampm}
          </span>
        </div>
        <div className="text-sm tracking-wide text-white/90 mt-1 mb-2 font-medium">
          {getFormattedDate(currentTime)}
        </div>
        {/* Day Progress Bar */}
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${dayProgressPct}%` }}
          ></div>
        </div>
      </div>

      {/* TOP RIGHT - Streak & Today's Focus */}
      <div
        className={`absolute top-8 right-8 flex flex-col items-end gap-3 transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-white grayscale">🔥</span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">
            {currentStreak} Day Streak
          </span>
        </div>
        <div className="flex flex-col items-end pr-2">
          <span className="text-2xl font-bold text-white/90 font-mono tracking-tight">
            {todayHours > 0 ? `${todayHours}h ` : ""}
            {todayMins} min
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Today's Focus
          </span>
        </div>
      </div>

      {/* CONFIRM END SESSION POPUP */}
      {confirmEnd && confirmEnd.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-[#111111]/95 border border-white/10 p-8 rounded-3xl shadow-2xl w-[350px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold tracking-wide mb-2 text-white/90">
              End Session?
            </h2>

            <div className="text-5xl font-bold tracking-tighter mb-4 text-white">
              {Math.floor(confirmEnd.elapsed / 60)}
              <span className="text-lg text-white/50 tracking-normal ml-1">
                MIN
              </span>
            </div>

            <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-left text-xs mb-6">
              <span className="text-orange-400 font-bold uppercase tracking-wider mb-2 block text-center">
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
                onClick={() => {
                  setConfirmEnd(null);
                  executeCompleteSession(confirmEnd.elapsed);
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                <span className="mr-2">✔️</span> Yes
              </button>
              <button
                onClick={() => setConfirmEnd(null)}
                className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white/50 hover:text-white"
              >
                <span className="mr-2">❌</span> No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS COMPLETION POPUP */}
      {popupData && popupData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-[#111111]/90 border border-white/10 p-8 rounded-3xl shadow-2xl w-[400px] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            {popupData.isFirstOfDay && (
              <div className="w-full bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                🔥 Daily Streak Updated!
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">Session Saved!</h2>
            <p className="text-sm text-white/60 mb-6">
              Congratulations, you logged{" "}
              <span className="text-white font-bold">
                {popupData.durationStr}
              </span>{" "}
              of focus.
            </p>

            <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 mb-6 text-sm flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-white/40">Subject / Tag</span>
                <span className="font-semibold">{selectedTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Timeframe</span>
                <span className="font-mono">
                  {popupData.startTime} - {popupData.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Interruptions</span>
                <span className="font-mono">{popupData.pauses} pauses</span>
              </div>
            </div>

            <button
              onClick={() => setPopupData(null)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MAIN WIDGET */}
      {isRunning ? (
        <div className="z-10 flex flex-col items-center scale-90 transition-all duration-500">
          <div className="text-8xl md:text-9xl font-bold font-sans tracking-tighter drop-shadow-2xl mb-4">
            {formatRunningTime(timeInSeconds)}
          </div>

          {/* Progress Bar under timer (Only shows for Pomodoro mode) */}
          {mode === "pomodoro" && (
            <div className="w-72 h-1 bg-white/20 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000 ease-linear"
                style={{
                  width: `${100 - (timeInSeconds / initialTimeRef.current) * 100}%`,
                }}
              ></div>
            </div>
          )}
          {mode === "stopwatch" && <div className="h-9"></div> /* Spacer */}

          <div className="flex gap-4 items-center">
            {/* Tag moved down next to buttons */}
            <div className="px-6 py-3.5 bg-black/40 border border-white/10 rounded-full font-bold text-xs uppercase tracking-widest text-white/60">
              {selectedTag}
            </div>

            <button
              onClick={togglePause}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>

            <button
              onClick={triggerCompleteFlow}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              Complete
            </button>
          </div>
        </div>
      ) : (
        showWidget &&
        activeTab === "focus" && (
          <div className="z-10 flex flex-col items-center p-5 bg-[#111111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-[310px] -translate-y-6 transition-all">
            <div className="w-full flex justify-between items-center mb-4 px-1">
              <button
                onClick={() => setShowWidget(false)}
                className="text-white/50 hover:text-white transition p-1 grayscale"
                title="Hide Widget"
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
              <h2 className="text-base font-semibold tracking-wide text-white">
                {mode === "pomodoro" ? "Pomodoro" : "Stopwatch"}
              </h2>
              <div className="w-4" />
            </div>

            {mode === "pomodoro" ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    value={inputHrs}
                    onChange={(e) => setInputHrs(e.target.value.slice(0, 2))}
                    className="w-16 text-5xl font-bold font-sans tracking-tighter text-center bg-black/40 outline-none border border-white/15 rounded-xl focus:border-white/60 transition-colors py-1.5"
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
                    className="w-16 text-5xl font-bold font-sans tracking-tighter text-center bg-black/40 outline-none border border-white/15 rounded-xl focus:border-white/60 transition-colors py-1.5"
                  />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 mt-1.5">
                    MIN
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-6xl font-bold font-sans tracking-tighter mb-6 py-2 text-white/90">
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

              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto">
                {tags.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedTag(t)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${selectedTag === t ? "bg-white/20 border-white/40 text-white" : "bg-black/40 border-white/10 text-white/60 hover:border-white/20"}`}
                  >
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
                    <button
                      onClick={(e) => handleDeleteTag(i, e)}
                      className="text-white/30 hover:text-white ml-1 font-bold"
                    >
                      ×
                    </button>
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
        )
      )}

      {/* STATS MODAL */}
      {activeTab === "stats" && (
        <div className="z-20 flex bg-[#0c0c0e]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[720px] max-w-[92vw] h-[440px] p-6 transition-all -translate-y-4">
          <div className="w-48 border-r border-white/10 pr-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">
                Stats Menu
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setStatsSubTab("today")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statsSubTab === "today" ? "bg-white/10 text-white border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <span className="grayscale">☀️</span> Today
                </button>
                <button
                  onClick={() => setStatsSubTab("general")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statsSubTab === "general" ? "bg-white/10 text-white border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <span className="grayscale">🏠</span> General
                </button>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("focus")}
              className="text-xs text-white/40 hover:text-white transition flex items-center gap-1"
            >
              ← Back to Timer
            </button>
          </div>

          <div className="flex-1 pl-6 overflow-y-auto">
            {statsSubTab === "today" ? (
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Today's Focus <span className="grayscale">☀️</span>
                </h2>
                <p className="text-xs text-white/40 mb-6">
                  Summary of your completed study sessions today.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Total Hours Today
                    </span>
                    <div className="text-3xl font-bold font-mono mt-2 text-white">
                      {todayHours}h {todayMins}m
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Sessions Done
                    </span>
                    <div className="text-3xl font-bold font-mono mt-2 text-white">
                      {todaySessions.length}
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                  Time Per Tag (Today)
                </h3>
                <div className="flex flex-col gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex justify-between items-center bg-black/30 border border-white/5 px-3.5 py-2 rounded-xl text-xs"
                    >
                      <span className="font-medium text-white/80">{tag}</span>
                      <span className="font-mono text-white/50">
                        {getTagTime(tag, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-2xl font-bold">
                    General Stats <span className="grayscale">📊</span>
                  </h2>
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
                <p className="text-xs text-white/40 mb-6">
                  Overall productivity record & streak metrics.
                </p>

                {timeframe === "weekly" ? (
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 text-center">
                      Weekly Tag Distribution
                    </h3>
                    <div className="h-40 flex items-end justify-between gap-3 px-2">
                      {weeklyChart.dayData.map((data) => (
                        <div
                          key={data.day}
                          className="flex flex-col items-center gap-2 flex-1 h-full justify-end"
                        >
                          <div
                            className="w-full flex flex-col justify-end gap-[1px] h-full"
                            style={{
                              height: `${Math.max((data.totalSec / weeklyChart.maxSec) * 100, 5)}%`,
                            }}
                          >
                            {Object.entries(data.tags).map(([t, sec]) => {
                              const tagIndex =
                                tags.indexOf(t) !== -1 ? tags.indexOf(t) : 0;
                              const pct = (sec / data.totalSec) * 100;
                              return (
                                <div
                                  key={t}
                                  className={`w-full ${tagColors[tagIndex % tagColors.length]} rounded-[1px] transition-all hover:opacity-80 relative group`}
                                  style={{
                                    height: `${pct}%`,
                                    minHeight: "4px",
                                  }}
                                >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                    {t}: {Math.floor(sec / 60)}m
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            {data.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4 text-center">
                      Monthly Focus Calendar
                    </h3>
                    <div className="grid grid-cols-7 gap-1.5">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div
                          key={d}
                          className="text-center text-[9px] font-bold text-white/30 uppercase"
                        >
                          {d}
                        </div>
                      ))}
                      {calendar.days.map((day, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-mono
                            ${!day ? "invisible" : calendar.activeDays.has(day) ? "bg-white/20 text-white border border-white/30" : "bg-white/5 text-white/30 border border-white/5"}
                          `}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      {!isRunning && (
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
        </div>
      )}
    </main>
  );
}
