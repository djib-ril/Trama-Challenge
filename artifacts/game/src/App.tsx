import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Moon, Sun } from "lucide-react";
import AdminDashboard from "./AdminDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "lobby" | "room" | "quiz" | "summary" | "finished" | "admin";

interface TopicInfo { key: string; name: string; }
interface QuizCatInfo { key: string; name: string; emoji: string; topics: TopicInfo[]; }
interface SumCatInfo  { key: string; name: string; emoji: string; }

interface GameConfig {
  mode: "quiz" | "summary" | "custom";
  categoryKey: string;
  topicKey: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  timerSeconds: number;
  questionCount: number;
  summaryCategory: string;
}

interface PlayerInfo { id: string; name: string; score: number; streak: number; }

interface QuestionData {
  index: number; total: number;
  type: "mc" | "tf";
  q: string; options: string[];
  timerSeconds: number; points: number; difficulty: string;
}

interface QuestionEndData {
  correctAnswer: string; explanation: string;
  scores: Array<{ id: string; name: string; score: number; delta: number; correct: boolean; answerTimeMs: number | null; speedBonus: number }>;
}

interface LeaderEntry { rank: number; name: string; score: number; }
interface Toast { id: number; text: string; type: string; }
interface ScholarEntry { rank: number; name: string; best: number; total: number; games: number; }
interface ScholarsPayload {
  allTime: ScholarEntry[];
  weekly: ScholarEntry[];
  monthly: ScholarEntry[];
  weekKey: string;
  monthKey: string;
}

interface AdminRoom {
  code: string;
  isActive: boolean;
  phase: string;
  questionIndex: number;
  totalQuestions: number;
  autoPlay: boolean;
  hostName: string;
  players: PlayerInfo[];
  season?: { title: string; index: number; total: number };
}

type Theme = "light" | "dark";
type SeasonProgress = { title: string; index: number; total: number; nextCode: string | null };
type SeasonQuizConfig = { title: string; config: GameConfig };
type SeasonCreateResult = { ok: boolean; rooms?: Array<{ code: string; title: string; index: number; total: number }>; message?: string };

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

function AdminLoginScreen({
  username,
  password,
  error,
  submitting,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onBack,
  theme,
  onToggleTheme,
}: {
  username: string;
  password: string;
  error: string;
  submitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  return (
    <div className="trama-lobby min-h-screen flex flex-col items-center p-4">
      <div className="theme-toggle-corner"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div className="trama-orbit trama-orbit-one" />
      <div className="trama-orbit trama-orbit-two" />
      <div className="relative z-10 flex w-full max-w-md flex-1 items-center justify-center py-10">
        <form
          className="trama-entry-card w-full p-7 sm:p-9 animate-pop-in space-y-5"
          onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
        >
          <div className="text-center space-y-2">
            <img src="/trama-logo.png" alt="Trama Challenge logo" className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg" />
            <h1 className="text-3xl font-extrabold" style={{ color: "#332b3b" }}>Admin access</h1>
            <p className="text-sm" style={{ color: "#6e6875" }}>Sign in to coordinate live Trama Challenge rooms.</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Admin username"
              className="trama-pin-input w-full px-4 py-3 font-semibold focus:outline-none"
              aria-label="Admin username"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Password"
              className="trama-pin-input w-full px-4 py-3 font-semibold focus:outline-none"
              aria-label="Admin password"
            />
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="trama-join-btn w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" onClick={onBack} className="w-full text-center text-sm" style={{ color: "#6e6875" }}>
            ← Back to game
          </button>
        </form>
      </div>
    </div>
  );
}

interface YouTubeLive {
  watchUrl: string;
  studioUrl: string;
  title: string;
  status: string;
  encoderRequired: boolean;
  browserEncoderAvailable?: boolean;
  broadcastId?: string;
}

// Custom quiz builder types
interface CustomQ {
  id: string;
  type: "mc" | "tf";
  q: string;
  options: string[];    // 4 for mc, 2 for tf
  answer: string;       // "A"|"B"|"C"|"D" or "True"|"False"
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

const LABELS = ["A", "B", "C", "D"];
const LABEL_CLASSES = ["label-a", "label-b", "label-c", "label-d"];
const BTN_CLASSES = ["ans-a", "ans-b", "ans-c", "ans-d"];
const DIFFS = ["easy", "medium", "hard", "mixed"] as const;
const TIMERS_QUIZ = [15, 30, 45, 60, 90];
const TIMERS_SUM  = [60, 90, 120];
const COUNTS = [5, 10, 15, 20];

function newCustomQ(): CustomQ {
  return { id: Math.random().toString(36).slice(2), type: "mc", q: "", options: ["", "", "", ""], answer: "A", explanation: "", difficulty: "medium" };
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function ToastBar({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="animate-toast glass px-4 py-2 text-sm font-semibold max-w-xs"
          style={{ borderColor: t.type === "join" ? "#06b6d4" : t.type === "leader" ? "#f97316" : "rgba(120,80,255,0.4)" }}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

function TimerBar({ seconds, timerKey }: { seconds: number; timerKey: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.1)" }}>
      <div className="timer-bar" style={{ animationDuration: `${seconds}s` }} key={timerKey} />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 py-2 rounded-lg text-sm font-bold border transition"
      style={{
        background: active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
        borderColor: active ? "#7c3aed" : "rgba(120,80,255,0.2)",
        color: active ? "#a78bfa" : "rgba(200,200,255,0.5)",
      }}>
      {children}
    </button>
  );
}

function Pill({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
      style={{
        background: active ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.05)",
        borderColor: active ? "#06b6d4" : "rgba(120,80,255,0.2)",
        color: active ? "#06b6d4" : "rgba(200,200,255,0.5)",
      }}>
      {children}
    </button>
  );
}

// ─── Custom Quiz Builder ───────────────────────────────────────────────────────

function QuizBuilder({
  questions, onChange, isHost,
}: {
  questions: CustomQ[];
  onChange: (qs: CustomQ[]) => void;
  isHost: boolean;
}) {
  const [draft, setDraft] = useState<CustomQ>(newCustomQ());
  const [editId, setEditId] = useState<string | null>(null);
  const [formErr, setFormErr] = useState("");

  const activeDraft = editId ? (questions.find(q => q.id === editId) ?? draft) : draft;

  function updateDraft(patch: Partial<CustomQ>) {
    if (editId) {
      onChange(questions.map(q => q.id === editId ? { ...q, ...patch } : q));
    } else {
      setDraft(prev => ({ ...prev, ...patch }));
    }
  }

  function setType(t: "mc" | "tf") {
    if (t === "tf") updateDraft({ type: "tf", options: ["True", "False"], answer: "True" });
    else updateDraft({ type: "mc", options: ["", "", "", ""], answer: "A" });
  }

  function setOption(i: number, val: string) {
    const opts = [...activeDraft.options];
    opts[i] = val;
    updateDraft({ options: opts });
  }

  function addQuestion() {
    if (!draft.q.trim()) { setFormErr("Enter the question text"); return; }
    if (draft.type === "mc" && draft.options.slice(0, 2).some(o => !o.trim())) {
      setFormErr("Fill in at least options A and B"); return;
    }
    setFormErr("");
    onChange([...questions, { ...draft, id: Math.random().toString(36).slice(2) }]);
    setDraft(newCustomQ());
  }

  function removeQ(id: string) { onChange(questions.filter(q => q.id !== id)); }

  function startEdit(id: string) { setEditId(id); }
  function stopEdit() { setEditId(null); }

  const currentDraft = editId ? activeDraft : draft;

  return (
    <div className="space-y-4">
      {/* Question list */}
      {questions.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl p-3 text-sm flex gap-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(120,80,255,0.25)" }}>
              <span className="shrink-0 font-extrabold text-white/40 tabular-nums w-6 text-right">#{i + 1}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-white truncate">{q.q}</p>
                <div className="flex flex-wrap gap-1">
                  {q.type === "mc" ? q.options.map((o, oi) => o && (
                    <span key={oi} className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: q.answer === LABELS[oi] ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)", color: q.answer === LABELS[oi] ? "#4ade80" : "rgba(200,200,255,0.6)" }}>
                      {LABELS[oi]}: {o}
                    </span>
                  )) : (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(16,185,129,0.3)", color: "#4ade80" }}>Correct: {q.answer}</span>
                  )}
                </div>
                <span className="text-xs capitalize" style={{ color: q.difficulty === "easy" ? "#4ade80" : q.difficulty === "hard" ? "#f87171" : "#facc15" }}>{q.difficulty}</span>
              </div>
              {isHost && (
                <button onClick={() => removeQ(q.id)}
                  className="shrink-0 text-red-400/60 hover:text-red-400 text-lg transition"
                   title="Remove question">Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && (
        <p className="text-center text-xs py-4" style={{ color: "rgba(200,200,255,0.35)" }}>
          No questions yet. Add your first question below.
        </p>
      )}

      {/* Builder form (host only) */}
      {isHost && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,0.08)", border: "1.5px dashed rgba(124,58,237,0.4)" }}>
          <p className="text-xs font-bold tracking-widest" style={{ color: "rgba(167,139,250,0.8)" }}>
            + ADD QUESTION
          </p>

          {/* Type */}
          <div className="flex gap-2">
            <TabBtn active={currentDraft.type === "mc"} onClick={() => setType("mc")}>Multiple Choice</TabBtn>
            <TabBtn active={currentDraft.type === "tf"} onClick={() => setType("tf")}>True / False</TabBtn>
          </div>

          {/* Question text */}
          <textarea
            value={currentDraft.q}
            onChange={(e) => updateDraft({ q: e.target.value })}
            placeholder="Type your question here…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(120,80,255,0.35)" }}
          />

          {/* Options */}
          {currentDraft.type === "mc" ? (
            <div className="grid grid-cols-2 gap-2">
              {currentDraft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-extrabold shrink-0 ${LABEL_CLASSES[i]}`}>{LABELS[i]}</span>
                  <input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${LABELS[i]}`}
                    className="flex-1 px-2 py-1.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(120,80,255,0.3)" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "rgba(200,200,255,0.5)" }}>Options: True / False</p>
          )}

          {/* Correct answer */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-semibold" style={{ color: "rgba(200,200,255,0.6)" }}>Correct answer:</p>
            {currentDraft.type === "mc" ? (
              currentDraft.options.map((opt, i) => opt.trim() && (
                <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="correct" checked={currentDraft.answer === LABELS[i]}
                    onChange={() => updateDraft({ answer: LABELS[i] })} className="accent-purple-500" />
                  <span className="text-xs text-white font-semibold">{LABELS[i]}: {opt.slice(0, 20)}</span>
                </label>
              ))
            ) : (
              ["True", "False"].map((v) => (
                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="correctTF" checked={currentDraft.answer === v}
                    onChange={() => updateDraft({ answer: v })} className="accent-purple-500" />
                  <span className="text-xs text-white font-semibold">{v}</span>
                </label>
              ))
            )}
          </div>

          {/* Explanation + Difficulty */}
          <div className="flex gap-2 flex-wrap">
            <input
              value={currentDraft.explanation}
              onChange={(e) => updateDraft({ explanation: e.target.value })}
              placeholder="Explanation (optional)"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(120,80,255,0.3)" }}
            />
            <select
              value={currentDraft.difficulty}
              onChange={(e) => updateDraft({ difficulty: e.target.value as "easy"|"medium"|"hard" })}
              className="px-3 py-2 rounded-lg text-xs font-bold focus:outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(120,80,255,0.3)", color: currentDraft.difficulty === "easy" ? "#4ade80" : currentDraft.difficulty === "hard" ? "#f87171" : "#facc15" }}>
              <option value="easy">Easy (100 pts)</option>
              <option value="medium">Medium (200 pts)</option>
              <option value="hard">Hard (300 pts)</option>
            </select>
          </div>

          {formErr && <p className="text-red-400 text-xs">{formErr}</p>}

          <button onClick={addQuestion} className="neon-btn w-full py-2 text-sm">
            + Add Question ({questions.length} added)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const socketRef = useRef<Socket | null>(null);
  const adminSocketRef = useRef<Socket | null>(null);

  const [quizCats, setQuizCats] = useState<QuizCatInfo[]>([]);
  const [sumCats,  setSumCats]  = useState<SumCatInfo[]>([]);

  const [screen,    setScreen]    = useState<Screen>("lobby");
  const [theme,     setTheme]     = useState<Theme>(() => localStorage.getItem("trama-theme") === "light" ? "light" : "dark");
  const [lobbyStep, setLobbyStep] = useState<"name" | "action">("name");
  const [username,  setUsername]  = useState(() => localStorage.getItem("trama-player-name") ?? "");
  const [joinCode,  setJoinCode]  = useState("");
  const [roomCode,  setRoomCode]  = useState("");
  const [isHost,    setIsHost]    = useState(false);
  const [config,    setConfig]    = useState<GameConfig>({
    mode: "quiz", categoryKey: "math", topicKey: "algebra",
    difficulty: "mixed", timerSeconds: 30, questionCount: 10, summaryCategory: "random",
  });
  const [players,   setPlayers]   = useState<PlayerInfo[]>([]);
  const [customQs,  setCustomQs]  = useState<CustomQ[]>([]);
  const [toasts,    setToasts]    = useState<Toast[]>([]);
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(false);
  const toastId = useRef(0);

  const [question,     setQuestion]     = useState<QuestionData | null>(null);
  const [selected,     setSelected]     = useState<string | null>(null);
  const [phase,        setPhase]        = useState<"question" | "reveal">("question");
  const [questionEnd,  setQuestionEnd]  = useState<QuestionEndData | null>(null);
  const [myResult,     setMyResult]     = useState<{ correct: boolean; delta: number; answer: string; answerTimeMs: number | null; speedBonus: number } | null>(null);
  const [timeLeft,     setTimeLeft]     = useState(30);
  const [timerKey,     setTimerKey]     = useState("k0");
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [passage,         setPassage]         = useState("");
  const [summaryText,     setSummaryText]     = useState("");
  const [summarySubmitted,setSummarySubmitted] = useState(false);
  const [summaryTime,     setSummaryTime]     = useState(120);

  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [seasonProgress, setSeasonProgress] = useState<SeasonProgress | null>(null);
  const [scholars,    setScholars]    = useState<ScholarsPayload>({ allTime: [], weekly: [], monthly: [], weekKey: "", monthKey: "" });
  const [scholarTab,  setScholarTab]  = useState<"allTime" | "weekly" | "monthly">("allTime");
  const [gameLocked,  setGameLocked]  = useState(false);
  const [autoPlay,    setAutoPlay]    = useState(false);
  const [autoPlayStatus, setAutoPlayStatus] = useState<"idle" | "starting" | "running" | "next">("idle");
  const [youtubeLive, setYoutubeLive] = useState<YouTubeLive | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubeQuotaBlocked, setYoutubeQuotaBlocked] = useState(false);
  const [youtubeStreaming, setYoutubeStreaming] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const captureRef = useRef<MediaStream | null>(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminLoginUsername, setAdminLoginUsername] = useState("admins");
  const [adminLoginPassword, setAdminLoginPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminLoginSubmitting, setAdminLoginSubmitting] = useState(false);
  const [adminRooms, setAdminRooms] = useState<AdminRoom[]>([]);

  const addToast = useCallback((text: string, type: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const registerEvents = useCallback((socket: Socket) => {
    socket.on("meta", ({ quiz, summary }: { quiz: QuizCatInfo[]; summary: SumCatInfo[] }) => {
      setQuizCats(quiz); setSumCats(summary);
    });
    socket.on("roomJoined", ({ code, isHost: host, config: cfg, customQuestions, season }: {
      code: string; isHost: boolean; config: GameConfig; customQuestions: CustomQ[]; season: SeasonProgress | null;
    }) => {
      setRoomCode(code); setIsHost(host); setConfig(cfg);
      setSeasonProgress(season ?? null);
      setCustomQs(customQuestions ?? []); setScreen("room");
    });
    socket.on("youAreNowHost", () => { setIsHost(true); addToast("You are now the host!", "leader"); });
    socket.on("configUpdated", (cfg: GameConfig) => setConfig(cfg));
    socket.on("customQuestionsUpdated", (qs: CustomQ[]) => setCustomQs(qs));
    socket.on("playersUpdate", (list: PlayerInfo[]) => setPlayers(list));
    socket.on("notification", ({ text, type }: { text: string; type: string }) => addToast(text, type));
    socket.on("gameStarted", ({ mode }: { mode: string }) => {
      setPhase("question"); setSelected(null); setQuestion(null); setMyResult(null); setQuestionEnd(null);
      setAutoPlayStatus((current) => current === "starting" || current === "next" ? "running" : current);
      setScreen(mode === "summary" ? "summary" : "quiz");
    });
    socket.on("question", (data: QuestionData) => {
      setQuestion(data); setSelected(null); setMyResult(null); setQuestionEnd(null);
      setPhase("question"); setTimeLeft(data.timerSeconds); setTimerKey(`k${Date.now()}`);
      if (timerInterval.current) clearInterval(timerInterval.current);
      let t = data.timerSeconds;
      timerInterval.current = setInterval(() => {
        t--; setTimeLeft(t);
        if (t <= 0 && timerInterval.current) clearInterval(timerInterval.current);
      }, 1000);
    });
    socket.on("yourResult", (res: { correct: boolean; delta: number; answer: string; answerTimeMs: number | null; speedBonus: number }) => setMyResult(res));
    socket.on("questionEnd", (data: QuestionEndData) => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      setQuestionEnd(data); setPhase("reveal");
    });
    socket.on("summaryStarted", ({ passage: p, totalSeconds }: { passage: string; totalSeconds: number }) => {
      setPassage(p); setSummaryTime(totalSeconds); setSummaryText(""); setSummarySubmitted(false);
    });
    socket.on("timerUpdate", (t: number) => setSummaryTime(t));
    socket.on("summaryReceived", () => setSummarySubmitted(true));
    socket.on("gameOver", (result: { leaderboard: LeaderEntry[]; season: SeasonProgress | null }) => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      setLeaderboard(result.leaderboard ?? []);
      setSeasonProgress(result.season ?? null);
      setScreen("finished");
    });
    socket.on("topScholars", (payload: ScholarsPayload) => setScholars(payload));
    socket.on("adminGameStopped", () => {
      setQuestion(null);
      setQuestionEnd(null);
      setSelected(null);
      setMyResult(null);
      setScreen("room");
      addToast("This round was stopped by an admin.", "info");
    });
    socket.on("autoPlayUpdate", ({ enabled, status }: { enabled: boolean; status: "idle" | "starting" | "running" | "next" }) => {
      setAutoPlay(enabled);
      setAutoPlayStatus(status);
    });
    socket.on("youtubeStreamStatus", ({ streaming }: { streaming: boolean }) => setYoutubeStreaming(streaming));
    socket.on("error", (msg: string) => { setError(msg); addToast(msg, "error"); });
  }, [addToast]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("trama-theme", theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (code) { setJoinCode(code.toUpperCase()); setLobbyStep("name"); }
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;
    registerEvents(socket);
    return () => { socket.disconnect(); if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [registerEvents]);

  useEffect(() => {
    fetch("/api/admin/user", { credentials: "include" })
      .then((response) => response.json() as Promise<{ user: unknown | null }>)
      .then((data) => setAdminAuthenticated(Boolean(data.user)))
      .catch(() => setAdminAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!adminAuthenticated) {
      adminSocketRef.current?.disconnect();
      adminSocketRef.current = null;
      setAdminRooms([]);
      return;
    }
    const adminSocket = io({ path: "/api/socket.io", auth: { admin: true }, withCredentials: true });
    adminSocketRef.current = adminSocket;
    adminSocket.on("adminRoomsUpdate", (rooms: AdminRoom[]) => setAdminRooms(rooms));
    adminSocket.on("connect_error", () => setAdminLoginError("Admin control connection could not be established."));
    adminSocket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setAdminAuthenticated(false);
        setAdminRooms([]);
        setAdminLoginError("Your admin session expired after 24 hours. Please log in again.");
        setScreen((current) => current === "admin" ? "lobby" : current);
      }
    });
    adminSocket.on("connect", () => adminSocket.emit("adminSubscribe"));
    return () => {
      adminSocket.disconnect();
      if (adminSocketRef.current === adminSocket) adminSocketRef.current = null;
    };
  }, [adminAuthenticated]);

  // Push custom questions to server whenever they change (host only)
  const prevCustomQsRef = useRef<CustomQ[]>([]);
  useEffect(() => {
    if (!isHost) return;
    if (JSON.stringify(customQs) === JSON.stringify(prevCustomQsRef.current)) return;
    prevCustomQsRef.current = customQs;
    socketRef.current?.emit("setCustomQuestions", customQs);
  }, [customQs, isHost]);

  function pushConfig(patch: Partial<GameConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    socketRef.current?.emit("hostConfig", patch);
  }

  function joinRoom() {
    const name = username.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name) { setError("Enter a nickname"); return; }
    if (!code) { setError("Enter a room code"); return; }
    savePlayerProfile(name);
    setError(""); setGameLocked(false);
    socketRef.current?.emit("joinRoom", code, name, (ok: boolean, reason?: string) => {
      if (!ok) {
        if (reason === "GAME_LOCKED") { setGameLocked(true); setError(""); }
        else setError(reason ?? "Could not join");
      }
    });
  }

  function savePlayerProfile(name: string) {
    localStorage.setItem("trama-player-name", name);
  }

  async function submitAdminLogin() {
    setAdminLoginSubmitting(true);
    setAdminLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminLoginUsername, password: adminLoginPassword }),
      });
      const data = await response.json() as { user?: unknown; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Admin sign in failed.");
      setAdminAuthenticated(true);
      setAdminLoginPassword("");
      setScreen("admin");
    } catch (err) {
      setAdminLoginError(err instanceof Error ? err.message : "Admin sign in failed.");
    } finally {
      setAdminLoginSubmitting(false);
    }
  }

  async function logoutAdmin() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => {});
    adminSocketRef.current?.disconnect();
    adminSocketRef.current = null;
    setAdminAuthenticated(false);
    setAdminRooms([]);
    setScreen("lobby");
    setLobbyStep("name");
  }

  function createAdminRoom(
    payload: { config: GameConfig; customQuestions: CustomQ[] },
    callback: (result: { ok: boolean; code?: string; message?: string }) => void,
  ) {
    if (!adminSocketRef.current) {
      callback({ ok: false, message: "Admin control connection is not ready. Try again in a moment." });
      return;
    }
    adminSocketRef.current.emit("adminCreateRoom", payload, callback);
  }

  function createAdminSeason(
    payload: { title: string; quizzes: SeasonQuizConfig[] },
    callback: (result: SeasonCreateResult) => void,
  ) {
    if (!adminSocketRef.current) {
      callback({ ok: false, message: "Admin control connection is not ready. Try again in a moment." });
      return;
    }
    adminSocketRef.current.emit("adminCreateSeason", payload, callback);
  }

  function joinNextSeasonQuiz() {
    const code = seasonProgress?.nextCode;
    const name = username.trim();
    if (!code || !name || !socketRef.current) return;
    setJoinCode(code);
    setError("");
    socketRef.current.emit("leaveRoom");
    socketRef.current.emit("joinRoom", code, name, (ok: boolean, reason?: string) => {
      if (!ok) {
        setError(reason === "GAME_LOCKED" ? "That season quiz has already started. Ask the coordinator for the next PIN." : reason ?? "Could not join the next quiz.");
      }
    });
  }

  function startGame() {
    setError("Only a coordinator can start this quiz.");
  }

  function toggleAutoPlay() {
    setError("Auto-play is managed from the coordinator desk.");
  }

  async function prepareYouTubeLive() {
    setYoutubeLoading(true);
    setYoutubeError("");
    try {
      const response = await fetch("/api/youtube/live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Trama Challenge — 24/7 Live Quiz" }),
      });
      const data = await response.json() as YouTubeLive & { message?: string };
      if (!response.ok) {
        if ((data as { code?: string }).code === "YOUTUBE_QUOTA_EXCEEDED") setYoutubeQuotaBlocked(true);
        throw new Error(data.message ?? "YouTube could not create the broadcast.");
      }
      setYoutubeLive(data);
      addToast("YouTube Live broadcast created.", "join");
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Could not connect to YouTube.");
    } finally {
      setYoutubeLoading(false);
    }
  }

  async function toggleBrowserBroadcast() {
    if (!youtubeLive?.broadcastId) return;
    if (youtubeStreaming) {
      recorderRef.current?.stop();
      captureRef.current?.getTracks().forEach((track) => track.stop());
      adminSocketRef.current?.emit("youtubeStreamStop", youtubeLive.broadcastId);
      setYoutubeStreaming(false);
      return;
    }
    try {
      setYoutubeError("");
      const capture = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      captureRef.current = capture;
      const recorder = new MediaRecorder(capture, { mimeType: "video/webm;codecs=vp8,opus", videoBitsPerSecond: 4_000_000 });
      recorderRef.current = recorder;
       adminSocketRef.current?.emit("youtubeStreamStart", youtubeLive.broadcastId, (ok: boolean, message?: string) => {
         if (!ok) {
           setYoutubeError(message ?? "YouTube stream could not start.");
           capture.getTracks().forEach((track) => track.stop());
           return;
         }
         recorder.start(1000);
         setYoutubeStreaming(true);
       });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) event.data.arrayBuffer().then((buffer) => {
           adminSocketRef.current?.emit("youtubeStreamChunk", youtubeLive.broadcastId, buffer);
        });
      };
      capture.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.state !== "inactive") recorder.stop();
         adminSocketRef.current?.emit("youtubeStreamStop", youtubeLive.broadcastId);
        setYoutubeStreaming(false);
      });
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Screen sharing was cancelled.");
    }
  }

  function submitAnswer(ans: string) {
    if (selected || phase === "reveal") return;
    setSelected(ans); socketRef.current?.emit("answer", ans);
  }

  function submitSummary() {
    if (!summaryText.trim()) { setError("Write something first"); return; }
    setError(""); socketRef.current?.emit("submitSummary", summaryText);
  }

  function playAgain() {
    socketRef.current?.disconnect();
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;
    registerEvents(socket);
    setScreen("lobby"); setLobbyStep("name"); setUsername(""); setJoinCode(""); setRoomCode("");
    setIsHost(false); setPlayers([]); setError(""); setGameLocked(false); setQuestion(null); setSelected(null);
    setLeaderboard([]); setPassage(""); setSummaryText(""); setSummarySubmitted(false);
    setSeasonProgress(null);
    setCustomQs([]); history.replaceState({}, "", "/");
    setAutoPlay(false); setAutoPlayStatus("idle");
  }

  function copyLink() {
    const u = new URL(window.location.href);
    u.search = `?room=${roomCode}`;
    navigator.clipboard.writeText(u.toString()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const shareUrl = (() => { if (!roomCode) return ""; const u = new URL(window.location.href); u.search = `?room=${roomCode}`; return u.toString(); })();
  const currentTopics = quizCats.find(c => c.key === config.categoryKey)?.topics ?? [];

  // ─── LOBBY ────────────────────────────────────────────────────────────────

  const SCHOLAR_BADGES = ["01", "02", "03"];
  const SCHOLAR_BADGE_COLORS = [
    { bg: "rgba(234,179,8,0.18)", border: "rgba(234,179,8,0.5)", name: "#fde68a" },
    { bg: "rgba(156,163,175,0.14)", border: "rgba(156,163,175,0.45)", name: "#e5e7eb" },
    { bg: "rgba(180,83,9,0.18)", border: "rgba(180,83,9,0.5)", name: "#fdba74" },
  ];

  if (screen === "admin") {
    if (!adminAuthenticated) {
      return (
        <AdminLoginScreen
          username={adminLoginUsername}
          password={adminLoginPassword}
          error={adminLoginError}
          submitting={adminLoginSubmitting}
          onUsernameChange={(value) => { setAdminLoginUsername(value); setAdminLoginError(""); }}
          onPasswordChange={(value) => { setAdminLoginPassword(value); setAdminLoginError(""); }}
          onSubmit={submitAdminLogin}
          onBack={() => { setScreen("lobby"); setAdminLoginError(""); }}
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        />
      );
    }
    return (
      <AdminDashboard
        rooms={adminRooms}
        quizCats={quizCats}
        onCreateRoom={createAdminRoom}
         onCreateSeason={createAdminSeason}
        onStart={(code) => adminSocketRef.current?.emit("adminStartRoom", code)}
        onSkip={(code) => adminSocketRef.current?.emit("adminSkipRoom", code)}
        onStop={(code) => adminSocketRef.current?.emit("adminStopRoom", code)}
        onToggleAutoPlay={(code, enabled) => adminSocketRef.current?.emit("adminToggleAutoPlay", code, enabled)}
        youtubeLive={youtubeLive}
        youtubeLoading={youtubeLoading}
        youtubeError={youtubeError}
        youtubeQuotaBlocked={youtubeQuotaBlocked}
        youtubeStreaming={youtubeStreaming}
        onPrepareYouTube={prepareYouTubeLive}
        onToggleYouTube={toggleBrowserBroadcast}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        onLogout={logoutAdmin}
      />
    );
  }

  if (screen === "lobby") return (
    <div className="trama-lobby min-h-screen flex flex-col items-center p-4">
      <ToastBar toasts={toasts} />
      <div className="trama-orbit trama-orbit-one" />
      <div className="trama-orbit trama-orbit-two" />

      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-1">
        <div className="flex items-center gap-2 text-white font-black tracking-tight">
          <img
            src="/trama-logo.png"
            alt="Trama Challenge logo"
            className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-black/20"
          />
          <span>Trama Challenge</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
          <button onClick={() => setScreen("admin")} className="trama-top-action">
            {adminAuthenticated ? "Admin console" : "Admin login"}
          </button>
        </div>
      </header>

      <div className="relative z-10 w-full max-w-3xl flex flex-col gap-8 items-center py-16 sm:py-24">
        <div className="trama-entry-card w-full max-w-md p-7 sm:p-9 animate-pop-in space-y-5">
          <div className="text-center space-y-1">
             <h1 className="text-4xl font-extrabold"
               style={{ color: "#332b3b" }}>
              Trama Challenge
            </h1>
            <p className="text-sm" style={{ color: "#6e6875" }}>Enter the game PIN to join</p>
          </div>

          {lobbyStep === "name" && (
            <div className="space-y-4">
               <label className="block text-center text-xs font-bold tracking-widest" style={{ color: "#7d7080" }}>GAME PIN</label>
              <input type="text" placeholder="Enter PIN" maxLength={6}
                value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); setGameLocked(false); }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className="trama-pin-input w-full px-4 py-3 text-center font-mono text-xl tracking-[0.3em] focus:outline-none"
              />
              <input type="text" placeholder="Your nickname (max 15)" maxLength={15}
                value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className="trama-pin-input w-full px-4 py-3 font-semibold focus:outline-none"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button className="trama-join-btn w-full" onClick={joinRoom}>
                Join Game
              </button>
               <p className="text-center text-xs" style={{ color: "#8f8790" }}>
                 Rooms and questions are created by Trama coordinators.
              </p>
            </div>
          )}

          {gameLocked && (
            <div className="rounded-xl px-4 py-3 text-center space-y-1 animate-pop-in"
              style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.45)" }}>
              <p className="font-extrabold text-red-400 text-sm">Game already in progress</p>
              <p className="text-xs" style={{ color: "rgba(252,165,165,0.7)" }}>
                Please wait for the next round and try again.
              </p>
            </div>
          )}
        </div>

        <div className="trama-leaderboard w-full max-w-xl p-6 animate-pop-in space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-orange-300">01</span>
            <p className="text-sm font-extrabold tracking-widest" style={{ color: "rgba(167,139,250,0.9)" }}>
              TOP SCHOLARS
            </p>
          </div>

          {/* Period tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
            {([ ["allTime", "🌐 All Time"], ["weekly", "📅 This Week"], ["monthly", "🗓 This Month"] ] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setScholarTab(tab)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition"
                style={{
                  background: scholarTab === tab ? "rgba(124,58,237,0.45)" : "transparent",
                  color: scholarTab === tab ? "#c4b5fd" : "rgba(200,200,255,0.4)",
                  border: scholarTab === tab ? "1px solid rgba(124,58,237,0.6)" : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Period label */}
          <p className="text-xs text-center -mt-1" style={{ color: "rgba(200,200,255,0.3)" }}>
            {scholarTab === "allTime" && "All-time best scores — never resets"}
            {scholarTab === "weekly"  && `Week ${scholars.weekKey || "—"} · resets every Monday`}
            {scholarTab === "monthly" && `${scholars.monthKey || "—"} · resets each month`}
          </p>

          {/* Scholar list */}
          {(() => {
            const list = (Array.isArray(scholars[scholarTab]) ? scholars[scholarTab] : [])
              .filter((entry): entry is ScholarEntry => Boolean(entry?.name));
            if (!list || list.length === 0) return (
              <div className="py-8 text-center space-y-2">
                <p className="font-mono text-2xl text-violet-300">--</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  No scholars yet — finish a game to claim the top spot!
                </p>
              </div>
            );
            return (
              <div className="space-y-2">
                {list.map((s) => {
                  const colors = SCHOLAR_BADGE_COLORS[s.rank - 1];
                  return (
                    <div key={s.rank} className="flex items-center gap-3 rounded-xl px-4 py-3 transition"
                      style={{
                        background: colors ? colors.bg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${colors ? colors.border : "rgba(120,80,255,0.2)"}`,
                      }}>
                      <span className="text-xl w-7 text-center shrink-0">
                        {SCHOLAR_BADGES[s.rank - 1] ?? `#${s.rank}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm truncate"
                          style={{ color: colors ? colors.name : "rgba(220,220,255,0.85)" }}>
                          {s.name}
                        </p>
                        <p className="text-xs" style={{ color: "rgba(200,200,255,0.4)" }}>
                          Best: <span style={{ color: "#4ade80" }}>{s.best} pts</span>
                          &nbsp;·&nbsp; Total: {s.total} pts &nbsp;·&nbsp; {s.games} game{s.games !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-base tabular-nums" style={{ color: "#f97316" }}>{s.best}</p>
                        <p className="text-xs" style={{ color: "rgba(200,200,255,0.35)" }}>best</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <p className="text-xs text-center pt-1" style={{ color: "rgba(200,200,255,0.2)" }}>
            Updates live after every game · Saved permanently
          </p>
        </div>

      </div>
    </div>
  );

  // ─── ROOM ─────────────────────────────────────────────────────────────────

  if (screen === "room") return (
      <div className="play-screen min-h-screen p-4">
      <ToastBar toasts={toasts} />
      <div className="play-theme-toggle"><ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} /></div>
      <div className="room-lobby max-w-5xl mx-auto space-y-5 py-10">
        <section className="room-lobby-hero glass">
          <div className="room-lobby-message">
            <p className="room-lobby-kicker">TRAMA CHALLENGE · LIVE ROOM</p>
            <h1>You're in.</h1>
            <p>The coordinator will start the quiz shortly. Keep this screen open.</p>
            {seasonProgress && <span className="room-season-chip">{seasonProgress.title} · Quiz {seasonProgress.index} of {seasonProgress.total}</span>}
          </div>
          <div className="room-pin-block">
            <span>GAME PIN</span>
            <strong>{roomCode}</strong>
            <button type="button" onClick={copyLink}>{copied ? "Join link copied" : "Copy join link"}</button>
          </div>
        </section>
        <section className="room-player-panel glass" aria-labelledby="room-player-heading">
          <div className="room-player-heading">
            <div><p className="room-lobby-kicker">THE ROOM</p><h2 id="room-player-heading">Players have joined</h2></div>
            <span className="room-player-count"><i />{players.length} {players.length === 1 ? "player" : "players"}</span>
          </div>
          {players.length === 0 ? <p className="room-player-empty">Waiting for players to join this PIN…</p> : (
            <ul className="room-player-wall">
              {players.map((player, index) => {
                const avatar = ["✦", "⚡", "◈", "✿", "★", "◆", "●", "▲"][index % 8];
                return (
                  <li key={player.id} className={`room-player-tile room-player-tile-${index % 6}`}>
                    <span className="room-player-avatar" aria-hidden="true">{avatar}</span>
                    <span className="room-player-name">{player.name}</span>
                    {player.name === username && <span className="room-player-you">YOU</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <p className="room-lobby-note">Questions, PINs, and starts are controlled by a Trama coordinator.</p>
      </div>
    </div>
  );

  if (false) return (
    <div className="min-h-screen p-4" style={{ background: "#07071a" }}>
      <ToastBar toasts={toasts} />
      <div className="max-w-2xl mx-auto space-y-4 py-6">

        {/* Room header */}
        <div className="glass p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>ROOM CODE</p>
            <p className="text-3xl font-extrabold font-mono tracking-widest text-white">{roomCode}</p>
          </div>
          <div className="flex gap-2">
            <input readOnly value={shareUrl}
              className="hidden sm:block px-3 py-2 rounded-lg text-xs font-mono max-w-[180px] truncate"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", color: "rgba(200,200,255,0.5)" }} />
            <button onClick={copyLink} className="neon-btn px-4 py-2 text-sm" style={copied ? { background: "#059669" } : {}}>
              {copied ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Players */}
          <div className="glass p-5 space-y-3">
            <p className="text-xs font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>PLAYERS ({players.length})</p>
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#7c3aed", boxShadow: "0 0 6px #7c3aed" }} />
                  {p.name}
                  {p.name === username && <span className="text-xs" style={{ color: "var(--color-muted)" }}>(you)</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Config */}
          <div className="sm:col-span-2 glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
                GAME SETTINGS {!isHost && <span className="ml-1 normal-case font-normal">(host controls)</span>}
              </p>
              {isHost && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(124,58,237,0.3)", color: "#a78bfa" }}>HOST</span>}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2">
              <TabBtn active={config.mode === "quiz"} onClick={() => isHost && pushConfig({ mode: "quiz" })}>Quiz Battle</TabBtn>
              <TabBtn active={config.mode === "custom"} onClick={() => isHost && pushConfig({ mode: "custom" })}>Custom Quiz</TabBtn>
              <TabBtn active={config.mode === "summary"} onClick={() => isHost && pushConfig({ mode: "summary" })}>Summary</TabBtn>
            </div>

            {/* Built-in quiz settings */}
            {config.mode === "quiz" && (
              <>
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>Subject</p>
                  <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {quizCats.map((cat) => (
                      <button key={cat.key} disabled={!isHost}
                        onClick={() => pushConfig({ categoryKey: cat.key, topicKey: cat.topics[0]?.key ?? "" })}
                        className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs font-semibold transition"
                        style={{
                          background: config.categoryKey === cat.key ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                          borderColor: config.categoryKey === cat.key ? "#7c3aed" : "rgba(120,80,255,0.2)",
                          color: config.categoryKey === cat.key ? "#e8e8ff" : "rgba(200,200,255,0.5)",
                        }}>
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-center leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>Topic</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTopics.map((t) => (
                      <Pill key={t.key} active={config.topicKey === t.key} disabled={!isHost} onClick={() => pushConfig({ topicKey: t.key })}>{t.name}</Pill>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>Difficulty</p>
                    <div className="grid grid-cols-2 gap-1">
                      {DIFFS.map((d) => (
                        <button key={d} disabled={!isHost} onClick={() => pushConfig({ difficulty: d })}
                          className="py-1.5 rounded-lg text-xs font-bold border transition capitalize"
                          style={{ background: config.difficulty === d ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.05)", borderColor: config.difficulty === d ? "#f97316" : "rgba(120,80,255,0.2)", color: config.difficulty === d ? "#f97316" : "rgba(200,200,255,0.5)" }}>
                          {d === "mixed" ? "Mixed" : d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Hard"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>Questions</p>
                    <div className="grid grid-cols-2 gap-1">
                      {COUNTS.map((n) => (
                        <Pill key={n} active={config.questionCount === n} disabled={!isHost} onClick={() => pushConfig({ questionCount: n })}>{n}</Pill>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Summary category */}
            {config.mode === "summary" && (
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>Passage Category</p>
                <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {sumCats.map((cat) => (
                    <button key={cat.key} disabled={!isHost} onClick={() => pushConfig({ summaryCategory: cat.key })}
                      className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs font-semibold transition"
                      style={{ background: config.summaryCategory === cat.key ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)", borderColor: config.summaryCategory === cat.key ? "#7c3aed" : "rgba(120,80,255,0.2)", color: config.summaryCategory === cat.key ? "#e8e8ff" : "rgba(200,200,255,0.5)" }}>
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="leading-tight text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timer */}
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
                {config.mode === "quiz" || config.mode === "custom" ? "Seconds per question" : "Total time (seconds)"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(config.mode === "summary" ? TIMERS_SUM : TIMERS_QUIZ).map((s) => (
                  <Pill key={s} active={config.timerSeconds === s} disabled={!isHost} onClick={() => pushConfig({ timerSeconds: s })}>{s}s</Pill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom quiz builder */}
        {config.mode === "custom" && (
          <div className="glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
                CUSTOM QUESTIONS ({customQs.length})
              </p>
              {customQs.length > 0 && isHost && (
                <button onClick={() => setCustomQs([])}
                  className="text-xs px-2 py-1 rounded transition hover:text-red-400"
                  style={{ color: "rgba(200,200,255,0.4)", border: "1px solid rgba(120,80,255,0.2)" }}>
                  Clear all
                </button>
              )}
            </div>
            <QuizBuilder questions={customQs} onChange={setCustomQs} isHost={isHost} />
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {isHost ? (
          <div className="space-y-3">
            <button className="neon-btn w-full text-lg py-4 glow-btn" onClick={startGame}>
              🚀 Start Game {config.mode === "custom" ? `(${customQs.length} questions)` : ""}
            </button>
            <button onClick={toggleAutoPlay}
              className="w-full rounded-xl py-3 text-sm font-extrabold transition"
              style={{
                background: autoPlay ? "rgba(16,185,129,0.18)" : "rgba(6,182,212,0.12)",
                border: `1px solid ${autoPlay ? "rgba(16,185,129,0.65)" : "rgba(6,182,212,0.45)"}`,
                color: autoPlay ? "#6ee7b7" : "#67e8f9",
              }}>
              {autoPlay ? "■ Stop 24/7 Auto Play" : "∞ Start 24/7 Auto Play"}
            </button>
            <p className="text-center text-xs" style={{ color: "var(--color-muted)" }}>
              {autoPlayStatus === "next"
                ? "Next quiz starts automatically in a few seconds…"
                : autoPlay
                  ? "Rounds repeat continuously with no manual clicks."
                  : "Run quizzes continuously for an always-on livestream."}
            </p>
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-white">YouTube Live</p>
                  <p className="text-xs" style={{ color: "rgba(252,165,165,0.75)" }}>
                    {youtubeLive ? "Broadcast created for your connected channel." : "Connect this host screen to YouTube."}
                  </p>
                </div>
                <button onClick={prepareYouTubeLive} disabled={youtubeLoading || youtubeQuotaBlocked}
                  className="rounded-lg px-3 py-2 text-xs font-extrabold transition"
                  style={{ background: "#ef4444", color: "#fff", opacity: youtubeLoading ? 0.6 : 1 }}>
                  {youtubeLoading ? "Creating…" : youtubeQuotaBlocked ? "Quota Used" : youtubeLive ? "Create New" : "Set Up Live"}
                </button>
              </div>
              {youtubeLive && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={toggleBrowserBroadcast}
                    className="rounded-lg px-3 py-2 text-xs font-extrabold"
                    style={{ background: youtubeStreaming ? "#991b1b" : "#dc2626", color: "#fff" }}>
                    {youtubeStreaming ? "Stop Browser Broadcast" : "Start Browser Broadcast"}
                  </button>
                  <a href={youtubeLive?.watchUrl} target="_blank" rel="noreferrer"
                    className="rounded-lg px-3 py-2 text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#fecaca" }}>
                    Open YouTube Watch Page
                  </a>
                  <a href={youtubeLive?.studioUrl} target="_blank" rel="noreferrer"
                    className="rounded-lg px-3 py-2 text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#fecaca" }}>
                    Open YouTube Studio
                  </a>
                </div>
              )}
              {youtubeLive && (
                <p className="text-xs" style={{ color: "rgba(252,165,165,0.72)" }}>
                  {youtubeStreaming
                    ? "Your shared host screen is being sent to YouTube. Keep this tab open."
                    : "Click Start Browser Broadcast, then choose this host screen when your browser asks."}
                </p>
              )}
              {youtubeError && <p className="text-xs text-red-300">{youtubeError}</p>}
            </div>
          </div>
        ) : (
          <div className="glass p-4 text-center" style={{ color: "var(--color-muted)" }}>
            Waiting for the host to start…
            {config.mode === "custom" && customQs.length > 0 && (
              <p className="text-xs mt-1">Custom quiz with {customQs.length} question{customQs.length !== 1 ? "s" : ""}</p>
            )}
          </div>
        )}
        <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>
          {isHost ? "Only you can change settings and start the game." : "Only the host can start the game."}
        </p>
      </div>
    </div>
  );

  // ─── QUIZ / CUSTOM QUIZ ───────────────────────────────────────────────────

  if (screen === "quiz") {
    const opts = question?.options ?? [];
    return (
      <div className="play-screen min-h-screen p-4 flex flex-col">
        <ToastBar toasts={toasts} />
        <div className="play-theme-toggle"><ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} /></div>
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-3">
          <div className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
            {question ? `Q ${question.index + 1} / ${question.total}` : "Loading…"}
            {question && (
              <span className="ml-2 capitalize px-2 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(255,255,255,0.08)", color: question.difficulty === "easy" ? "#4ade80" : question.difficulty === "hard" ? "#f87171" : "#facc15" }}>
                {question.difficulty}
              </span>
            )}
          </div>
          <div className="font-extrabold tabular-nums text-2xl"
            style={{ color: timeLeft <= 5 ? "#ef4444" : timeLeft <= 15 ? "#facc15" : "#4ade80" }}>
            {timeLeft}s
          </div>
        </div>

        {question && phase === "question" && (
          <div className="max-w-2xl mx-auto w-full mb-4">
            <TimerBar seconds={question.timerSeconds} timerKey={timerKey} />
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full glass p-6 space-y-5 animate-slide-up">
          {question ? (
            <>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--color-muted)" }}>
                  {question.type === "tf" ? "TRUE OR FALSE" : "MULTIPLE CHOICE"} · {question.points} pts
                </p>
                <p className="text-lg font-bold text-white leading-relaxed">{question.q}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {opts.map((opt, i) => {
                  const label = question.type === "tf" ? opt : (LABELS[i] ?? opt);
                  const answerLabel = question.type === "tf" ? opt : LABELS[i];
                  const isSelected = selected === answerLabel;
                  const isCorrect = phase === "reveal" && questionEnd?.correctAnswer === answerLabel;
                  const isWrong   = phase === "reveal" && isSelected && !isCorrect;
                  return (
                    <button key={i} disabled={!!selected || phase === "reveal"}
                      onClick={() => submitAnswer(answerLabel)}
                      className={`ans-btn ${BTN_CLASSES[i] ?? ""} ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}>
                      {question.type !== "tf" && (
                        <span className={`w-7 h-7 rounded-md text-xs font-extrabold flex items-center justify-center shrink-0 ${LABEL_CLASSES[i] ?? ""}`}>
                          {LABELS[i]}
                        </span>
                      )}
                      <span>{opt}</span>
                      {isCorrect && <span className="ml-auto text-green-400 text-xs font-bold">Correct</span>}
                      {isWrong   && <span className="ml-auto text-red-400 text-xs font-bold">Miss</span>}
                    </button>
                  );
                })}
              </div>

              {selected && phase === "question" && !questionEnd && (
                <p className="text-center text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                  Answer locked — waiting for others…
                </p>
              )}

              {phase === "reveal" && questionEnd && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(120,80,255,0.25)" }}>
                  {myResult && (
                    <div className="space-y-1 text-center">
                      <div className={`text-2xl font-extrabold ${myResult.correct ? "text-green-400" : "text-red-400"}`}>
                         {myResult.correct ? `Correct! +${myResult.delta} pts` : `Wrong — answer was ${questionEnd.correctAnswer}`}
                      </div>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {myResult.answerTimeMs === null
                          ? "No answer before the timer ended"
                          : `Answered in ${(myResult.answerTimeMs / 1000).toFixed(1)}s${myResult.speedBonus > 0 ? ` · +${myResult.speedBonus} speed bonus` : ""}`}
                      </p>
                    </div>
                  )}
                  {questionEnd.explanation && (
                    <p className="text-sm text-center" style={{ color: "var(--color-muted)" }}>{questionEnd.explanation}</p>
                  )}
                  <div className="space-y-1">
                    {questionEnd.scores.slice(0, 5).map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white flex items-center gap-2">
                          {i < 3 ? `0${i + 1}` : `#${i + 1}`} {s.name}
                        </span>
                        <span className="text-right">
                          <span className="font-bold" style={{ color: "#f97316" }}>{s.score} pts</span>
                          {s.answerTimeMs !== null && (
                            <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>
                              {(s.answerTimeMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>Next question coming up…</p>
                </div>
              )}

              {isHost && phase === "question" && (
                <button onClick={() => socketRef.current?.emit("hostSkip")}
                  className="w-full py-2 rounded-lg text-xs font-semibold transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", color: "rgba(200,200,255,0.5)" }}>
                  Skip Question (host)
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="font-mono text-2xl animate-pulse text-violet-300">...</div>
              <p className="font-bold text-white">Get ready!</p>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto w-full mt-4 flex gap-2 flex-wrap">
          {[...players].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
            <div key={p.id} className="glass px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
              <span>{i < 3 ? `0${i + 1}` : `#${i + 1}`}</span>
              <span className="text-white">{p.name}</span>
              <span style={{ color: "#f97316" }}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  if (screen === "summary") {
    const wc = summaryText.trim().split(/\s+/).filter(Boolean).length;
    const tc = summaryTime;
    const tColor = tc > 60 ? "#4ade80" : tc > 30 ? "#facc15" : "#f87171";
    return (
      <div className="play-screen min-h-screen p-4 flex flex-col">
        <ToastBar toasts={toasts} />
        <div className="play-theme-toggle"><ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} /></div>
        <div className="max-w-xl mx-auto w-full space-y-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white">Trama Challenge</h2>
            <span className="text-3xl font-extrabold tabular-nums" style={{ color: tColor }}>{tc}s</span>
          </div>
          <div className="glass p-5 text-sm leading-relaxed text-white">
            <p className="text-xs font-bold mb-2" style={{ color: "var(--color-muted)" }}>PASSAGE</p>
            {passage || <span style={{ color: "var(--color-muted)" }}>Loading…</span>}
          </div>
          {!summarySubmitted ? (
            <div className="space-y-3">
              <div className="relative">
                <textarea value={summaryText} onChange={(e) => setSummaryText(e.target.value)}
                  rows={5} placeholder="Write your summary here (15–40 words for bonus points)…"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(120,80,255,0.35)" }} />
                <span className="absolute bottom-3 right-3 text-xs" style={{ color: "var(--color-muted)" }}>{wc} words</span>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button className="neon-btn w-full" onClick={submitSummary}>Submit Summary</button>
            </div>
          ) : (
            <div className="glass p-6 text-center space-y-2">
               <div className="text-sm font-bold uppercase tracking-widest text-green-400">Received</div>
              <p className="font-bold text-white">Summary submitted!</p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>Waiting for the round to end…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── FINISHED / PODIUM ────────────────────────────────────────────────────

  if (screen === "finished") {
    const medals = ["01", "02", "03"];
    const rankClass = ["rank-1","rank-2","rank-3"];
    return (
      <div className="play-screen min-h-screen p-4 flex flex-col items-center justify-start py-10">
        <ToastBar toasts={toasts} />
        <div className="play-theme-toggle"><ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} /></div>
        <div className="w-full max-w-lg space-y-6 animate-pop-in">
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-extrabold"
              style={{ background: "linear-gradient(135deg,#f97316,#facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Game Over!
            </h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Final leaderboard</p>
          </div>

          {leaderboard.length >= 2 && (
            <div className="flex items-end justify-center gap-3 py-2">
              {[1, 0, 2].map((ri) => {
                const entry = leaderboard[ri];
                if (!entry) return null;
                const heights = [24, 32, 20];
                return (
                  <div key={ri} className="flex flex-col items-center gap-2" style={{ width: 96 }}>
                    <span className="text-3xl">{medals[ri]}</span>
                    <p className="font-bold text-sm text-white text-center leading-tight">{entry.name}</p>
                    <div className="w-full rounded-t-xl flex items-end justify-center pb-2 font-extrabold text-sm"
                      style={{ height: heights[ri] * 4, background: ri === 0 ? "rgba(234,179,8,0.25)" : ri === 1 ? "rgba(156,163,175,0.15)" : "rgba(180,83,9,0.15)", border: "1px solid", borderColor: ri === 0 ? "rgba(234,179,8,0.5)" : ri === 1 ? "rgba(156,163,175,0.4)" : "rgba(180,83,9,0.4)", color: "#f97316" }}>
                      {entry.score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={i} className={`glass flex items-center justify-between px-5 py-4 border ${rankClass[i] ?? ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[i] ?? `#${i+1}`}</span>
                  <span className="font-semibold text-white">
                    {entry.name}
                    {entry.name === username && <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>(you)</span>}
                  </span>
                </div>
                <span className="font-extrabold text-xl" style={{ color: "#f97316" }}>{entry.score} pts</span>
              </div>
            ))}
          </div>

          {seasonProgress?.nextCode && (
            <div className="season-next-card">
              <div><span>{seasonProgress.title}</span><strong>Quiz {seasonProgress.index + 1} of {seasonProgress.total} is ready</strong><small>Next PIN: {seasonProgress.nextCode}</small></div>
              <button type="button" className="neon-btn" onClick={joinNextSeasonQuiz}>Join next quiz</button>
            </div>
          )}
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <button className="neon-btn w-full text-lg glow-btn" onClick={playAgain}>{seasonProgress?.nextCode ? "Finish season" : "Play Again"}</button>
        </div>
      </div>
    );
  }

  return null;
}
