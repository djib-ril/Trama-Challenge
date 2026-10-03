import { useState } from "react";
import { Activity, Check, Copy, FastForward, Gauge, LogOut, Moon, Play, Radio, Square, Sun, Users } from "lucide-react";

type GameConfig = {
  mode: "quiz" | "summary" | "custom";
  categoryKey: string;
  topicKey: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  timerSeconds: number;
  questionCount: number;
  summaryCategory: string;
};

export type CustomQ = {
  id: string;
  type: "mc" | "tf";
  q: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

type QuizCategory = { key: string; name: string; topics: Array<{ key: string; name: string }> };
type YouTubeLive = {
  watchUrl: string;
  studioUrl: string;
  title: string;
  status: string;
  broadcastId?: string;
};
type Theme = "light" | "dark";

export type AdminPlayer = { id: string; name: string; score: number; streak: number };
export type AdminRoom = {
  code: string;
  isActive: boolean;
  phase: string;
  questionIndex: number;
  totalQuestions: number;
  autoPlay: boolean;
  hostName: string;
  players: AdminPlayer[];
  season?: { title: string; index: number; total: number };
};

type CreateResult = { ok: boolean; code?: string; message?: string };
type SeasonQuizConfig = { title: string; config: GameConfig };
type SeasonCreateResult = { ok: boolean; rooms?: Array<{ code: string; title: string; index: number; total: number }>; message?: string };
type AdminDashboardProps = {
  rooms: AdminRoom[];
  quizCats: QuizCategory[];
  onCreateRoom: (payload: { config: GameConfig; customQuestions: CustomQ[] }, callback: (result: CreateResult) => void) => void;
  onCreateSeason: (payload: { title: string; quizzes: SeasonQuizConfig[] }, callback: (result: SeasonCreateResult) => void) => void;
  onStart: (code: string) => void;
  onSkip: (code: string) => void;
  onStop: (code: string) => void;
  onToggleAutoPlay: (code: string, enabled: boolean) => void;
  youtubeLive: YouTubeLive | null;
  youtubeLoading: boolean;
  youtubeError: string;
  youtubeQuotaBlocked: boolean;
  youtubeStreaming: boolean;
  onPrepareYouTube: () => void;
  onToggleYouTube: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
};

const labels = ["A", "B", "C", "D"];

function newQuestion(): CustomQ {
  return {
    id: Math.random().toString(36).slice(2),
    type: "mc",
    q: "",
    options: ["", "", "", ""],
    answer: "A",
    explanation: "",
    difficulty: "medium",
  };
}

function StatusDot({ active }: { active: boolean }) {
  return <span aria-hidden="true" className={`admin-status-dot ${active ? "live" : ""}`} />;
}

function StatBlock({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="admin-stat">
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-note">{note}</p>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: AdminPlayer; rank: number }) {
  const initials = player.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return (
    <li className="admin-player-row">
      <span className="admin-player-rank">{String(rank).padStart(2, "0")}</span>
      <span className={`admin-player-avatar ${rank === 1 ? "first" : ""}`}>{initials || "?"}</span>
      <div className="admin-player-name">
        <p>{player.name}</p>
        <p className="admin-player-streak">{player.streak > 0 ? `${player.streak} answer streak` : "No active streak"}</p>
      </div>
      <div className="admin-player-score"><p>{player.score.toLocaleString()}</p><small>points</small></div>
    </li>
  );
}

function RoomControls({
  room,
  onStart,
  onSkip,
  onStop,
  onToggleAutoPlay,
}: {
  room: AdminRoom;
  onStart: (code: string) => void;
  onSkip: (code: string) => void;
  onStop: (code: string) => void;
  onToggleAutoPlay: (code: string, enabled: boolean) => void;
}) {
  return (
    <div className="admin-control-group">
      <button type="button" className="admin-control start" onClick={() => onStart(room.code)} disabled={room.isActive}>
        <Play size={12} strokeWidth={2.5} /> Start quiz
      </button>
      <button type="button" className="admin-control" onClick={() => onToggleAutoPlay(room.code, !room.autoPlay)} disabled={Boolean(room.season)}>
        <Radio size={12} strokeWidth={2.5} /> {room.season ? "Season sequence" : room.autoPlay ? "Stop auto-play" : "24/7 auto-play"}
      </button>
      <button type="button" className="admin-control" onClick={() => onSkip(room.code)} disabled={!room.isActive || room.totalQuestions < 1}>
        <FastForward size={12} strokeWidth={2.5} /> Skip
      </button>
      <button type="button" className="admin-control stop" onClick={() => onStop(room.code)} disabled={!room.isActive}>
        <Square size={11} fill="currentColor" strokeWidth={2.5} /> Stop
      </button>
    </div>
  );
}

function RoomCard({
  room,
  featured,
  index,
  onStart,
  onSkip,
  onStop,
  onToggleAutoPlay,
}: {
  room: AdminRoom;
  featured: boolean;
  index: number;
  onStart: (code: string) => void;
  onSkip: (code: string) => void;
  onStop: (code: string) => void;
  onToggleAutoPlay: (code: string, enabled: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const players = [...room.players].sort((a, b) => b.score - a.score);
  const currentQuestion = room.totalQuestions > 0 ? Math.min(room.totalQuestions, Math.max(1, room.questionIndex + 1)) : 0;
  const progress = room.totalQuestions > 0 ? (currentQuestion / room.totalQuestions) * 100 : 0;

  async function copyRoomPin() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={`admin-room-card ${featured ? "featured" : ""} ${room.isActive ? "is-live" : ""}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="admin-room-inner">
        <div className="admin-room-top">
          <div className="admin-room-identity">
            <div className="admin-room-code-block" aria-hidden="true">{room.code.slice(0, 2)}</div>
            <div className="min-w-0">
              <div className="admin-room-code-line">
                <h3 className="admin-room-code">{room.code}</h3>
                <span className={`admin-room-status ${room.isActive ? "live" : ""}`}><StatusDot active={room.isActive} />{room.isActive ? "On air" : "Standby"}</span>
              </div>
              <p className="admin-room-host">
                Created by <strong>{room.hostName || "Trama coordinator"}</strong>
                {room.season && <span className="admin-room-season-tag">{room.season.title} · quiz {room.season.index}/{room.season.total}</span>}
              </p>
            </div>
          </div>
          <div className="admin-room-tools">
            <span className={`admin-mode ${room.autoPlay ? "auto" : ""}`}>{room.autoPlay ? "24/7 auto-play" : "Manual run"}</span>
            <button type="button" className="admin-copy" onClick={copyRoomPin}>
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy PIN"}
            </button>
          </div>
        </div>

        <div className="admin-metrics">
          <div><p className="admin-metric-label">Phase</p><p className="admin-metric-value">{room.phase || "Waiting"}</p></div>
          <div><p className="admin-metric-label">Question</p><p className="admin-metric-value aqua">{room.totalQuestions ? `${currentQuestion} / ${room.totalQuestions}` : "Ready-made"}</p></div>
          <div><p className="admin-metric-label">Players</p><p className="admin-metric-value aqua">{room.players.length}</p></div>
          <div><p className="admin-metric-label">Top score</p><p className="admin-metric-value amber">{players[0]?.score?.toLocaleString() ?? "—"}</p></div>
        </div>

        <div>
          <div className="admin-progress-head"><span>Round progress</span><span>{room.totalQuestions ? `${Math.round(progress)}%` : "Waiting for players"}</span></div>
          <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className={`admin-roster ${featured ? "" : "compact"}`}>
          <div className="admin-roster-head"><h4 className="admin-roster-title">Participant roster</h4><span className="admin-roster-note">{players.length ? "Sorted by score" : "No participants yet"}</span></div>
          {players.length ? <ul>{players.map((player, playerIndex) => <PlayerRow key={player.id} player={player} rank={playerIndex + 1} />)}</ul> : (
            <div className="admin-empty" style={{ minHeight: 130, marginTop: "0.55rem", padding: "1.2rem" }}><Users size={20} strokeWidth={1.7} /><p className="mt-2">Share the PIN to bring participants in.</p></div>
          )}
        </div>

        <div className="admin-controls"><p className="admin-controls-label">{room.isActive ? "Live controls" : "Ready to launch"}</p><RoomControls room={room} onStart={onStart} onSkip={onSkip} onStop={onStop} onToggleAutoPlay={onToggleAutoPlay} /></div>
      </div>
    </article>
  );
}

function CreateRoomPanel({
  quizCats,
  onCreateRoom,
}: {
  quizCats: QuizCategory[];
  onCreateRoom: AdminDashboardProps["onCreateRoom"];
}) {
  const [mode, setMode] = useState<"quiz" | "custom">("quiz");
  const [config, setConfig] = useState<GameConfig>({
    mode: "quiz",
    categoryKey: "math",
    topicKey: "algebra",
    difficulty: "mixed",
    timerSeconds: 30,
    questionCount: 10,
    summaryCategory: "random",
  });
  const [questions, setQuestions] = useState<CustomQ[]>([]);
  const [draft, setDraft] = useState<CustomQ>(newQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [builderError, setBuilderError] = useState("");
  const [createdPin, setCreatedPin] = useState("");
  const [copiedPin, setCopiedPin] = useState(false);
  const [createError, setCreateError] = useState("");

  const currentCategory = quizCats.find((category) => category.key === config.categoryKey);

  function addQuestion() {
    if (!draft.q.trim()) { setBuilderError("Write the question before adding it."); return; }
    if (draft.type === "mc" && draft.options.slice(0, 2).some((option) => !option.trim())) { setBuilderError("Add at least options A and B."); return; }
    const normalized = { ...draft, q: draft.q.trim(), options: draft.type === "tf" ? ["True", "False"] : draft.options.map((option) => option.trim()) };
    setQuestions((current) => editingId ? current.map((question) => question.id === editingId ? normalized : question) : [...current, normalized]);
    setDraft(newQuestion());
    setEditingId(null);
    setBuilderError("");
  }

  function editQuestion(question: CustomQ) {
    setDraft({ ...question, options: [...question.options] });
    setEditingId(question.id);
    setBuilderError("");
  }

  async function copyCreatedPin() {
    if (!createdPin) return;
    try {
      await navigator.clipboard.writeText(createdPin);
      setCopiedPin(true);
      window.setTimeout(() => setCopiedPin(false), 1800);
    } catch {
      setCopiedPin(false);
    }
  }

  async function shareCreatedPin() {
    if (!createdPin) return;
    const url = new URL(window.location.href);
    url.search = `?room=${createdPin}`;
    try {
      if (navigator.share) await navigator.share({ title: "Join Trama Challenge", text: `Join my Trama Challenge game with PIN ${createdPin}.`, url: url.toString() });
      else await navigator.clipboard.writeText(url.toString());
    } catch {
      // Sharing can be cancelled by the browser; the visible PIN remains available.
    }
  }

  function createRoom() {
    setCreateError("");
    if (mode === "custom" && questions.length === 0) { setCreateError("Add at least one question first."); return; }
    onCreateRoom({ config: { ...config, mode }, customQuestions: mode === "custom" ? questions : [] }, (result) => {
      if (!result.ok) { setCreateError(result.message ?? "The room could not be created."); return; }
      setCreatedPin(result.code ?? "");
    });
  }

  function updateDraft(patch: Partial<CustomQ>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="admin-create-panel" aria-labelledby="create-room-title">
      <div className="admin-create-copy">
        <p className="admin-kicker">New broadcast</p>
        <h2 id="create-room-title">Create a quiz and issue its PIN.</h2>
        <p>Choose the ready-made question bank or write your own questions. Guests cannot create rooms; they only join the PIN you share.</p>
      </div>

      <div className="admin-create-workspace">
        <div className="admin-create-tabs" role="tablist" aria-label="Quiz type">
          <button type="button" className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")}>Ready-made quiz</button>
          <button type="button" className={mode === "custom" ? "active" : ""} onClick={() => setMode("custom")}>Create questions</button>
        </div>

        {mode === "quiz" ? (
          <div className="admin-form-grid">
            <label className="admin-field"><span>Subject</span><select value={config.categoryKey} onChange={(event) => {
              const categoryKey = event.target.value;
              setConfig((current) => ({ ...current, categoryKey, topicKey: quizCats.find((category) => category.key === categoryKey)?.topics[0]?.key ?? "" }));
            }}>{quizCats.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}</select></label>
            <label className="admin-field"><span>Topic</span><select value={config.topicKey} onChange={(event) => setConfig((current) => ({ ...current, topicKey: event.target.value }))}>{(currentCategory?.topics ?? []).map((topic) => <option key={topic.key} value={topic.key}>{topic.name}</option>)}</select></label>
            <label className="admin-field"><span>Difficulty</span><select value={config.difficulty} onChange={(event) => setConfig((current) => ({ ...current, difficulty: event.target.value as GameConfig["difficulty"] }))}><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            <label className="admin-field"><span>Questions</span><select value={config.questionCount} onChange={(event) => setConfig((current) => ({ ...current, questionCount: Number(event.target.value) }))}>{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} questions</option>)}</select></label>
            <label className="admin-field"><span>Seconds per question</span><select value={config.timerSeconds} onChange={(event) => setConfig((current) => ({ ...current, timerSeconds: Number(event.target.value) }))}>{[15, 30, 45, 60, 90].map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
          </div>
        ) : (
          <div className="admin-question-builder">
            <div className="admin-question-list">
              {questions.length === 0 ? <p className="admin-question-empty">Your questions will appear here as you add them.</p> : questions.map((question, index) => (
                <div key={question.id} className="admin-question-row">
                  <span className="admin-question-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{question.q}</strong><small>{question.type === "mc" ? `${question.options.filter(Boolean).length} options` : "True / False"} · {question.difficulty}{question.explanation ? " · explanation added" : ""}</small></div>
                  <div className="admin-question-actions"><button type="button" onClick={() => editQuestion(question)}>Edit</button><button type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className="admin-question-editor">
              <div className="admin-editor-head"><span>{editingId ? "Edit question" : "New question"}</span><div><button type="button" className={draft.type === "mc" ? "active" : ""} onClick={() => updateDraft({ type: "mc", options: ["", "", "", ""], answer: "A" })}>Multiple choice</button><button type="button" className={draft.type === "tf" ? "active" : ""} onClick={() => updateDraft({ type: "tf", options: ["True", "False"], answer: "True" })}>True / False</button></div></div>
              <textarea value={draft.q} onChange={(event) => updateDraft({ q: event.target.value })} placeholder="Write the question prompt…" rows={2} />
              {draft.type === "mc" && <div className="admin-option-grid">{draft.options.map((option, index) => <label key={labels[index]}><span>{labels[index]}</span><input value={option} onChange={(event) => {
                const options = [...draft.options]; options[index] = event.target.value; updateDraft({ options });
              }} placeholder={`Option ${labels[index]}`} /></label>)}</div>}
              <div className="admin-editor-bottom"><label className="admin-field"><span>Correct answer</span><select value={draft.answer} onChange={(event) => updateDraft({ answer: event.target.value })}>{(draft.type === "mc" ? labels : ["True", "False"]).map((answer) => <option key={answer} value={answer}>{answer}</option>)}</select></label><label className="admin-field"><span>Difficulty</span><select value={draft.difficulty} onChange={(event) => updateDraft({ difficulty: event.target.value as CustomQ["difficulty"] })}><option value="easy">Easy · 100</option><option value="medium">Medium · 200</option><option value="hard">Hard · 300</option></select></label></div>
              <label className="admin-field admin-explanation-field"><span>Explanation shown after reveal</span><textarea value={draft.explanation} onChange={(event) => updateDraft({ explanation: event.target.value })} placeholder="Optional teaching note…" rows={2} /></label>
              {builderError && <p className="admin-form-error">{builderError}</p>}
              <div className="admin-editor-actions"><button type="button" className="admin-add-question" onClick={addQuestion}>{editingId ? "Save question changes" : "Add question to this quiz"}</button>{editingId && <button type="button" className="admin-cancel-edit" onClick={() => { setDraft(newQuestion()); setEditingId(null); setBuilderError(""); }}>Cancel edit</button>}</div>
            </div>
          </div>
        )}

        {createError && <p className="admin-form-error">{createError}</p>}
        <div className="admin-create-actions">
          <button type="button" className="admin-primary-action" onClick={createRoom}>{mode === "custom" ? `Create PIN with ${questions.length} question${questions.length === 1 ? "" : "s"}` : "Create PIN for ready-made quiz"}</button>
          {createdPin && <div className="admin-created-pin"><span>PIN generated</span><strong>{createdPin}</strong><div className="admin-pin-actions"><button type="button" onClick={copyCreatedPin}>{copiedPin ? "Copied" : "Copy PIN"}</button><button type="button" onClick={shareCreatedPin}>Share link</button></div><small>Share this PIN, then use Start quiz below when players are ready.</small></div>}
        </div>
      </div>
    </section>
  );
}

function SeasonBuilderPanel({
  quizCats,
  onCreateSeason,
}: {
  quizCats: QuizCategory[];
  onCreateSeason: AdminDashboardProps["onCreateSeason"];
}) {
  const [title, setTitle] = useState("Trama Season");
  const [categoryKey, setCategoryKey] = useState("");
  const [topicKey, setTopicKey] = useState("");
  const [difficulty, setDifficulty] = useState<GameConfig["difficulty"]>("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [quizzes, setQuizzes] = useState<SeasonQuizConfig[]>([]);
  const [createdRooms, setCreatedRooms] = useState<NonNullable<SeasonCreateResult["rooms"]>>([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const activeCategory = quizCats.find((category) => category.key === categoryKey) ?? quizCats[0];
  const activeTopic = activeCategory?.topics.find((topic) => topic.key === topicKey) ?? activeCategory?.topics[0];

  function addQuiz() {
    if (!activeCategory || !activeTopic || quizzes.length >= 10) return;
    const config: GameConfig = {
      mode: "quiz",
      categoryKey: activeCategory.key,
      topicKey: activeTopic.key,
      difficulty,
      timerSeconds,
      questionCount,
      summaryCategory: "random",
    };
    setQuizzes((current) => [...current, { title: `${activeCategory.name} · ${activeTopic.name}`, config }]);
    setCreatedRooms([]);
    setError("");
  }

  function moveQuiz(index: number, direction: -1 | 1) {
    setQuizzes((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setCreatedRooms([]);
  }

  function createSeason() {
    if (!quizzes.length || creating) return;
    setCreating(true);
    setError("");
    onCreateSeason({ title: title.trim() || "Trama Season", quizzes }, (result) => {
      setCreating(false);
      if (!result.ok) {
        setError(result.message ?? "The season could not be created.");
        return;
      }
      setCreatedRooms(result.rooms ?? []);
    });
  }

  async function copyPin(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(""), 1600);
    } catch {
      setError("This browser could not copy the PIN. You can still select it from the list.");
    }
  }

  return (
    <section className="admin-season-panel" aria-labelledby="season-title">
      <div className="admin-season-intro">
        <p className="admin-kicker">A quiz run in order</p>
        <h2 id="season-title">Build a season of up to 10 quizzes.</h2>
        <p>Each quiz gets its own room and PIN. Players can join the next quiz directly from the results screen.</p>
      </div>
      <div className="admin-season-builder">
        <label className="admin-field admin-season-name"><span>Season name</span><input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="admin-season-form">
          <label className="admin-field"><span>Subject</span><select value={activeCategory?.key ?? ""} onChange={(event) => {
            setCategoryKey(event.target.value);
            setTopicKey(quizCats.find((category) => category.key === event.target.value)?.topics[0]?.key ?? "");
          }}>{quizCats.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}</select></label>
          <label className="admin-field"><span>Topic</span><select value={activeTopic?.key ?? ""} onChange={(event) => setTopicKey(event.target.value)}>{(activeCategory?.topics ?? []).map((topic) => <option key={topic.key} value={topic.key}>{topic.name}</option>)}</select></label>
          <label className="admin-field"><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as GameConfig["difficulty"])}><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label className="admin-field"><span>Questions</span><select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} questions</option>)}</select></label>
          <label className="admin-field"><span>Seconds per question</span><select value={timerSeconds} onChange={(event) => setTimerSeconds(Number(event.target.value))}>{[15, 30, 45, 60, 90].map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
        </div>
        <button type="button" className="admin-season-add" onClick={addQuiz} disabled={quizzes.length >= 10 || !activeTopic}>
          {quizzes.length >= 10 ? "Season limit reached" : "+ Add selected quiz"}
        </button>

        <div className="admin-season-list">
          {quizzes.length === 0 ? <p className="admin-season-empty">Choose a ready-made topic above and add it to your season.</p> : quizzes.map((quiz, index) => (
            <div className="admin-season-row" key={`${quiz.config.categoryKey}-${quiz.config.topicKey}-${index}`}>
              <span className="admin-season-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="admin-season-quiz"><strong>{quiz.title}</strong><small>{quiz.config.questionCount} questions · {quiz.config.difficulty} · {quiz.config.timerSeconds}s each</small></div>
              <div className="admin-season-reorder">
                <button type="button" aria-label="Move quiz up" disabled={index === 0} onClick={() => moveQuiz(index, -1)}>↑</button>
                <button type="button" aria-label="Move quiz down" disabled={index === quizzes.length - 1} onClick={() => moveQuiz(index, 1)}>↓</button>
                <button type="button" aria-label="Remove quiz" onClick={() => { setQuizzes((current) => current.filter((_, itemIndex) => itemIndex !== index)); setCreatedRooms([]); }}>×</button>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="admin-form-error">{error}</p>}
        <button type="button" className="admin-season-create" onClick={createSeason} disabled={!quizzes.length || creating}>
          {creating ? "Creating season PINs…" : `Create ${quizzes.length} separate quiz PIN${quizzes.length === 1 ? "" : "s"}`}
        </button>
        {createdRooms.length > 0 && (
          <div className="admin-season-pins">
            <p className="admin-season-pins-title">Season rooms are ready — share each PIN for its quiz.</p>
            {createdRooms.map((room) => (
              <div className="admin-season-pin-row" key={room.code}>
                <span>{String(room.index).padStart(2, "0")}</span><strong>{room.title}</strong><code>{room.code}</code>
                <button type="button" onClick={() => copyPin(room.code)}>{copiedCode === room.code ? "Copied" : "Copy PIN"}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminDashboard({
  rooms,
  quizCats,
  onCreateRoom,
  onCreateSeason,
  onStart,
  onSkip,
  onStop,
  onToggleAutoPlay,
  youtubeLive,
  youtubeLoading,
  youtubeError,
  youtubeQuotaBlocked,
  youtubeStreaming,
  onPrepareYouTube,
  onToggleYouTube,
  theme,
  onToggleTheme,
  onLogout,
}: AdminDashboardProps) {
  const activeRooms = rooms.filter((room) => room.isActive);
  const totalPlayers = rooms.reduce((count, room) => count + room.players.length, 0);
  const autoplayRooms = rooms.filter((room) => room.autoPlay).length;
  const featuredRoom = activeRooms[0] ?? rooms[0];
  const secondaryRooms = featuredRoom ? rooms.filter((room) => room.code !== featuredRoom.code) : [];

  return (
    <main className="admin-shell">
      <div className="admin-frame">
        <header className="admin-header">
          <div className="admin-brand"><div className="admin-brand-mark">TR</div><div><p className="admin-kicker">Trama Challenge</p><h1 className="admin-brand-title">Broadcast desk</h1></div></div>
          <div className="admin-header-status"><span className="admin-live-dot" /> <span>Realtime room telemetry</span></div>
          <div className="admin-header-actions">
            <button type="button" className="admin-theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button type="button" className="admin-logout" onClick={onLogout}><LogOut size={14} /> <span>Log out</span></button>
          </div>
        </header>

        <section className="admin-hero" aria-labelledby="admin-hero-title">
          <div className="admin-hero-copy"><p className="admin-kicker">Coordinator only / live room control</p><h2 id="admin-hero-title">Make the room. Make the moment.</h2><p>Create questions, issue a join PIN, and keep every round moving while guests play at home.</p></div>
          <div className="admin-signal-card"><div className="admin-signal-top"><span className="admin-signal-label"><Radio size={14} className="admin-signal-icon" /> Signal watch</span><span>Live feed</span></div><p className="admin-signal-count">{activeRooms.length}<span>on air</span></p><div className="admin-signal-foot"><span>{totalPlayers} participants in the mix</span><strong>{autoplayRooms} auto</strong></div></div>
        </section>

        <section className="admin-summary"><StatBlock label="Active rooms" value={activeRooms.length} note="currently on air" /><StatBlock label="Players online" value={totalPlayers} note="across all rooms" /><StatBlock label="Rooms total" value={rooms.length} note="available to coordinate" /><StatBlock label="Auto-play" value={autoplayRooms} note="running continuously" /></section>

        <CreateRoomPanel quizCats={quizCats} onCreateRoom={onCreateRoom} />
        <SeasonBuilderPanel quizCats={quizCats} onCreateSeason={onCreateSeason} />

        <section className="admin-youtube-panel" aria-labelledby="youtube-title">
          <div><p className="admin-kicker">Optional live distribution</p><h2 id="youtube-title">YouTube Live</h2><p>{youtubeLive ? "Broadcast is ready. Keep the coordinator tab open while streaming the desk." : "Reuse an existing Trama broadcast or create one through the connected YouTube channel."}</p></div>
          <div className="admin-youtube-actions"><button type="button" className="admin-youtube-button" onClick={onPrepareYouTube} disabled={youtubeLoading || youtubeQuotaBlocked}>{youtubeLoading ? "Preparing…" : youtubeQuotaBlocked ? "Quota used" : youtubeLive ? "Reuse / refresh broadcast" : "Connect YouTube Live"}</button>{youtubeLive && <><button type="button" className="admin-youtube-button secondary" onClick={onToggleYouTube}>{youtubeStreaming ? "Stop browser stream" : "Start browser stream"}</button><a href={youtubeLive.watchUrl} target="_blank" rel="noreferrer">Open watch page</a><a href={youtubeLive.studioUrl} target="_blank" rel="noreferrer">Open Studio</a></>}</div>
          {youtubeError && <p className="admin-form-error">{youtubeError}</p>}
        </section>

        <section aria-labelledby="room-activity-title">
          <div className="admin-section-head"><div><p className="admin-kicker">The live floor</p><h2 className="admin-section-title" id="room-activity-title">Room activity</h2></div><p className="admin-section-meta">{rooms.length === 0 ? "No rooms to monitor" : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} in view`}</p></div>
          {rooms.length === 0 ? <div className="admin-empty"><div className="admin-empty-mark"><Gauge size={23} strokeWidth={1.7} /></div><h3>No rooms are open</h3><p>Create a ready-made quiz or add your own questions above. Your PIN will appear here immediately.</p></div> : <div className="admin-room-grid">{featuredRoom && <RoomCard room={featuredRoom} featured index={0} onStart={onStart} onSkip={onSkip} onStop={onStop} onToggleAutoPlay={onToggleAutoPlay} />}{secondaryRooms.map((room, index) => <RoomCard key={room.code} room={room} featured={false} index={index + 1} onStart={onStart} onSkip={onSkip} onStop={onStop} onToggleAutoPlay={onToggleAutoPlay} />)}</div>}
        </section>

        <footer className="admin-footer"><Activity size={11} className="mr-1 inline-block align-[-1px]" /> Coordinator view / room state supplied in real time</footer>
      </div>
    </main>
  );
}