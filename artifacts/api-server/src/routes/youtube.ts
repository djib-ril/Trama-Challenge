import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const router: IRouter = Router();
const youtubeStreams = new Map<string, { ingestionUrl: string; process?: ChildProcessWithoutNullStreams }>();
let cachedLive: {
  broadcastId: string;
  streamId: string;
  watchUrl: string;
  studioUrl: string;
  title: string;
  status: string;
  encoderRequired: boolean;
  browserEncoderAvailable: boolean;
} | null = null;

class YouTubeApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

async function youtubeRequest(path: string, init?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("youtube", path, init);
  const body = await response.json() as Record<string, any>;
  if (!response.ok) {
    const reason = body.error?.errors?.[0]?.reason;
    const quotaExceeded = reason === "quotaExceeded" || String(body.error?.message ?? "").toLowerCase().includes("quota");
    const message = quotaExceeded
      ? "YouTube API quota has been exhausted. Existing broadcasts can still be reused, but new broadcasts require the quota to reset."
      : body.error?.message ?? "YouTube request failed";
    throw new YouTubeApiError(message, quotaExceeded ? 429 : response.status);
  }
  return body;
}

async function reuseExistingBroadcast(title: string) {
  for (const broadcastStatus of ["active", "upcoming"]) {
    const body = await youtubeRequest(
      `/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails&broadcastStatus=${broadcastStatus}&maxResults=50`,
    );
    const match = body.items?.find((item: any) =>
      item.snippet?.title === title && item.contentDetails?.boundStreamId,
    );
    if (!match) continue;

    const streamId = match.contentDetails.boundStreamId as string;
    const streams = await youtubeRequest(`/youtube/v3/liveStreams?part=cdn,status&id=${encodeURIComponent(streamId)}`);
    const ingestion = streams.items?.[0]?.cdn?.ingestionInfo;
    if (!ingestion?.ingestionAddress || !ingestion?.streamName) continue;
    youtubeStreams.set(match.id, { ingestionUrl: `${ingestion.ingestionAddress}/${ingestion.streamName}` });
    return {
      broadcastId: match.id,
      streamId,
      watchUrl: `https://www.youtube.com/watch?v=${match.id}`,
      studioUrl: "https://studio.youtube.com/channel/UC/livestreaming",
      title,
      status: match.status?.lifeCycleStatus ?? broadcastStatus,
      encoderRequired: false,
      browserEncoderAvailable: true,
    };
  }
  return null;
}

router.get("/youtube/channel", async (_req, res) => {
  if (!_req.isAdmin()) return res.status(401).json({ message: "Admin authentication required." });
  try {
    const body = await youtubeRequest("/youtube/v3/channels?part=snippet,statistics&mine=true");
    const channel = body.items?.[0];
    if (!channel) return res.status(404).json({ message: "No YouTube channel was found." });
    return res.json({
      id: channel.id,
      title: channel.snippet?.title ?? "YouTube channel",
      handle: channel.snippet?.customUrl ?? null,
      thumbnail: channel.snippet?.thumbnails?.default?.url ?? null,
      subscribers: channel.statistics?.subscriberCount ?? null,
    });
  } catch (error) {
    return res.status(502).json({ message: error instanceof Error ? error.message : "Could not reach YouTube." });
  }
});

router.post("/youtube/live", async (req, res) => {
  if (!req.isAdmin()) return res.status(401).json({ message: "Admin authentication required." });
  const title = typeof req.body?.title === "string" && req.body.title.trim()
    ? req.body.title.trim().slice(0, 100)
    : "Trama Challenge — 24/7 Live Quiz";
  const description = typeof req.body?.description === "string"
    ? req.body.description.trim().slice(0, 5000)
    : "Join the Trama Challenge live quiz.";

  try {
    if (cachedLive) return res.json(cachedLive);
    const existing = await reuseExistingBroadcast(title);
    if (existing) {
      cachedLive = existing;
      return res.json(existing);
    }

    const broadcast = await youtubeRequest(
      "/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            scheduledStartTime: new Date(Date.now() + 60_000).toISOString(),
          },
          status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
          contentDetails: { enableAutoStart: true, enableAutoStop: true, recordFromStart: true },
        }),
      },
    );

    const stream = await youtubeRequest(
      "/youtube/v3/liveStreams?part=snippet,cdn,status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippet: { title: `${title} — Stream` },
          cdn: { frameRate: "variable", ingestionType: "rtmp", resolution: "variable" },
        }),
      },
    );

    await youtubeRequest(
      `/youtube/v3/liveBroadcasts/bind?id=${encodeURIComponent(broadcast.id)}&part=snippet,contentDetails&streamId=${encodeURIComponent(stream.id)}`,
      { method: "POST" },
    );

    const ingestion = stream.cdn?.ingestionInfo;
    if (!ingestion?.ingestionAddress || !ingestion?.streamName) {
      throw new Error("YouTube did not return a stream destination.");
    }
    youtubeStreams.set(broadcast.id, {
      ingestionUrl: `${ingestion.ingestionAddress}/${ingestion.streamName}`,
    });

    cachedLive = {
      broadcastId: broadcast.id,
      streamId: stream.id,
      watchUrl: `https://www.youtube.com/watch?v=${broadcast.id}`,
      studioUrl: "https://studio.youtube.com/channel/UC/livestreaming",
      title,
      status: "created",
      // Never return the RTMP ingestion address or stream key to the browser.
      encoderRequired: false,
      browserEncoderAvailable: true,
    };
    return res.json(cachedLive);
  } catch (error) {
    const statusCode = error instanceof YouTubeApiError && error.statusCode === 429 ? 429 : 502;
    return res.status(statusCode).json({
      message: error instanceof Error ? error.message : "Could not create the YouTube Live broadcast.",
      code: error instanceof YouTubeApiError ? error.statusCode === 429 ? "YOUTUBE_QUOTA_EXCEEDED" : "YOUTUBE_API_ERROR" : "YOUTUBE_CONNECTION_ERROR",
    });
  }
});

export function startYouTubeEncoder(broadcastId: string) {
  const stream = youtubeStreams.get(broadcastId);
  if (!stream || stream.process) return false;
  const ffmpeg = spawn("ffmpeg", [
    "-loglevel", "warning",
    "-f", "webm", "-i", "pipe:0",
    "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
    "-pix_fmt", "yuv420p", "-r", "30", "-g", "60",
    "-c:a", "aac", "-ar", "44100", "-b:a", "128k",
    "-f", "flv", stream.ingestionUrl,
  ]);
  stream.process = ffmpeg;
  ffmpeg.on("close", () => {
    if (stream.process === ffmpeg) stream.process = undefined;
  });
  return true;
}

export function writeYouTubeChunk(broadcastId: string, chunk: Buffer) {
  const process = youtubeStreams.get(broadcastId)?.process;
  if (!process || !process.stdin.writable) return false;
  process.stdin.write(chunk);
  return true;
}

export function stopYouTubeEncoder(broadcastId: string) {
  const stream = youtubeStreams.get(broadcastId);
  if (!stream?.process) return false;
  stream.process.stdin.end();
  stream.process.kill("SIGTERM");
  stream.process = undefined;
  return true;
}

export default router;