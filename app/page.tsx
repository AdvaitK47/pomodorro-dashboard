"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { SessionRecord, OverlayEffect, Todo } from "../lib/types";
import { tagColors, backgrounds, overlayOptions } from "../lib/constants";
import { toLocalDateStr } from "../lib/dateUtils";
import ParticleOverlay from "../components/ui/ParticleOverlay";
import GlassDatePicker from "../components/ui/GlassDatePicker";
import DeleteTagModal from "../components/modals/DeleteTagModal";
import DeleteTodoModal from "../components/modals/DeleteTodoModal";
import EndSessionModal from "../components/modals/EndSessionModal";
import SuccessModal from "../components/modals/SuccessModal";
import DeleteAccountModal from "../components/modals/DeleteAccountModal";
import ThemePanel from "../components/features/ThemePanel";
import BottomNav from "../components/layout/BottomNav";
import FocusWidget from "../components/features/FocusWidget";
import TodosPanel from "../components/features/TodosPanel";
import StatsPanel from "../components/features/StatsPanel";
import HeaderWidgets from "../components/layout/HeaderWidgets";
import ChangeUsernameModal from "../components/modals/ChangeUsernameModal";
import TodoLinkModal from "../components/modals/TodoLinkModal";

export default function Home() {
  const router = useRouter();

  // --- AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [guestPfp, setGuestPfp] = useState(
    () => `/pfp/pfp${Math.floor(Math.random() * 5) + 1}.jpg`,
  );

  // --- UI STATE ---
  const [showWidget, setShowWidget] = useState(true);
  const [showGuestBanner, setShowGuestBanner] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "focus" | "stats" | "theme" | "todos"
  >("focus");
  const [selectedBg, setSelectedBg] = useState(0);
  const [useCustomBg, setUseCustomBg] = useState(false);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null!);
  const [overlayEffect, setOverlayEffect] = useState<OverlayEffect>("none");

  // --- TODOS STATE ---
  const todayStr = toLocalDateStr(new Date());
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
  const timerAnchorRef = useRef<{
    startedAt: number;
    baseSeconds: number;
  } | null>(null);
  const wasEffectivelyRunningRef = useRef(false);

  const sessionIdRef = useRef<string | null>(null);
  const finalizedRef = useRef(false);

  const [sessionTodoId, setSessionTodoId] = useState<string | null>(null);
  const sessionTodoIdRef = useRef<string | null>(null);
  const [showTodoLinkModal, setShowTodoLinkModal] = useState(false);

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
  const [popupData, setPopupData] = useState<any>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

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
        if (sessionStorage.getItem("guestMode") !== "true") {
          router.push("/login");
          return;
        }
        setUser(null);
        setProfile(null);
        setLoadingAuth(false);
        setTags(["Work", "Study", "Reading"]);
        setSelectedTag("Work");

        try {
          const localTodos = localStorage.getItem("pomodoro-todos");
          if (localTodos) setTodos(JSON.parse(localTodos));
        } catch (e) {}
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (!profileData.email && session.user.email) {
          await supabase
            .from("profiles")
            .update({ email: session.user.email })
            .eq("id", session.user.id);
        }
      } else {
        const fallbackUsername = session.user.user_metadata?.username || "USER";
        const newProfile = {
          id: session.user.id,
          username: fallbackUsername,
          email: session.user.email,
          profile_picture: `/pfp/pfp${Math.floor(Math.random() * 5) + 1}.jpg`,
        };
        await supabase.from("profiles").insert([newProfile]);
        setProfile(newProfile);
      }

      fetchTags();
      fetchSessions();
      fetchTodos();
      setLoadingAuth(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("guestMode");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await supabase.rpc("delete_account");
    await supabase.auth.signOut();
    sessionStorage.removeItem("guestMode");
    router.push("/login");
  };

  const handleChangeUsername = async (newUsername: string) => {
    if (!user || !newUsername.trim()) return;
    setProfile((prev: any) => ({ ...prev, username: newUsername.trim() }));
    await supabase
      .from("profiles")
      .update({ username: newUsername.trim() })
      .eq("id", user.id);
    setShowUsernameModal(false);
  };

  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      if (user) {
        setProfile((prev: any) => ({ ...prev, profile_picture: base64 }));
        await supabase
          .from("profiles")
          .update({ profile_picture: base64 })
          .eq("id", user.id);
      } else {
        setGuestPfp(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDefaultPfp = async (path: string) => {
    if (user) {
      setProfile((prev: any) => ({ ...prev, profile_picture: path }));
      await supabase
        .from("profiles")
        .update({ profile_picture: path })
        .eq("id", user.id);
    } else {
      setGuestPfp(path);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase.from("tags").select("name");
    if (data && data.length > 0) {
      const fetched = data.map((t) => t.name);
      setTags(fetched);
      setSelectedTag(fetched[0]);
    } else {
      setTags([]);
      setSelectedTag("Untagged");
    }
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*");
    if (!error && data) {
      setSessions(data as SessionRecord[]);
    }
  };

  const fetchTodos = async () => {
    const { data, error } = await supabase.from("todos").select("*");
    if (!error && data) {
      const mappedTodos: Todo[] = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        targetHours: Number(t.target_hours),
        scheduledDate: t.scheduled_date,
        createdAt: t.created_at,
      }));
      setTodos(mappedTodos);
    }
  };

  const handleAddTag = async () => {
    const newTag = newTagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      if (tags.length === 0) setSelectedTag(newTag);
      if (user) {
        await supabase
          .from("tags")
          .insert([{ name: newTag, user_id: user.id }]);
      }
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const executeCompleteSession = async (durationSec: number) => {
    timerAnchorRef.current = null;

    if (finalizedRef.current) return;
    finalizedRef.current = true;

    if (durationSec < 300) {
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    const endTime = new Date();
    const startTime =
      sessionStartTimeRef.current ||
      new Date(endTime.getTime() - durationSec * 1000);
    const todaySessions = sessions.filter(
      (s) => toLocalDateStr(new Date(s.created_at)) === todayStr,
    );

    const newRecord = {
      client_session_id: sessionIdRef.current,
      user_id: user?.id,
      tag_name: selectedTag,
      session_title: sessionTitle || "Focus Session",
      duration_seconds: durationSec,
      todo_id: sessionTodoIdRef.current,
    };

    const optimisticRecord = {
      ...newRecord,
      created_at: new Date().toISOString(),
    };

    setSessions((prev) => [...prev, optimisticRecord as SessionRecord]);

    if (user) {
      await supabase.from("sessions").upsert([newRecord], {
        onConflict: "client_session_id",
        ignoreDuplicates: true,
      });
    }

    const hrs = Math.floor(durationSec / 3600);
    const mins = Math.floor((durationSec % 3600) / 60);

    playSuccessSound();
    setPopupData({
      show: true,
      durationStr: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`,
      pauses: pauseCount,
      isFirstOfDay: todaySessions.length === 0,
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playSound = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play();
    } catch (e) {}
  };
  const playStartSound = () => playSound("/startSound.mp3");
  const playPauseSound = () => playSound("/pauseSound.mp3");
  const playResumeSound = () => playSound("/resumeSound.mp3");
  const playSuccessSound = () => playSound("/successSound.mp3");

  useEffect(() => {
    const effectivelyRunning = isRunning && !isPaused && !confirmEnd?.show;

    if (effectivelyRunning && !wasEffectivelyRunningRef.current) {
      timerAnchorRef.current = {
        startedAt: Date.now(),
        baseSeconds: timeInSeconds,
      };
    }
    wasEffectivelyRunningRef.current = effectivelyRunning;

    if (!effectivelyRunning) return;

    const tick = () => {
      const anchor = timerAnchorRef.current;
      if (!anchor) return;
      const elapsed = Math.floor((Date.now() - anchor.startedAt) / 1000);
      if (mode === "pomodoro") {
        const remaining = anchor.baseSeconds - elapsed;
        if (remaining <= 0) {
          timerAnchorRef.current = null;
          setTimeInSeconds(0);
          executeCompleteSession(initialTimeRef.current);
        } else {
          setTimeInSeconds(remaining);
        }
      } else {
        setTimeInSeconds(anchor.baseSeconds + elapsed);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, mode, confirmEnd]);

  const handleStart = () => {
    playStartSound();
    sessionIdRef.current = crypto.randomUUID();
    finalizedRef.current = false;
    sessionTodoIdRef.current = sessionTodoId;

    let startSeconds: number;
    if (mode === "pomodoro") {
      const hrs = parseInt(inputHrs) || 0;
      const mins = parseInt(inputMins) || 0;
      startSeconds = hrs * 3600 + mins * 60;
      initialTimeRef.current = startSeconds;
    } else {
      startSeconds = 0;
      initialTimeRef.current = 0;
    }
    setTimeInSeconds(startSeconds);
    timerAnchorRef.current = {
      startedAt: Date.now(),
      baseSeconds: startSeconds,
    };
    sessionStartTimeRef.current = new Date();
    setPauseCount(0);
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleStartClick = () => {
    if (eligibleTodosForSession.length > 0) {
      setShowTodoLinkModal(true);
    } else {
      setSessionTodoId(null);
      sessionTodoIdRef.current = null;
      handleStart();
    }
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
    const effectivelyRunning = !isPaused && !confirmEnd?.show;
    const anchor = timerAnchorRef.current;
    const currentRemaining =
      effectivelyRunning && anchor
        ? anchor.baseSeconds -
          Math.floor((Date.now() - anchor.startedAt) / 1000)
        : timeInSeconds;
    const newRemaining = Math.max(1, currentRemaining + seconds);
    if (effectivelyRunning) {
      timerAnchorRef.current = {
        startedAt: Date.now(),
        baseSeconds: newRemaining,
      };
    }
    initialTimeRef.current += seconds;
    setTimeInSeconds(newRemaining);
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
    if (user)
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
    if (selectedTag === name) setSelectedTag(newTags[0] || "Untagged");
    setTagToDelete(null);
    if (user)
      await supabase
        .from("tags")
        .delete()
        .eq("name", name)
        .eq("user_id", user.id);
  };

  const handleAddTodo = async () => {
    const name = todoName.trim();
    const hrs = parseFloat(todoHours);
    if (!name || !todoTag || !hrs || hrs <= 0) return;

    const newTodoPayload = {
      user_id: user?.id,
      name,
      tag: todoTag,
      target_hours: hrs,
      scheduled_date: todoDate,
    };

    if (user) {
      const { data, error } = await supabase
        .from("todos")
        .insert([newTodoPayload])
        .select()
        .single();

      if (!error && data) {
        const createdTodo: Todo = {
          id: data.id,
          name: data.name,
          tag: data.tag,
          targetHours: Number(data.target_hours),
          scheduledDate: data.scheduled_date,
          createdAt: data.created_at,
        };
        setTodos((prev) => [...prev, createdTodo]);
      }
    } else {
      const guestTodo: Todo = {
        id: Date.now().toString(),
        name,
        tag: todoTag,
        targetHours: hrs,
        scheduledDate: todoDate,
        createdAt: new Date().toISOString(),
      };
      setTodos((prev) => [...prev, guestTodo]);
    }

    setTodoName("");
    setTodoHours("1");
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (user) {
      await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);
    }
  };

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
      .filter((s: any) => s.todo_id === todo.id)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
  };

  useEffect(() => {
    if (!loadingAuth && !user) {
      setSelectedBg(0);
      setUseCustomBg(false);
      setCustomBg(null);
      setOverlayEffect("none");
    }
  }, [loadingAuth, user]);

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
      if (!user) {
        localStorage.setItem("pomodoro-todos", JSON.stringify(todos));
      }
    } catch (e) {}
  }, [todos, user]);
  useEffect(() => {
    if (!todoTag && tags.length > 0) setTodoTag(tags[0]);
  }, [tags, todoTag]);

  useEffect(() => {
    setSessionTodoId(null);
  }, [selectedTag]);

  const yesterdayStr = toLocalDateStr(new Date(Date.now() - 86400000));
  const todaySessions = sessions.filter(
    (s) => toLocalDateStr(new Date(s.created_at)) === todayStr,
  );
  const yesterdaySessions = sessions.filter(
    (s) => toLocalDateStr(new Date(s.created_at)) === yesterdayStr,
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
      new Set(sessions.map((s) => toLocalDateStr(new Date(s.created_at)))),
    ).sort();
    let currentStreak = 0,
      checkDate = new Date();
    while (true) {
      const dateStr = toLocalDateStr(checkDate);
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

  const getWeekRange = (offset: number) => {
    const now = new Date();
    const currentDay = now.getDay();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - currentDay - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const generateWeeklyData = () => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const { start, end } = getWeekRange(weekOffset);

    const dayData = [];
    let maxValue = 1;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = toLocalDateStr(d);

      const daySessions = sessions.filter(
        (s) => toLocalDateStr(new Date(s.created_at)) === dStr,
      );

      const tagTotals: Record<string, number> = {};
      daySessions.forEach((s) => {
        const val =
          chartMetric === "mins" ? Math.round(s.duration_seconds / 60) : 1;
        const tagName = s.tag_name || "Untagged";
        tagTotals[tagName] = (tagTotals[tagName] || 0) + val;
      });

      const totalValue = Object.values(tagTotals).reduce(
        (acc, v) => acc + v,
        0,
      );
      if (totalValue > maxValue) maxValue = totalValue;

      dayData.push({
        day: dayLabels[d.getDay()],
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
        totalValue,
        tags: tagTotals,
      });
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const rangeLabel = `${fmt(start)} - ${fmt(end)}`;

    return { dayData, maxValue, rangeLabel };
  };
  const weeklyChart = generateWeeklyData();

  const generatePieData = () => {
    const { start, end } = getWeekRange(weekOffset);
    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);

    const weekSessions = sessions.filter((s) => {
      const dStr = toLocalDateStr(new Date(s.created_at));
      return dStr >= startStr && dStr <= endStr;
    });

    const tagTotals: Record<string, number> = {};
    weekSessions.forEach((s) => {
      const val =
        chartMetric === "mins" ? Math.round(s.duration_seconds / 60) : 1;
      const tagName = s.tag_name || "Untagged";
      tagTotals[tagName] = (tagTotals[tagName] || 0) + val;
    });

    const grandTotal = Object.values(tagTotals).reduce((acc, v) => acc + v, 0);

    if (grandTotal === 0) {
      return { slices: [], grandTotal: 0, gradientString: "" };
    }

    const activeTags = Object.keys(tagTotals);

    let cumulative = 0;
    const gradientParts: string[] = [];

    const slices = activeTags.map((tag: string, i: number) => {
      const val = tagTotals[tag] || 0;
      const percent = ((val / grandTotal) * 100).toFixed(1);

      const color =
        tag === "Untagged"
          ? "#9ca3af"
          : tagColors[tags.indexOf(tag) % tagColors.length] || "#9ca3af";

      const startPct = cumulative;
      cumulative += parseFloat(percent);
      if (val > 0) {
        gradientParts.push(`${color} ${startPct}% ${cumulative}%`);
        if (activeTags.length > 1) {
          gradientParts.push(
            `#000000 ${cumulative}% ${Math.min(100, cumulative + 0.5)}%`,
          );
          cumulative = Math.min(100, cumulative + 0.5);
        }
      }
      return { tag, color, percent };
    });

    return {
      slices,
      grandTotal,
      gradientString: gradientParts.join(", "),
    };
  };
  const pieData = generatePieData();

  const generateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

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
  const weekEndStr = toLocalDateStr(new Date(Date.now() + 7 * 86400000));
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

  const eligibleTodosForSession = todayTodos.filter(
    (t) => t.tag === selectedTag && !isTodoDone(t),
  );

  const todoTagStats = tags
    .map((tag: string, i: number) => {
      const tagTodos = todos.filter((t) => t.tag === tag);
      const totalTarget = tagTodos.reduce((acc, t) => acc + t.targetHours, 0);
      const totalDone = tagTodos.reduce(
        (acc, t) => acc + getTodoProgressSeconds(t) / 3600,
        0,
      );
      const completedCount = tagTodos.filter((t) => isTodoDone(t)).length;
      return {
        tag,
        color: tagColors[i % tagColors.length],
        totalTarget,
        totalDone,
        completedCount,
        totalCount: tagTodos.length,
      };
    })
    .filter((stat: any) => stat.totalCount > 0);

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

      {user && <ParticleOverlay effect={overlayEffect} />}

      {!user && showGuestBanner && (
        <div className="fixed sm:absolute top-0 sm:top-4 inset-x-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 sm:z-50 bg-amber-500/10 backdrop-blur-md border-b sm:border sm:rounded-full border-amber-500/30 text-amber-200 px-4 py-2 sm:px-6 sm:py-2.5 text-[10px] sm:text-xs flex items-center justify-center flex-wrap gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 shadow-xl">
          <button
            onClick={() => setShowGuestBanner(false)}
            className="text-amber-200/70 hover:text-white transition-colors shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <span className="text-center leading-tight">
            ⚠️ You are in Guest Mode. Sign In to save your progress.
          </span>
          <div className="w-[1px] h-4 bg-amber-500/30 hidden sm:block"></div>
          <button
            onClick={() => {
              sessionStorage.removeItem("guestMode");
              router.push("/login");
            }}
            className="font-bold uppercase tracking-wider hover:text-white transition-colors shrink-0 underline sm:no-underline"
          >
            Sign In
          </button>
        </div>
      )}

      <HeaderWidgets
        isRunning={isRunning}
        isPaused={isPaused}
        hasGuestBanner={!user && showGuestBanner}
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
        user={user}
        userEmail={user?.email}
        defaultPfp={guestPfp}
        onUploadPfp={handlePfpUpload}
        onSelectDefaultPfp={handleSelectDefaultPfp}
        onSignIn={() => {
          sessionStorage.removeItem("guestMode");
          router.push("/login");
        }}
        onLogout={handleLogout}
        onDeleteAccount={() => setShowDeleteAccountModal(true)}
        onChangeUsername={() => setShowUsernameModal(true)}
      />

      {/* MODALS */}
      {showDeleteAccountModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteAccountModal(false)}
        />
      )}
      {showUsernameModal && (
        <ChangeUsernameModal
          currentUsername={profile?.username || "USER"}
          onConfirm={handleChangeUsername}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}
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
      {showTodoLinkModal && (
        <TodoLinkModal
          todos={eligibleTodosForSession}
          onSelect={(todoId) => {
            setSessionTodoId(todoId);
            setShowTodoLinkModal(false);
            handleStart();
          }}
          onCancel={() => setShowTodoLinkModal(false)}
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
        handleStart={handleStartClick}
        eligibleTodosForSession={eligibleTodosForSession}
        sessionTodoId={sessionTodoId}
        setSessionTodoId={setSessionTodoId}
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
          isGuest={!user}
        />
      )}

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
