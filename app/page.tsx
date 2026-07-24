"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

interface SessionRecord {
  id?: number;
  created_at: string;
  tag_name: string;
  session_title?: string;
  duration_seconds: number;
}

const tagColors = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

const tagTailwindBg = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export default function Home() {
  const [showWidget, setShowWidget] = useState(true);
  const [activeTab, setActiveTab] = useState<"focus" | "stats">("focus");
  const [statsSubTab, setStatsSubTab] = useState<"today" | "general">("today");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [chartMetric, setChartMetric] = useState<"mins" | "count">("mins");
  const [weekOffset, setWeekOffset] = useState(0);

  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputHrs, setInputHrs] = useState("00");
  const [inputMins, setInputMins] = useState("25");
  const [timeInSeconds, setTimeInSeconds] = useState(25 * 60);

  const [sessionTitle, setSessionTitle] = useState("Focus Session");
  const initialTimeRef = useRef(25 * 60);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const [pauseCount, setPauseCount] = useState(0);

  // Modals
  const [confirmEnd, setConfirmEnd] = useState<{
    show: boolean;
    elapsed: number;
  } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<{
    index: number;
    name: string;
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

  // Soft, Aesthetic Audio Engine — using local files from /public
  const playSound = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play();
    } catch (e) {
      console.log("Audio playback blocked.");
    }
  };

  const playStartSound = () => playSound("/startSound.mp3");
  const playPauseSound = () => playSound("/pauseSound.mp3");
  const playResumeSound = () => playSound("/resumeSound.mp3");
  const playSuccessSound = () => playSound("/successSound.mp3");

  const executeCompleteSession = async (durationSec: number) => {
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
      session_title: sessionTitle || "Focus Session",
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
    playStartSound();
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
    if (!isPaused) {
      setPauseCount((p) => p + 1);
      playPauseSound();
    } else {
      playResumeSound();
    }
    setIsPaused(!isPaused);
  };

  const adjustTimer = (seconds: number) => {
    if (mode !== "pomodoro" || !isRunning) return;
    setTimeInSeconds((prev) => {
      const newTime = prev + seconds;
      if (newTime <= 0) return 1;
      return newTime;
    });
    initialTimeRef.current += seconds;
  };

  const triggerCompleteFlow = () => {
    if (isRunning) {
      let elapsed =
        mode === "pomodoro"
          ? initialTimeRef.current - timeInSeconds
          : timeInSeconds;
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

  const confirmDeleteTag = async () => {
    if (!tagToDelete) return;
    const { index, name } = tagToDelete;
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    if (selectedTag === name) {
      setSelectedTag(newTags[0] || "No Tags Yet");
    }
    setTagToDelete(null);
    await supabase.from("tags").delete().eq("name", name);
  };

  // --- CALCULATIONS & STATS ---
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toISOString().split("T")[0] === todayStr,
  );
  const yesterdaySessions = sessions.filter(
    (s) => new Date(s.created_at).toISOString().split("T")[0] === yesterdayStr,
  );

  const todayTotalSeconds = todaySessions.reduce(
    (acc, s) => acc + s.duration_seconds,
    0,
  );
  const yesterdayTotalSeconds = yesterdaySessions.reduce(
    (acc, s) => acc + s.duration_seconds,
    0,
  );

  const todayHours = Math.floor(todayTotalSeconds / 3600);
  const todayMins = Math.floor((todayTotalSeconds % 3600) / 60);

  const startedDayTime =
    todaySessions.length > 0
      ? new Date(
          new Date(todaySessions[0].created_at).getTime() -
            todaySessions[0].duration_seconds * 1000,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "-";
  const endedDayTime =
    todaySessions.length > 0
      ? new Date(
          todaySessions[todaySessions.length - 1].created_at,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "-";

  // Productivity % compared strictly to yesterday
  const productivityScore =
    yesterdayTotalSeconds === 0
      ? todayTotalSeconds > 0
        ? 100
        : 0
      : Math.min(
          100,
          Math.floor((todayTotalSeconds / yesterdayTotalSeconds) * 100),
        );

  const trendPercent =
    yesterdayTotalSeconds > 0
      ? Math.floor(
          ((todayTotalSeconds - yesterdayTotalSeconds) /
            yesterdayTotalSeconds) *
            100,
        )
      : todayTotalSeconds > 0
        ? 100
        : 0;

  const calculateStreaks = () => {
    if (sessions.length === 0) return { currentStreak: 0 };
    const uniqueDays = Array.from(
      new Set(
        sessions.map((s) => new Date(s.created_at).toISOString().split("T")[0]),
      ),
    ).sort();
    let currentStreak = 0,
      checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDays.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (currentStreak === 0 && dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return { currentStreak };
  };

  const { currentStreak } = calculateStreaks();

  const generateWeeklyData = () => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayData = weekDays.map((day) => ({
      day,
      dateStr: "",
      tags: {} as Record<string, number>,
      totalValue: 0,
    }));

    const curr = new Date();
    const first =
      curr.getDate() -
      curr.getDay() +
      (curr.getDay() === 0 ? -6 : 1) -
      weekOffset * 7;
    const monday = new Date(curr.setDate(first));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dStr = `${dayDate.getDate()} ${dayDate.toLocaleString("default", { month: "short" })}`;
      dayData[i].dateStr = dStr;

      const dateISO = dayDate.toISOString().split("T")[0];
      const daysSessions = sessions.filter(
        (s) => new Date(s.created_at).toISOString().split("T")[0] === dateISO,
      );

      daysSessions.forEach((s) => {
        const value =
          chartMetric === "mins" ? Math.floor(s.duration_seconds / 60) : 1;
        dayData[i].tags[s.tag_name] =
          (dayData[i].tags[s.tag_name] || 0) + value;
        dayData[i].totalValue += value;
      });
    }

    const maxValue = Math.max(...dayData.map((d) => d.totalValue), 1);

    const rangeLabel = `${monday.getDate()} ${monday.toLocaleString("default", { month: "short" })} - ${sunday.getDate()} ${sunday.toLocaleString("default", { month: "short" })}`;

    return { dayData, maxValue, rangeLabel };
  };
  const weeklyChart = generateWeeklyData();

  // Pie Chart Data Generator using CSS Conic Gradients
  const generatePieData = () => {
    const tagTotals: Record<string, number> = {};
    let grandTotal = 0;

    tags.forEach((t) => {
      const sec = sessions
        .filter((s) => s.tag_name === t)
        .reduce((acc, s) => acc + s.duration_seconds, 0);
      const val =
        chartMetric === "mins"
          ? Math.floor(sec / 60)
          : sessions.filter((s) => s.tag_name === t).length;
      tagTotals[t] = val;
      grandTotal += val;
    });

    let cumulativePercent = 0;
    const slices = tags.map((t, index) => {
      const value = tagTotals[t] || 0;
      const percent = grandTotal > 0 ? (value / grandTotal) * 100 : 0;
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += percent;
      const endAngle = (cumulativePercent / 100) * 360;
      return {
        tag: t,
        percent: percent.toFixed(1),
        color: tagColors[index % tagColors.length],
        startAngle,
        endAngle,
      };
    });

    const gradientString = slices
      .filter((s) => parseFloat(s.percent) > 0)
      .map((s) => `${s.color} ${s.startAngle}deg ${s.endAngle}deg`)
      .join(", ");

    return { slices, grandTotal, gradientString };
  };
  const pieData = generatePieData();

  const generateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days };
  };
  const calendar = generateCalendar();

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
  const daySeconds =
    currentTime.getHours() * 3600 +
    currentTime.getMinutes() * 60 +
    currentTime.getSeconds();
  const dayProgressPct = (daySeconds / 86400) * 100;
  const hoursLeft = Math.floor((86400 - daySeconds) / 3600);
  const minsLeft = Math.floor(((86400 - daySeconds) % 3600) / 60);
  const sessionProgressPct =
    mode === "pomodoro"
      ? Math.floor(100 - (timeInSeconds / initialTimeRef.current) * 100)
      : 0;

  // Helper for Session Start/End Formatting
  const formatSessionTimes = (createdAtStr: string, durationSec: number) => {
    const end = new Date(createdAtStr);
    const start = new Date(end.getTime() - durationSec * 1000);
    const format = (d: Date) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${format(start)} - ${format(end)}`;
  };

  return (
    <main className="relative h-screen w-screen flex flex-col items-center justify-center text-white font-sans overflow-hidden select-none">
      {/* Custom Global Scrollbar Style */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>

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

      {/* TOP LEFT: Clock & Tooltip */}
      <div
        className={`absolute top-8 left-8 flex flex-col items-start transition-opacity duration-500 group ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
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
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${dayProgressPct}%` }}
          ></div>
        </div>

        {/* Clean Hover Tooltip */}
        <div className="absolute top-20 left-0 w-48 p-3.5 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl z-50">
          <div className="text-sm font-bold">
            {Math.floor(dayProgressPct)}% complete
          </div>
          <div className="text-xs text-white/60 mt-1">
            Ending in{" "}
            <span className="font-bold text-white">
              {hoursLeft} hr {minsLeft} mins
            </span>
          </div>
        </div>
      </div>

      {/* TOP RIGHT - Streak */}
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

      {/* DELETE TAG CONFIRM MODAL */}
      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-[#111111]/95 border border-white/10 p-8 rounded-3xl shadow-2xl w-[350px] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold tracking-wide mb-2 text-white/90">
              Delete Tag?
            </h2>
            <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-center text-xs mb-6 mt-4">
              <span className="text-white/60 block">
                Are you sure you want to delete the tag
              </span>
              <span className="text-orange-400 font-bold uppercase tracking-wider mt-1 block">
                "{tagToDelete.name}"
              </span>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={confirmDeleteTag}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-red-300"
              >
                Yes
              </button>
              <button
                onClick={() => setTagToDelete(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* SUCCESS POPUP */}
      {popupData && popupData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-[#111111]/90 border border-white/10 p-8 rounded-3xl shadow-2xl w-[400px] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            {popupData.isFirstOfDay && (
              <div className="w-full bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                🔥 Daily Streak Updated!
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">Session Saved! 🎉</h2>
            <p className="text-sm text-white/60 mb-6">
              Logged{" "}
              <span className="text-white font-bold">
                {popupData.durationStr}
              </span>{" "}
              of focus.
            </p>
            <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 mb-6 text-sm flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-white/40">Title</span>
                <span className="font-semibold text-orange-300">
                  {sessionTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Tag</span>
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
          {/* Combined Top Glassmorphism Pill */}
          <div className="mb-8">
            <div className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-full font-bold text-[10px] uppercase tracking-widest backdrop-blur-md text-white/90 shadow-lg">
              {selectedTag} - {sessionTitle || "Focus Session"}
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
              <div className="text-8xl md:text-9xl font-bold font-sans tracking-tighter drop-shadow-2xl mb-2">
                {formatRunningTime(timeInSeconds)}
              </div>

              {mode === "pomodoro" ? (
                <div className="flex items-center gap-4 mb-8 w-80">
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

          <div className="flex gap-4 items-center mt-2">
            <button
              onClick={togglePause}
              className="px-10 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={triggerCompleteFlow}
              className="px-10 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
            >
              Complete
            </button>
          </div>
        </div>
      ) : (
        showWidget &&
        activeTab === "focus" && (
          <div className="z-10 flex flex-col items-center p-5 bg-[#111111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-[320px] -translate-y-6 transition-all">
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
              <h2 className="text-base font-semibold tracking-wide text-white">
                {mode === "pomodoro" ? "Pomodoro" : "Stopwatch"}
              </h2>
              <div className="w-4" />
            </div>

            {/* Editable Session Title */}
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
              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagToDelete({ index: i, name: t });
                      }}
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

      {/* STATS MODAL OVERLAY */}
      {activeTab === "stats" && (
        <div className="z-20 flex bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-[820px] max-w-[95vw] h-[520px] p-6 transition-all -translate-y-2 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-white/10 pr-4 flex flex-col justify-between">
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

          {/* Main Panel Content */}
          <div className="flex-1 pl-6 overflow-y-auto pr-2">
            {statsSubTab === "today" ? (
              /* TODAY'S STATS PANEL */
              <div className="grid grid-cols-2 gap-6 h-full items-start">
                {/* Left Panel */}
                <div className="flex flex-col gap-5 border-r border-white/10 pr-6">
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Focus | {new Date().getDate()}{" "}
                      {new Date().toLocaleString("default", { month: "short" })}{" "}
                      '26
                    </span>
                    <div className="text-5xl font-bold font-sans mt-1">
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
                        todaySessions.map((s, idx) => (
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
                  <h3 className="text-xl font-bold mb-1">Focus Score</h3>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-4">
                    RING
                  </span>

                  {/* Ring SVG */}
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
                        stroke="#ffffff"
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
                      <span className="text-3xl font-bold font-sans">
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

                    {/* Fixed Yesterday Comparison Text */}
                    <span className="text-xs font-mono text-white/60 block mt-2">
                      Focus Time: {todayHours * 60 + todayMins} Min (Yesterday:{" "}
                      {Math.floor(yesterdayTotalSeconds / 60)} Min)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* GENERAL STATS PANEL */
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
                  Overall productivity breakdown and tags ratio analytics.
                </p>

                {timeframe === "weekly" ? (
                  <div className="flex flex-col gap-6">
                    {/* Weekly Stacked Chart */}
                    <div className="bg-[#111115] border border-white/10 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
                          Focus by Tags [Daily]
                        </h3>

                        {/* Toggle injected here */}
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

                      {/* Week Navigation */}
                      <div className="flex items-center justify-between mb-4 px-1">
                        <button
                          onClick={() => setWeekOffset((w) => w + 1)}
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
                            setWeekOffset((w) => Math.max(0, w - 1))
                          }
                          disabled={weekOffset === 0}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 transition active:scale-90 ${weekOffset === 0 ? "text-white/15 cursor-not-allowed" : "text-white/60 hover:text-white hover:border-white/30"}`}
                          aria-label="Next week"
                        >
                          →
                        </button>
                      </div>

                      <div className="h-44 flex items-end justify-between gap-3 px-2 pt-2">
                        {weeklyChart.dayData.map((data, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end"
                          >
                            <div
                              className="w-full flex flex-col justify-end gap-[1px] h-full"
                              style={{
                                height: `${Math.max((data.totalValue / weeklyChart.maxValue) * 100, 5)}%`,
                              }}
                            >
                              {Object.entries(data.tags).map(([t, val]) => {
                                const tagIndex =
                                  tags.indexOf(t) !== -1 ? tags.indexOf(t) : 0;
                                const pct = (val / data.totalValue) * 100;
                                return (
                                  <div
                                    key={t}
                                    className={`w-full ${tagTailwindBg[tagIndex % tagTailwindBg.length]} rounded-[1px] transition-all hover:opacity-80 relative group`}
                                    style={{
                                      height: `${pct}%`,
                                      minHeight: "4px",
                                    }}
                                  >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                      {t}: {val}{" "}
                                      {chartMetric === "mins" ? "m" : ""}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] font-bold text-white/60">
                              {data.day}
                            </span>
                            <span className="text-[8px] text-white/30 -mt-1 font-mono">
                              {data.dateStr}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags Ratio Pie Chart */}
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
                        <div className="flex items-center gap-12 py-2 w-full justify-center">
                          {/* CSS Conic Gradient Pie Chart (Perfect Circle) */}
                          <div
                            className="w-36 h-36 rounded-full shadow-lg"
                            style={{
                              background: `conic-gradient(${pieData.gradientString})`,
                            }}
                          ></div>

                          {/* Legend */}
                          <div className="flex flex-col gap-1.5">
                            {pieData.slices.map((slice, i) => {
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
                  /* Monthly Calendar */
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
                      {calendar.days.map((day, idx) => {
                        if (!day)
                          return (
                            <div
                              key={idx}
                              className="invisible aspect-square"
                            ></div>
                          );

                        const dayDateISO = new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          day,
                        )
                          .toISOString()
                          .split("T")[0];
                        const daySec = sessions
                          .filter(
                            (s) =>
                              new Date(s.created_at)
                                .toISOString()
                                .split("T")[0] === dayDateISO,
                          )
                          .reduce((acc, s) => acc + s.duration_seconds, 0);
                        const dayMins = Math.floor(daySec / 60);

                        return (
                          <div
                            key={idx}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-mono transition-all border
                              ${dayMins > 0 ? "bg-white/20 text-white border-white/30" : "bg-white/5 text-white/30 border-white/5"}
                            `}
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
