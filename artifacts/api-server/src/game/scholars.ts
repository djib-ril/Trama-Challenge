import { desc, sql } from "drizzle-orm";
import { db, gameResultsTable } from "@workspace/db";

export interface ScholarEntry { rank: number; name: string; best: number; total: number; games: number; }
function periodKey(date: Date, period: "week" | "month") {
  if (period === "month") return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + start.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function recordGameResult(players: Record<string, { name: string; score: number }>) {
  const rows = Object.values(players).filter((p) => p.score > 0).map((p) => ({ playerName: p.name, score: p.score }));
  if (rows.length) await db.insert(gameResultsTable).values(rows);
}

async function board(since?: Date): Promise<ScholarEntry[]> {
  const filters = since ? sql`where played_at >= ${since}` : sql``;
  const result = await db.execute(sql`
    select player_name as name, max(score)::int as best, sum(score)::int as total, count(*)::int as games
    from game_results ${filters}
    group by player_name order by best desc, total desc limit 10
  `);
  return result.rows
    .filter((row) => typeof row.name === "string")
    .map((row, index) => ({
      rank: index + 1,
      name: String(row.name),
      best: Number(row.best) || 0,
      total: Number(row.total) || 0,
      games: Number(row.games) || 0,
    }));
}

export async function getScholars() {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setUTCDate(now.getUTCDate() - 7);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { allTime: await board(), weekly: await board(weekStart), monthly: await board(monthStart), weekKey: periodKey(now, "week"), monthKey: periodKey(now, "month") };
}