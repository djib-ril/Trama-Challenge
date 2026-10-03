import { Server, type Socket as IOSocket } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "../lib/logger";
import { QUIZ_CATEGORIES, getQuestionsForTopic, type Question, type Difficulty } from "./questions";
import { CATEGORIES as SUMMARY_CATEGORIES, CATEGORY_KEYS as SUMMARY_CATEGORY_KEYS } from "./passages";
import { recordGameResult, getScholars } from "./scholars";
import { startYouTubeEncoder, writeYouTubeChunk, stopYouTubeEncoder } from "../routes/youtube";
import { getSession } from "../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameMode = "quiz" | "summary" | "custom";

export interface GameConfig {
  mode: GameMode;
  categoryKey: string;
  topicKey: string;
  difficulty: Difficulty | "mixed";
  timerSeconds: number;
  questionCount: number;
  summaryCategory: string;
}

export interface CustomQuestion {
  id: string;
  type: "mc" | "tf";
  q: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

interface Player {
  name: string;
  score: number;
  streak: number;
  answered: boolean;
  summary?: string;
}

interface ActiveQuestion {
  question: Question | CustomQuestion;
  startTime: number;
  answers: Record<string, string>;
  answerTimes: Record<string, number>;
  timerHandle: ReturnType<typeof setTimeout>;
}

interface RoomState {
  hostId: string;
  config: GameConfig;
  players: Record<string, Player>;
  isGameActive: boolean;
  createdAt: number;
  // quiz
  questions: Array<Question | CustomQuestion>;
  customQuestions: CustomQuestion[];
  questionIndex: number;
  activeQuestion: ActiveQuestion | null;
  revealTimer: ReturnType<typeof setTimeout> | null;
  // summary
  summaryTimerHandle: ReturnType<typeof setInterval> | null;
  autoPlay: boolean;
  autoPlayTimer: ReturnType<typeof setTimeout> | null;
  season?: { id: string; title: string; index: number; total: number; nextCode: string | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

const DEFAULT_CONFIG: GameConfig = {
  mode: "quiz",
  categoryKey: "math",
  topicKey: "algebra",
  difficulty: "mixed",
  timerSeconds: 30,
  questionCount: 10,
  summaryCategory: "random",
};

function makeRoom(hostId: string): RoomState {
  return {
    hostId,
    config: { ...DEFAULT_CONFIG },
    players: {},
    isGameActive: false,
    createdAt: Date.now(),
    questions: [],
    customQuestions: [],
    questionIndex: 0,
    activeQuestion: null,
    revealTimer: null,
    summaryTimerHandle: null,
    autoPlay: false,
    autoPlayTimer: null,
  };
}

function playerList(room: RoomState) {
  return Object.entries(room.players).map(([id, p]) => ({
    id,
    name: p.name,
    score: p.score,
    streak: p.streak,
  }));
}

function speedBonusForAnswer(timeMs: number, timerSeconds: number, basePoints: number): number {
  return Math.max(0, Math.round(basePoints * 0.5 * (1 - timeMs / (timerSeconds * 1000))));
}

function scoreForAnswer(
  correct: boolean,
  timeMs: number,
  timerSeconds: number,
  basePoints: number,
  streak: number,
): number {
  if (!correct) return 0;
  const timeBonus = speedBonusForAnswer(timeMs, timerSeconds, basePoints);
  const streakBonus = streak >= 3 ? 50 : 0;
  return basePoints + timeBonus + streakBonus;
}

// ─── Room map ─────────────────────────────────────────────────────────────────

const rooms = new Map<string, RoomState>();

export interface AdminRoomSnapshot {
  code: string;
  isActive: boolean;
  phase: "waiting" | "question" | "reveal" | "summary";
  questionIndex: number;
  totalQuestions: number;
  autoPlay: boolean;
  hostName: string;
  players: Array<{ id: string; name: string; score: number; streak: number }>;
  season?: { title: string; index: number; total: number };
}

export function getAdminRoomsSnapshot(): AdminRoomSnapshot[] {
  return [...rooms.entries()]
    .sort(([, a], [, b]) => b.createdAt - a.createdAt)
    .map(([code, room]) => ({
      code,
      isActive: room.isGameActive,
      phase: !room.isGameActive
        ? "waiting"
        : room.config.mode === "summary"
          ? "summary"
          : room.activeQuestion
            ? "question"
            : "reveal",
      questionIndex: room.questionIndex,
      totalQuestions: room.config.mode === "summary" ? 1 : room.questions.length || room.customQuestions.length || room.config.questionCount,
      autoPlay: room.autoPlay,
      hostName: room.players[room.hostId]?.name ?? "Trama coordinator",
      players: playerList(room),
      season: room.season ? { title: room.season.title, index: room.season.index, total: room.season.total } : undefined,
    }));
}

function findRoom(socketId: string): [string, RoomState] | [null, null] {
  for (const [code, room] of rooms.entries()) {
    if (socketId in room.players) return [code, room];
  }
  return [null, null];
}

function sanitizedConfig(partial: Partial<GameConfig> | undefined): GameConfig {
  const next = { ...DEFAULT_CONFIG };
  if (partial?.mode && ["quiz", "summary", "custom"].includes(partial.mode)) next.mode = partial.mode;
  if (typeof partial?.categoryKey === "string") next.categoryKey = partial.categoryKey;
  if (typeof partial?.topicKey === "string") next.topicKey = partial.topicKey;
  if (["easy", "medium", "hard", "mixed"].includes(partial?.difficulty as string)) {
    next.difficulty = partial!.difficulty as Difficulty | "mixed";
  }
  if ([15, 30, 45, 60, 90, 120].includes(partial?.timerSeconds as number)) next.timerSeconds = partial!.timerSeconds!;
  if ([5, 10, 15, 20].includes(partial?.questionCount as number)) next.questionCount = partial!.questionCount!;
  if (typeof partial?.summaryCategory === "string") next.summaryCategory = partial.summaryCategory;
  return next;
}

function sanitizedCustomQuestions(input: unknown): CustomQuestion[] {
  const questions = Array.isArray(input) ? input : [];
  return questions
    .filter((q): q is Record<string, unknown> => Boolean(q) && typeof q === "object")
    .filter((q) => typeof q.q === "string" && q.q.trim().length > 0)
    .slice(0, 50)
    .map((q) => ({
      id: String(q.id ?? Math.random()),
      type: q.type === "tf" ? "tf" : "mc",
      q: String(q.q).trim().slice(0, 300),
      options: Array.isArray(q.options)
        ? q.options.map((o) => String(o).trim().slice(0, 150))
        : ["True", "False"],
      answer: String(q.answer ?? "A").trim(),
      explanation: String(q.explanation ?? "").trim().slice(0, 200),
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty as string) ? q.difficulty as "easy" | "medium" | "hard" : "medium",
      points: q.difficulty === "easy" ? 100 : q.difficulty === "hard" ? 300 : 200,
    }));
}

// ─── Game engine ──────────────────────────────────────────────────────────────

export function setupGameSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*" },
  });
  const adminSockets = new Set<IOSocket>();

  function cookieValue(header: string | undefined, name: string): string | undefined {
    return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  }

  io.use(async (socket, next) => {
    const wantsAdmin = (socket.handshake.auth as { admin?: boolean } | undefined)?.admin === true;
    if (!wantsAdmin) {
      next();
      return;
    }
    const sid = cookieValue(socket.handshake.headers.cookie, "sid");
    const session = sid ? await getSession(sid) : null;
    if (!session || session.role !== "admin") {
      next(new Error("Admin authentication required."));
      return;
    }
    socket.data.isAdmin = true;
    socket.data.adminSessionExpiresAt = session.sessionExpiresAt;
    next();
  });

  function emitAdminSnapshot() {
    const snapshot = getAdminRoomsSnapshot();
    for (const adminSocket of adminSockets) adminSocket.emit("adminRoomsUpdate", snapshot);
  }

  function detachPlayer(socket: IOSocket) {
    const [code, room] = findRoom(socket.id);
    if (!code || !room) return;
    const name = room.players[socket.id]?.name;
    delete room.players[socket.id];
    socket.leave(code);
    if (Object.keys(room.players).length === 0) {
      if (room.activeQuestion) clearTimeout(room.activeQuestion.timerHandle);
      if (room.revealTimer) clearTimeout(room.revealTimer);
      if (room.summaryTimerHandle) clearInterval(room.summaryTimerHandle);
      if (room.autoPlayTimer) clearTimeout(room.autoPlayTimer);
      rooms.delete(code);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = Object.keys(room.players)[0];
        io.to(room.hostId).emit("youAreNowHost");
      }
      io.to(code).emit("playersUpdate", playerList(room));
      if (name) io.to(code).emit("notification", { text: `${name} left`, type: "info" });
    }
    emitAdminSnapshot();
  }

  function buildMeta() {
    const quiz = Object.entries(QUIZ_CATEGORIES).map(([key, cat]) => ({
      key,
      name: cat.name,
      emoji: cat.emoji,
      topics: Object.entries(cat.topics).map(([tk, t]) => ({ key: tk, name: t.name })),
    }));
    const summary = SUMMARY_CATEGORY_KEYS.map((k) => ({
      key: k,
      name: SUMMARY_CATEGORIES[k].name,
      emoji: SUMMARY_CATEGORIES[k].emoji,
    }));
    return { quiz, summary };
  }

  function sendQuestion(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.questionIndex >= room.questions.length) { endGame(roomCode); return; }

    const question = room.questions[room.questionIndex];
    const { timerSeconds } = room.config;

    for (const p of Object.values(room.players)) p.answered = false;

    const aq: ActiveQuestion = {
      question,
      startTime: Date.now(),
      answers: {},
      answerTimes: {},
      timerHandle: setTimeout(() => revealQuestion(roomCode), timerSeconds * 1000),
    };
    room.activeQuestion = aq;

    io.to(roomCode).emit("question", {
      index: room.questionIndex,
      total: room.questions.length,
      type: question.type,
      q: question.q,
      options: question.options,
      timerSeconds,
      points: question.points,
      difficulty: question.difficulty,
    });

    io.to(roomCode).emit("notification", {
      text: `Question ${room.questionIndex + 1} of ${room.questions.length}`,
      type: "info",
    });
  }

  function revealQuestion(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room || !room.activeQuestion) return;

    clearTimeout(room.activeQuestion.timerHandle);
    const { question, answers, startTime } = room.activeQuestion;

    const scores: Array<{ id: string; name: string; score: number; delta: number; correct: boolean; answerTimeMs: number | null; speedBonus: number }> = [];

    for (const [sid, player] of Object.entries(room.players)) {
      const given = answers[sid];
      const correct = given === question.answer;
      const timeMs = given
        ? (room.activeQuestion.answerTimes[sid] ?? Math.min(Date.now() - startTime, room.config.timerSeconds * 1000))
        : room.config.timerSeconds * 1000;
      const delta = scoreForAnswer(correct, timeMs, room.config.timerSeconds, question.points, player.streak);
      const speedBonus = correct ? speedBonusForAnswer(timeMs, room.config.timerSeconds, question.points) : 0;

      if (correct) { player.streak++; player.score += delta; }
      else { player.streak = 0; }

      scores.push({ id: sid, name: player.name, score: player.score, delta, correct, answerTimeMs: given ? timeMs : null, speedBonus });
      io.to(sid).emit("yourResult", { correct, delta, answer: question.answer, answerTimeMs: given ? timeMs : null, speedBonus });
    }

    const sorted = [...scores].sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("questionEnd", {
      correctAnswer: question.answer,
      explanation: (question as CustomQuestion).explanation ?? "",
      scores: sorted,
    });

    if (sorted[0]) {
      io.to(roomCode).emit("notification", { text: `🏆 Leading: ${sorted[0].name} (${sorted[0].score} pts)`, type: "leader" });
    }

    room.activeQuestion = null;
    room.questionIndex++;
    emitAdminSnapshot();

    room.revealTimer = setTimeout(() => {
      if (room.questionIndex >= room.questions.length) endGame(roomCode);
      else sendQuestion(roomCode);
    }, 4000);
  }

  function stopGame(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.activeQuestion) clearTimeout(room.activeQuestion.timerHandle);
    if (room.revealTimer) clearTimeout(room.revealTimer);
    if (room.summaryTimerHandle) clearInterval(room.summaryTimerHandle);
    if (room.autoPlayTimer) clearTimeout(room.autoPlayTimer);
    room.activeQuestion = null;
    room.revealTimer = null;
    room.summaryTimerHandle = null;
    room.autoPlayTimer = null;
    room.isGameActive = false;
    room.autoPlay = false;
    room.questionIndex = 0;
    room.questions = [];
    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.streak = 0;
      player.answered = false;
    }
    io.to(roomCode).emit("adminGameStopped");
    io.to(roomCode).emit("autoPlayUpdate", { enabled: false, status: "idle" });
    io.to(roomCode).emit("playersUpdate", playerList(room));
    io.to(roomCode).emit("notification", { text: "The round was stopped by an admin.", type: "info" });
    emitAdminSnapshot();
  }

  async function endGame(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.isGameActive = false;
    room.activeQuestion = null;

    const leaderboard = Object.values(room.players)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));

    // Persist hall of fame before resetting scores
    await recordGameResult(room.players);
    const scholars = await getScholars();
    io.to(roomCode).emit("gameOver", {
      leaderboard,
      season: room.season ? {
        title: room.season.title,
        index: room.season.index,
        total: room.season.total,
        nextCode: room.season.nextCode,
      } : null,
    });
    io.emit("topScholars", scholars);

    const fresh = makeRoom(room.hostId);
    fresh.players = room.players;
    fresh.config = room.config;
    fresh.customQuestions = room.customQuestions;
    fresh.autoPlay = room.autoPlay;
    fresh.season = room.season;
    for (const p of Object.values(fresh.players)) { p.score = 0; p.streak = 0; p.answered = false; }
    rooms.set(roomCode, fresh);

    if (fresh.autoPlay && Object.keys(fresh.players).length > 0) {
      io.to(roomCode).emit("autoPlayUpdate", { enabled: true, status: "next" });
      fresh.autoPlayTimer = setTimeout(() => {
        const current = rooms.get(roomCode);
        if (current && current.autoPlay && !current.isGameActive) beginGame(roomCode);
      }, 8000);
    }
  }

  function beginGame(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room || room.isGameActive || Object.keys(room.players).length === 0) return;

    room.isGameActive = true;
    room.questionIndex = 0;
    for (const p of Object.values(room.players)) { p.score = 0; p.streak = 0; p.answered = false; }

    if (room.config.mode === "quiz") {
      room.questions = getQuestionsForTopic(
        room.config.categoryKey,
        room.config.topicKey,
        room.config.difficulty,
        room.config.questionCount,
      );
      if (room.questions.length === 0) {
        room.isGameActive = false;
        io.to(room.hostId).emit("error", "No questions found for that selection.");
        return;
      }
      io.to(roomCode).emit("gameStarted", { mode: "quiz" });
      setTimeout(() => sendQuestion(roomCode), 1000);
    } else if (room.config.mode === "custom") {
      if (room.customQuestions.length === 0) {
        room.isGameActive = false;
        io.to(room.hostId).emit("error", "Add at least one question before starting.");
        return;
      }
      room.questions = [...room.customQuestions].sort(() => Math.random() - 0.5);
      io.to(roomCode).emit("gameStarted", { mode: "quiz" });
      setTimeout(() => sendQuestion(roomCode), 1000);
    } else {
      io.to(roomCode).emit("gameStarted", { mode: "summary" });
      setTimeout(() => startSummaryGame(roomCode), 1000);
    }

    logger.info({ code: roomCode, mode: room.config.mode, autoPlay: room.autoPlay }, "Game started");
    emitAdminSnapshot();
  }

  function startSummaryGame(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const cat = SUMMARY_CATEGORIES[room.config.summaryCategory] ?? SUMMARY_CATEGORIES["random"];
    const passage = cat.passages[Math.floor(Math.random() * cat.passages.length)];
    const totalSeconds = room.config.timerSeconds;
    io.to(roomCode).emit("summaryStarted", { passage, totalSeconds });

    let remaining = totalSeconds;
    room.summaryTimerHandle = setInterval(() => {
      remaining--;
      io.to(roomCode).emit("timerUpdate", remaining);
      if (remaining <= 0) {
        clearInterval(room.summaryTimerHandle!);
        endSummaryGame(roomCode, passage);
      }
    }, 1000);
  }

  function endSummaryGame(roomCode: string, passage: string) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const keywords = passage.toLowerCase().match(/\b[a-z]{5,}\b/g) ?? [];
    const uniqueKw = [...new Set(keywords)].slice(0, 15);
    for (const player of Object.values(room.players)) {
      if (!player.answered) continue;
      const clean = (player.summary ?? "").toLowerCase();
      let score = 0;
      for (const w of uniqueKw) { if (clean.includes(w)) score += 20; }
      const wc = clean.split(/\s+/).filter(Boolean).length;
      if (wc >= 15 && wc <= 40) score += 50;
      else if (wc >= 5) score += 20;
      player.score = score;
    }
    endGame(roomCode);
    emitAdminSnapshot();
  }

  // ── Socket events ──────────────────────────────────────────────────────────

  io.on("connection", (socket) => {
    socket.emit("meta", buildMeta());
     getScholars().then((scholars) => socket.emit("topScholars", scholars)).catch(() => {});

    if (socket.data.isAdmin) {
      adminSockets.add(socket);
      const expiresAt = Number(socket.data.adminSessionExpiresAt);
      if (Number.isFinite(expiresAt)) {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          socket.disconnect(true);
          return;
        }
        socket.data.adminExpiryTimer = setTimeout(() => {
          socket.emit("adminSessionExpired");
          socket.disconnect(true);
        }, remaining);
      }
      socket.emit("adminRoomsUpdate", getAdminRoomsSnapshot());
      socket.on("adminCreateRoom", (payload: {
        config?: Partial<GameConfig>;
        customQuestions?: unknown;
      }, cb?: (result: { ok: boolean; code?: string; message?: string }) => void) => {
        const config = sanitizedConfig(payload?.config);
        const customQuestions = sanitizedCustomQuestions(payload?.customQuestions);
        if (config.mode === "custom" && customQuestions.length === 0) {
          cb?.({ ok: false, message: "Add at least one question before creating a custom quiz." });
          return;
        }
        let code = generateCode();
        while (rooms.has(code)) code = generateCode();
        const room = makeRoom(socket.id);
        room.config = config;
        room.customQuestions = customQuestions;
        rooms.set(code, room);
        socket.join(code);
        cb?.({ ok: true, code });
        emitAdminSnapshot();
        logger.info({ code, mode: config.mode, questions: customQuestions.length }, "Admin created room");
      });
      socket.on("adminCreateSeason", (payload: {
        title?: string;
        quizzes?: Array<{ title?: string; config?: Partial<GameConfig> }>;
      }, cb?: (result: { ok: boolean; rooms?: Array<{ code: string; title: string; index: number; total: number }>; message?: string }) => void) => {
        const quizzes = Array.isArray(payload?.quizzes) ? payload.quizzes : [];
        if (quizzes.length < 1 || quizzes.length > 10) {
          cb?.({ ok: false, message: "A season must contain between 1 and 10 ready-made quizzes." });
          return;
        }
        const prepared = quizzes.map((quiz) => {
          const config = sanitizedConfig({ ...quiz.config, mode: "quiz" });
          const category = QUIZ_CATEGORIES[config.categoryKey];
          const topic = category?.topics[config.topicKey];
          return {
            config,
            title: typeof quiz.title === "string" && quiz.title.trim()
              ? quiz.title.trim().slice(0, 100)
              : `${category?.name ?? "Quiz"} · ${topic?.name ?? "Topic"}`,
            valid: Boolean(topic),
          };
        });
        if (prepared.some((quiz) => !quiz.valid)) {
          cb?.({ ok: false, message: "One or more season quizzes use an unavailable subject or topic." });
          return;
        }

        const title = typeof payload.title === "string" && payload.title.trim()
          ? payload.title.trim().slice(0, 80)
          : "Trama Season";
        const seasonId = `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const codes = prepared.map(() => {
          let code = generateCode();
          while (rooms.has(code)) code = generateCode();
          return code;
        });
        const created = prepared.map((quiz, index) => {
          const room = makeRoom(socket.id);
          room.config = quiz.config;
          room.season = {
            id: seasonId,
            title,
            index: index + 1,
            total: prepared.length,
            nextCode: codes[index + 1] ?? null,
          };
          rooms.set(codes[index], room);
          socket.join(codes[index]);
          return { code: codes[index], title: quiz.title, index: index + 1, total: prepared.length };
        });
        cb?.({ ok: true, rooms: created });
        emitAdminSnapshot();
        logger.info({ seasonId, title, quizzes: created.length }, "Admin created quiz season");
      });
      socket.on("adminConfigureRoom", (code: string, partial: Partial<GameConfig>) => {
        const upper = String(code).toUpperCase().trim();
        const room = rooms.get(upper);
        if (!room || room.isGameActive) return;
        Object.assign(room.config, sanitizedConfig({ ...room.config, ...partial }));
        io.to(upper).emit("configUpdated", room.config);
        emitAdminSnapshot();
      });
      socket.on("adminSetCustomQuestions", (code: string, questions: unknown) => {
        const room = rooms.get(String(code).toUpperCase().trim());
        if (!room || room.isGameActive) return;
        room.customQuestions = sanitizedCustomQuestions(questions);
        io.to(String(code).toUpperCase().trim()).emit("customQuestionsUpdated", room.customQuestions);
        emitAdminSnapshot();
      });
      socket.on("adminStartRoom", (code: string) => {
        const room = rooms.get(String(code).toUpperCase().trim());
        if (room && !room.isGameActive) beginGame(String(code).toUpperCase().trim());
        emitAdminSnapshot();
      });
      socket.on("adminSkipRoom", (code: string) => {
        const room = rooms.get(String(code).toUpperCase().trim());
        if (room?.activeQuestion) {
          clearTimeout(room.activeQuestion.timerHandle);
          revealQuestion(String(code).toUpperCase().trim());
        }
        emitAdminSnapshot();
      });
      socket.on("adminStopRoom", (code: string) => stopGame(String(code).toUpperCase().trim()));
      socket.on("adminToggleAutoPlay", (code: string, enabled: boolean) => {
        const upper = String(code).toUpperCase().trim();
        const room = rooms.get(upper);
        if (!room) return;
        room.autoPlay = Boolean(enabled) && !room.season;
        if (room.autoPlayTimer) clearTimeout(room.autoPlayTimer);
        room.autoPlayTimer = null;
        io.to(upper).emit("autoPlayUpdate", { enabled: room.autoPlay, status: room.isGameActive ? "running" : "idle" });
        if (room.autoPlay && !room.isGameActive && Object.keys(room.players).length > 0) beginGame(upper);
        emitAdminSnapshot();
      });
      socket.on("youtubeStreamStart", (broadcastId: string, cb?: (ok: boolean, message?: string) => void) => {
        if (typeof broadcastId !== "string") {
          cb?.(false, "A YouTube broadcast is required.");
          return;
        }
        const ok = startYouTubeEncoder(broadcastId);
        cb?.(ok, ok ? "Browser broadcast connected to YouTube." : "Broadcast is not ready or is already streaming.");
        if (ok) socket.emit("youtubeStreamStatus", { streaming: true });
      });
      socket.on("youtubeStreamChunk", (broadcastId: string, chunk: Buffer) => {
        if (typeof broadcastId === "string" && Buffer.isBuffer(chunk)) writeYouTubeChunk(broadcastId, chunk);
      });
      socket.on("youtubeStreamStop", (broadcastId: string) => {
        if (typeof broadcastId !== "string") return;
        stopYouTubeEncoder(broadcastId);
        socket.emit("youtubeStreamStatus", { streaming: false });
      });
    }

    socket.on("createRoom", (_username: string, cb?: (code: string) => void) => {
      cb?.("");
      socket.emit("error", "Only a coordinator can create a room. Enter a PIN to join.");
    });

    socket.on("joinRoom", (code: string, username: string, cb: (ok: boolean, reason?: string) => void) => {
      const upper = String(code).toUpperCase().trim();
      const room = rooms.get(upper);
      if (!room) { cb(false, "Room not found — check the code"); return; }
      if (room.isGameActive) { cb(false, "GAME_LOCKED"); return; }
      const name = String(username).trim().slice(0, 15);
      if (!name) { cb(false, "Enter a nickname"); return; }
      room.players[socket.id] = { name, score: 0, streak: 0, answered: false };
      socket.join(upper);
      cb(true);
      socket.emit("roomJoined", { code: upper, isHost: false, config: room.config, customQuestions: room.customQuestions, season: room.season ? { title: room.season.title, index: room.season.index, total: room.season.total, nextCode: room.season.nextCode } : null });
      socket.emit("autoPlayUpdate", { enabled: room.autoPlay, status: room.isGameActive ? "running" : "idle" });
      io.to(upper).emit("playersUpdate", playerList(room));
      io.to(upper).emit("notification", { text: `${name} joined!`, type: "join" });
      if (room.autoPlay && !room.isGameActive) beginGame(upper);
      emitAdminSnapshot();
      logger.info({ code: upper, name }, "Player joined");
    });

    socket.on("leaveRoom", () => detachPlayer(socket));

    socket.on("answer", (answer: string) => {
      const [, room] = findRoom(socket.id);
      if (!room || !room.isGameActive || !room.activeQuestion) return;
      const player = room.players[socket.id];
      if (!player || player.answered) return;
      player.answered = true;
      room.activeQuestion.answers[socket.id] = String(answer).trim();
      room.activeQuestion.answerTimes[socket.id] = Math.min(Date.now() - room.activeQuestion.startTime, room.config.timerSeconds * 1000);
      const total = Object.keys(room.players).length;
      const answered = Object.keys(room.activeQuestion.answers).length;
      if (answered >= total) {
        const [code] = findRoom(socket.id);
        if (code) revealQuestion(code);
      }
    });

    socket.on("submitSummary", (summary: string) => {
      const [, room] = findRoom(socket.id);
      if (!room || !room.isGameActive) return;
      const player = room.players[socket.id];
      if (!player || player.answered) return;
      player.answered = true;
      player.summary = String(summary).trim();
      socket.emit("summaryReceived");
    });

    socket.on("hostSkip", () => {
      const [code, room] = findRoom(socket.id);
      if (!code || !room || !room.isGameActive || socket.id !== room.hostId) return;
      if (room.activeQuestion) { clearTimeout(room.activeQuestion.timerHandle); revealQuestion(code); }
    });

    socket.on("disconnect", () => {
      detachPlayer(socket);
    });

    socket.on("disconnect", () => {
      if (socket.data.adminExpiryTimer) clearTimeout(socket.data.adminExpiryTimer);
      if (socket.data.isAdmin) adminSockets.delete(socket);
    });
  });

  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
      if (!room.isGameActive && room.createdAt < cutoff) rooms.delete(code);
    }
  }, 10 * 60 * 1000);
  setInterval(emitAdminSnapshot, 1000);

  logger.info("Game socket initialized at /api/socket.io");
}
