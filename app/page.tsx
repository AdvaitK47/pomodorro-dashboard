"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { SessionRecord, OverlayEffect, Todo } from "../lib/types";
import { tagColors, backgrounds, overlayOptions } from "../lib/constants";
import ParticleOverlay from "../components/ui/ParticleOverlay";
import GlassDatePicker from "../components/ui/GlassDatePicker";
import DeleteTagModal from "../components/modals/DeleteTagModal";
import DeleteTodoModal from "../components/modals/DeleteTodoModal";
import EndSessionModal from "../components/modals/EndSessionModal";
import SuccessModal from "../components/modals/SuccessModal";
import ThemePanel from "../components/features/ThemePanel";
import BottomNav from "../components/layout/BottomNav";
import FocusWidget from "../components/features/FocusWidget";
import TodosPanel from "../components/features/TodosPanel";
import StatsPanel from "../components/features/StatsPanel";
import HeaderWidgets from "../components/layout/HeaderWidgets";

export default function Home() {
  const router = useRouter();

  // --- AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- UI STATE ---
  const [showWidget, setShowWidget] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "focus" | "stats" | "theme" | "todos"
  >("focus");
  const [selectedBg, setSelectedBg] = useState(0);
  const [useCustomBg, setUseCustomBg] = useState(false);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null!);
  const [overlayEffect, setOverlayEffect] = useState<OverlayEffect>("none");

  // --- TODOS STATE ---
  const todayStr = new Date().toISOString().split("T")[0];
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoName, setTodoName] = useState("");
  const [todoTag, setTodoTag] = useState("");
  const [todoHours, setTodoHours] = useState("1");
  const [todoDate, setTodoDate] = useState(todayStr);

  // --- STATS STATE ---
  const [statsSubTab, setStatsSubTab] = useState<"today" | "general" | "todos">(
    "today",
  );
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [chartMetric, setChartMetric] = useState<"mins" | "count">("mins");
  const [weekOffset, setWeekOffset] = useState(0);

  // --- FOCUS STATE ---
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

  // --- MODALS STATE ---
  const [confirmEnd, setConfirmEnd] = useState<{
    show: boolean;
    elapsed: number;
  } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [popupData, setPopupData] = useState<{
    show: boolean;
    durationStr: string;
    pauses: number;
    startTime: string;
    endTime: string;
    isFirstOfDay: boolean;
  } | null>(null);

  // --- DATA STATE ---
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("Loading...");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- AUTH CHECK & DATA FETCHING ---
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Fetch User's Tags and Sessions (RLS protects this automatically, but now we have a user)
      fetchTags();
      fetchSessions();
      setLoadingAuth(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchTags = async () => {
    const { data } = await supabase.from("tags").select("name");
    if (data && data.length > 0) {
      const fetched = data.map((t) => t.name);
      setTags(fetched);
      setSelectedTag(fetched[0]);
    } else {
      setTags([]);
      setSelectedTag("No Tags Yet");
    }
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*");
    if (!error && data) {
      setSessions(data as SessionRecord[]);
    }
  };

  // --- DB INSERTS (Updated to include user_id) ---
  const handleAddTag = async () => {
    const newTag = newTagInput.trim();
    if (newTag && !tags.includes(newTag) && user) {
      setTags([...tags, newTag]);
      if (tags.length === 0) setSelectedTag(newTag);
      // Explicitly insert user_id for RLS policies
      await supabase.from("tags").insert([{ name: newTag, user_id: user.id }]);
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const executeCompleteSession = async (durationSec: number) => {
    if (durationSec < 300 || !user) {
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    const endTime = new Date();
    const startTime =
      sessionStartTimeRef.current ||
      new Date(endTime.getTime() - durationSec * 1000);
    const todaySessions = sessions.filter(
      (s) => new Date(s.created_at).toISOString().split("T")[0] === todayStr,
    );
    const isFirstOfDay = todaySessions.length === 0;

    const newRecord = {
      user_id: user.id, // Explicitly insert user_id for RLS policies
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
      isFirstOfDay: isFirstOfDay,
      startTime: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setIsRunning(false);
    setIsPaused(false);
  };

  // --- REMAINDER OF EXISTING LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      .eq("name", oldTag)
      .eq("user_id", user.id);
  };

  const confirmDeleteTag = async () => {
    if (!tagToDelete) return;
    const { index, name } = tagToDelete;
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    if (selectedTag === name) setSelectedTag(newTags[0] || "No Tags Yet");
    setTagToDelete(null);
    await supabase
      .from("tags")
      .delete()
      .eq("name", name)
      .eq("user_id", user.id);
  };

  const handleAddTodo = () => {
    const name = todoName.trim();
    const hrs = parseFloat(todoHours);
    if (!name || !todoTag || !hrs || hrs <= 0) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      name,
      tag: todoTag,
      targetHours: hrs,
      scheduledDate: todoDate,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
    setTodoName("");
    setTodoHours("1");
  };

  const handleDeleteTodo = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));
  const confirmDeleteTodo = () => {
    if (!todoToDelete) return;
    handleDeleteTodo(todoToDelete.id);
    setTodoToDelete(null);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBg(reader.result as string);
      setUseCustomBg(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveCustomBg = () => {
    setCustomBg(null);
    setUseCustomBg(false);
    setSelectedBg(0);
  };

  const getTodoProgressSeconds = (todo: Todo) => {
    return sessions
      .filter(
        (s) =>
          s.tag_name === todo.tag &&
          new Date(s.created_at).toISOString().split("T")[0] ===
            todo.scheduledDate,
      )
      .reduce((acc, s) => acc + s.duration_seconds, 0);
  };

  // LOCAL STORAGE EFFECTS
  useEffect(() => {
    try {
      localStorage.setItem("pomodoro-bg", selectedBg.toString());
    } catch (e) {}
  }, [selectedBg]);
  useEffect(() => {
    try {
      localStorage.setItem("pomodoro-overlay", overlayEffect);
    } catch (e) {}
  }, [overlayEffect]);
  useEffect(() => {
    try {
      if (customBg) localStorage.setItem("pomodoro-custom-bg", customBg);
      localStorage.setItem("pomodoro-use-custom-bg", useCustomBg.toString());
    } catch (e) {}
  }, [customBg, useCustomBg]);
  useEffect(() => {
    try {
      localStorage.setItem("pomodoro-todos", JSON.stringify(todos));
    } catch (e) {}
  }, [todos]);
  useEffect(() => {
    if (!todoTag && tags.length > 0) setTodoTag(tags[0]);
  }, [tags, todoTag]);

  // CALCS
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
      dayData[i].dateStr =
        `${dayDate.getDate()} ${dayDate.toLocaleString("default", { month: "short" })}`;
      const daysSessions = sessions.filter(
        (s) =>
          new Date(s.created_at).toISOString().split("T")[0] ===
          dayDate.toISOString().split("T")[0],
      );
      daysSessions.forEach((s) => {
        const value =
          chartMetric === "mins" ? Math.floor(s.duration_seconds / 60) : 1;
        dayData[i].tags[s.tag_name] =
          (dayData[i].tags[s.tag_name] || 0) + value;
        dayData[i].totalValue += value;
      });
    }
    return {
      dayData,
      maxValue: Math.max(...dayData.map((d) => d.totalValue), 1),
      rangeLabel: `${monday.getDate()} ${monday.toLocaleString("default", { month: "short" })} - ${sunday.getDate()} ${sunday.toLocaleString("default", { month: "short" })}`,
    };
  };
  const weeklyChart = generateWeeklyData();
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
      return {
        tag: t,
        percent: percent.toFixed(1),
        color: tagColors[index % tagColors.length],
        startAngle,
        endAngle: (cumulativePercent / 100) * 360,
      };
    });
    return {
      slices,
      grandTotal,
      gradientString: slices
        .filter((s) => parseFloat(s.percent) > 0)
        .map((s) => `${s.color} ${s.startAngle}deg ${s.endAngle}deg`)
        .join(", "),
    };
  };
  const pieData = generatePieData();
  const generateCalendar = () => {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const firstDayIndex = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getDay();
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
    let hours = date.getHours(),
      minutes = date.getMinutes().toString().padStart(2, "0"),
      seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    return { time: `${hours % 12 || 12}:${minutes}:${seconds}`, ampm };
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
  const formatSessionTimes = (createdAtStr: string, durationSec: number) => {
    const end = new Date(createdAtStr);
    const start = new Date(end.getTime() - durationSec * 1000);
    const format = (d: Date) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${format(start)} - ${format(end)}`;
  };
  const todayTodos = todos.filter((t) => t.scheduledDate === todayStr);
  const addDaysStr = (base: string, days: number) => {
    const [y, m, d] = base.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
  };
  const weekEndStr = addDaysStr(todayStr, 7);
  const upcomingWeekTodos = todos
    .filter((t) => t.scheduledDate > todayStr && t.scheduledDate <= weekEndStr)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const laterTodos = todos
    .filter((t) => t.scheduledDate > weekEndStr)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const pastTodos = todos
    .filter((t) => t.scheduledDate < todayStr)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  const isTodoDone = (todo: Todo) =>
    getTodoProgressSeconds(todo) / 3600 >= todo.targetHours;
  const completedTodos = todos.filter(isTodoDone);
  const unfinishedTodos = todos.filter((t) => !isTodoDone(t));
  const todoTagStats = tags
    .map((t, i) => {
      const tagTodos = todos.filter((td) => td.tag === t);
      if (tagTodos.length === 0) return null;
      return {
        tag: t,
        color: tagColors[i % tagColors.length],
        totalTarget: tagTodos.reduce((a, td) => a + td.targetHours, 0),
        totalDone: tagTodos.reduce(
          (a, td) =>
            a + Math.min(getTodoProgressSeconds(td) / 3600, td.targetHours),
          0,
        ),
        completedCount: tagTodos.filter(isTodoDone).length,
        totalCount: tagTodos.length,
      };
    })
    .filter(Boolean) as any[];

  // --- RENDER ---
  if (loadingAuth)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-mono text-sm tracking-widest uppercase">
        Loading Core...
      </div>
    );

  return (
    <main className="relative h-screen w-screen flex flex-col items-center justify-center text-white font-sans overflow-hidden select-none">
      <div className="absolute inset-0 z-[-1]">
        {useCustomBg && customBg ? (
          <img
            src={customBg}
            alt="Custom Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={backgrounds[selectedBg]}
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/40 transition-all duration-700"></div>
      </div>

      <ParticleOverlay effect={overlayEffect} />

      <HeaderWidgets
        isRunning={isRunning}
        isPaused={isPaused}
        clock={clock}
        currentTime={currentTime}
        dayProgressPct={dayProgressPct}
        hoursLeft={hoursLeft}
        minsLeft={minsLeft}
        todayHours={todayHours}
        todayMins={todayMins}
        currentStreak={currentStreak}
        todayTodos={todayTodos}
        tags={tags}
        getTodoProgressSeconds={getTodoProgressSeconds}
        getFormattedDate={getFormattedDate}
        profile={profile}
        onLogout={handleLogout}
      />

      {/* MODALS */}
      {tagToDelete && (
        <DeleteTagModal
          tag={tagToDelete}
          onConfirm={confirmDeleteTag}
          onCancel={() => setTagToDelete(null)}
        />
      )}
      {todoToDelete && (
        <DeleteTodoModal
          todo={todoToDelete}
          onConfirm={confirmDeleteTodo}
          onCancel={() => setTodoToDelete(null)}
        />
      )}
      {confirmEnd?.show && (
        <EndSessionModal
          elapsed={confirmEnd.elapsed}
          onConfirm={() => {
            setConfirmEnd(null);
            executeCompleteSession(confirmEnd.elapsed);
          }}
          onCancel={() => setConfirmEnd(null)}
        />
      )}
      {popupData?.show && (
        <SuccessModal
          data={popupData}
          sessionTitle={sessionTitle}
          selectedTag={selectedTag}
          onClose={() => setPopupData(null)}
        />
      )}

      {/* WIDGETS */}
      <FocusWidget
        isRunning={isRunning}
        isPaused={isPaused}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        sessionTitle={sessionTitle}
        setSessionTitle={setSessionTitle}
        adjustTimer={adjustTimer}
        formatRunningTime={formatRunningTime}
        timeInSeconds={timeInSeconds}
        mode={mode}
        setMode={setMode}
        sessionProgressPct={sessionProgressPct}
        togglePause={togglePause}
        triggerCompleteFlow={triggerCompleteFlow}
        showWidget={showWidget}
        setShowWidget={setShowWidget}
        activeTab={activeTab}
        inputHrs={inputHrs}
        setInputHrs={setInputHrs}
        inputMins={inputMins}
        setInputMins={setInputMins}
        isAddingTag={isAddingTag}
        setIsAddingTag={setIsAddingTag}
        tags={tags}
        editingTagIndex={editingTagIndex}
        setEditingTagIndex={setEditingTagIndex}
        handleUpdateTag={handleUpdateTag}
        setTagToDelete={setTagToDelete}
        newTagInput={newTagInput}
        setNewTagInput={setNewTagInput}
        handleAddTag={handleAddTag}
        handleStart={handleStart}
      />

      {activeTab === "stats" && (
        <StatsPanel
          setActiveTab={setActiveTab}
          setShowWidget={setShowWidget}
          statsSubTab={statsSubTab}
          setStatsSubTab={setStatsSubTab}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          chartMetric={chartMetric}
          setChartMetric={setChartMetric}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          isAddingTag={isAddingTag}
          setIsAddingTag={setIsAddingTag}
          tags={tags}
          editingTagIndex={editingTagIndex}
          setEditingTagIndex={setEditingTagIndex}
          handleUpdateTag={handleUpdateTag}
          setTagToDelete={setTagToDelete}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          handleAddTag={handleAddTag}
          todayHours={todayHours}
          todayMins={todayMins}
          startedDayTime={startedDayTime}
          endedDayTime={endedDayTime}
          todaySessions={todaySessions}
          productivityScore={productivityScore}
          trendPercent={trendPercent}
          yesterdayTotalSeconds={yesterdayTotalSeconds}
          weeklyChart={weeklyChart}
          pieData={pieData}
          calendar={calendar}
          sessions={sessions}
          completedTodos={completedTodos}
          unfinishedTodos={unfinishedTodos}
          todoTagStats={todoTagStats}
          formatSessionTimes={formatSessionTimes}
        />
      )}

      {activeTab === "todos" && (
        <TodosPanel
          setActiveTab={setActiveTab}
          setShowWidget={setShowWidget}
          todoName={todoName}
          setTodoName={setTodoName}
          todoTag={todoTag}
          setTodoTag={setTodoTag}
          todoDate={todoDate}
          setTodoDate={setTodoDate}
          todoHours={todoHours}
          setTodoHours={setTodoHours}
          tags={tags}
          handleAddTodo={handleAddTodo}
          todos={todos}
          todayStr={todayStr}
          todayTodos={todayTodos}
          upcomingWeekTodos={upcomingWeekTodos}
          laterTodos={laterTodos}
          pastTodos={pastTodos}
          getTodoProgressSeconds={getTodoProgressSeconds}
          setTodoToDelete={setTodoToDelete}
        />
      )}

      {activeTab === "theme" && (
        <ThemePanel
          setActiveTab={setActiveTab}
          setShowWidget={setShowWidget}
          selectedBg={selectedBg}
          setSelectedBg={setSelectedBg}
          useCustomBg={useCustomBg}
          setUseCustomBg={setUseCustomBg}
          customBg={customBg}
          customBgInputRef={customBgInputRef}
          handleCustomBgUpload={handleCustomBgUpload}
          handleRemoveCustomBg={handleRemoveCustomBg}
          overlayEffect={overlayEffect}
          setOverlayEffect={setOverlayEffect}
        />
      )}

      {/* BOTTOM RIGHT LOGO */}
      <div
        className={`absolute bottom-8 right-8 z-10 transition-opacity duration-500 ${isRunning && !isPaused ? "opacity-20" : "opacity-100"}`}
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-xl">
          <Image
            src="/logo.png"
            alt="Logo"
            width={300}
            height={56}
            className="h-15 w-auto object-contain rounded-xl"
            priority
          />
        </div>
      </div>

      <BottomNav
        isRunning={isRunning}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showWidget={showWidget}
        setShowWidget={setShowWidget}
      />
    </main>
  );
}
