// BDX Bench — interactive community store (AGENT B).
//
// Crash-safe JSON file store: read-modify-write via tmp-file + rename.
// Per-collection files under web/data/interactive/ (gitignored; only
// .gitkeep ships). No external deps: node:fs, node:path, node:crypto only.
//
// Storage paths (relative to web/ = process.cwd() at runtime):
//   web/data/interactive/likes.json    Record<modelSlug, { count, voters: hashedVoter[] }>
//   web/data/interactive/ratings.json  Record<modelSlug, { count, sum, byVoter: { hashedVoter: 1-5 } }>
//   web/data/interactive/votes.json    Record<matchId,   { A, B, byVoter: { hashedVoter: "A"|"B" } }>
//   web/data/interactive/comments.json Record<"scope:id",  Array<{ id, name, text, createdAt }>>
//
// Seed defaults:
//   likes    -> each canonical slug starts { count: 0, voters: [] }
//   ratings  -> each canonical slug starts { count: 0, sum: 0, byVoter: {} }
//   votes    -> m-001 starts { A: 1, B: 0 } via one pre-seeded community vote
//              for side A (sentinel voter "__seed__community"). Production
//              starts 1-0 by design; the sentinel key can never collide with a
//              real sha256 voter hash.
//   comments -> {} (empty threads on demand)
//
// Canonical slugs: muse-spark-1-3, gemini-3-8-flash.
// Match m-001: side A = muse-spark-1-3 (Muse), side B = gemini-3-8-flash
// (Gemini), status open. Ratings scale 1-5.
//
// Copy honesty (mirrored by routes/components, never claim verified/global):
//   "Community likes/ratings — stored on this server"
//   "Showdown vote — match m-001, open"

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Canonical constants
// ---------------------------------------------------------------------------

export const MODEL_SLUGS = ["muse-spark-1-3", "gemini-3-8-flash"] as const;
export type ModelSlug = (typeof MODEL_SLUGS)[number];

export const MATCH_ID = "m-001" as const;
export type MatchId = typeof MATCH_ID;
export type VoteSide = "A" | "B";

export const MATCH_SIDE_A_SLUG: ModelSlug = "muse-spark-1-3";
export const MATCH_SIDE_B_SLUG: ModelSlug = "gemini-3-8-flash";
export const MATCH_STATUS = "open" as const;

/** Anonymous voter cookie (httpOnly, 1 year). Value is a random UUID; only its sha256 is stored. */
export const VOTER_COOKIE = "bdx_voter";
export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Sentinel voter key for the pre-seeded community vote (never a real hash). */
export const SEED_VOTE_SENTINEL = "__seed__community";

/** Max comments retained per thread (oldest dropped beyond this). */
export const MAX_COMMENTS_PER_THREAD = 500;

// ---------------------------------------------------------------------------
// Collection shapes
// ---------------------------------------------------------------------------

export interface LikeEntry {
  count: number;
  voters: string[];
}
export type LikesFile = Record<string, LikeEntry>;

export interface RatingEntry {
  count: number;
  sum: number;
  byVoter: Record<string, number>;
}
export type RatingsFile = Record<string, RatingEntry>;

export interface VoteEntry {
  A: number;
  B: number;
  byVoter: Record<string, VoteSide>;
}
export type VotesFile = Record<string, VoteEntry>;

export interface CommentEntry {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}
export type CommentsFile = Record<string, CommentEntry[]>;

// ---------------------------------------------------------------------------
// Seed defaults (production starts m-001 at 1-0 for side A)
// ---------------------------------------------------------------------------

export function defaultLikes(): LikesFile {
  const out: LikesFile = {};
  for (const slug of MODEL_SLUGS) out[slug] = { count: 0, voters: [] };
  return out;
}

export function defaultRatings(): RatingsFile {
  const out: RatingsFile = {};
  for (const slug of MODEL_SLUGS) out[slug] = { count: 0, sum: 0, byVoter: {} };
  return out;
}

export function defaultVotes(): VotesFile {
  return {
    [MATCH_ID]: {
      A: 1,
      B: 0,
      byVoter: { [SEED_VOTE_SENTINEL]: "A" },
    },
  };
}

export function defaultComments(): CommentsFile {
  return {};
}

// ---------------------------------------------------------------------------
// Paths + crash-safe IO
// ---------------------------------------------------------------------------

export function dataDir(): string {
  return path.join(process.cwd(), "data", "interactive");
}

function filePath(name: "likes.json" | "ratings.json" | "votes.json" | "comments.json"): string {
  return path.join(dataDir(), name);
}

async function readJson<T>(file: string, fallback: () => T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object") return parsed as T;
    return fallback();
  } catch {
    return fallback();
  }
}

/** Crash-safe write: tmp-file in the same dir + rename (never truncate-then-write). */
async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

// ---------------------------------------------------------------------------
// Voter identity (anonymous cookie id -> sha256 stored in sets)
// ---------------------------------------------------------------------------

/** sha256 hex of a voter cookie id. Only hashes are persisted. */
export function hashVoter(voterId: string): string {
  return crypto.createHash("sha256").update(voterId, "utf8").digest("hex");
}

export function newVoterId(): string {
  return crypto.randomUUID();
}

/** Read the anonymous voter id from the request Cookie header (null if absent). */
export function parseVoterId(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (name !== VOTER_COOKIE) continue;
    const value = part.slice(idx + 1).trim();
    if (!value) return null;
    try {
      const decoded = decodeURIComponent(value);
      return decoded.length > 0 && decoded.length <= 200 ? decoded : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Set the anonymous voter cookie on a response. */
export function applyVoterCookie(res: NextResponse, voterId: string): void {
  res.cookies.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export async function getLikesStore(): Promise<LikesFile> {
  return readJson<LikesFile>(filePath("likes.json"), defaultLikes);
}

function ensureLikeEntry(store: LikesFile, slug: string): LikeEntry {
  const existing = store[slug];
  if (existing && typeof existing.count === "number" && Array.isArray(existing.voters)) {
    return existing;
  }
  const fresh: LikeEntry = { count: 0, voters: [] };
  store[slug] = fresh;
  return fresh;
}

/** Toggle a like. Count is always derived from the voter set length. */
export async function toggleLike(
  slug: string,
  voterHash: string,
): Promise<{ count: number; liked: boolean }> {
  const store = await getLikesStore();
  const entry = ensureLikeEntry(store, slug);
  const idx = entry.voters.indexOf(voterHash);
  let liked: boolean;
  if (idx >= 0) {
    entry.voters.splice(idx, 1);
    liked = false;
  } else {
    entry.voters.push(voterHash);
    liked = true;
  }
  entry.count = entry.voters.length;
  await writeJsonAtomic(filePath("likes.json"), store);
  return { count: entry.count, liked };
}

export function isLiked(store: LikesFile, slug: string, voterHash: string | null): boolean {
  if (!voterHash) return false;
  const entry = store[slug];
  if (!entry) return false;
  return entry.voters.includes(voterHash);
}

// ---------------------------------------------------------------------------
// Ratings (1-5, one rating per voter per model; re-rate updates sum in place)
// ---------------------------------------------------------------------------

export async function getRatingsStore(): Promise<RatingsFile> {
  return readJson<RatingsFile>(filePath("ratings.json"), defaultRatings);
}

function ensureRatingEntry(store: RatingsFile, slug: string): RatingEntry {
  const existing = store[slug];
  if (
    existing &&
    typeof existing.count === "number" &&
    typeof existing.sum === "number" &&
    existing.byVoter !== null &&
    typeof existing.byVoter === "object"
  ) {
    return existing;
  }
  const fresh: RatingEntry = { count: 0, sum: 0, byVoter: {} };
  store[slug] = fresh;
  return fresh;
}

export async function setRating(
  slug: string,
  voterHash: string,
  value: number,
): Promise<{ count: number; sum: number; avg: number; userRating: number }> {
  const store = await getRatingsStore();
  const entry = ensureRatingEntry(store, slug);
  const prev = entry.byVoter[voterHash];
  if (prev === undefined) {
    entry.count += 1;
    entry.sum += value;
  } else {
    entry.sum += value - prev;
  }
  entry.byVoter[voterHash] = value;
  // Re-derive count from the voter map so concurrent seeds can never drift.
  entry.count = Object.keys(entry.byVoter).length;
  await writeJsonAtomic(filePath("ratings.json"), store);
  const avg = entry.count > 0 ? entry.sum / entry.count : 0;
  return { count: entry.count, sum: entry.sum, avg, userRating: value };
}

export function ratingSummary(
  store: RatingsFile,
  slug: string,
  voterHash: string | null,
): { count: number; sum: number; avg: number; userRating: number | null } {
  const entry = store[slug] ?? { count: 0, sum: 0, byVoter: {} };
  const count = entry.count;
  const sum = entry.sum;
  const userRating = voterHash != null ? (entry.byVoter[voterHash] ?? null) : null;
  return { count, sum, avg: count > 0 ? sum / count : 0, userRating };
}

// ---------------------------------------------------------------------------
// Votes (match m-001, one vote per voter; changing sides moves the vote)
// ---------------------------------------------------------------------------

export async function getVotesStore(): Promise<VotesFile> {
  return readJson<VotesFile>(filePath("votes.json"), defaultVotes);
}

function ensureVoteEntry(store: VotesFile, matchId: string): VoteEntry {
  const existing = store[matchId];
  if (
    existing &&
    typeof existing.A === "number" &&
    typeof existing.B === "number" &&
    existing.byVoter !== null &&
    typeof existing.byVoter === "object"
  ) {
    return existing;
  }
  // Unknown matches start 0-0; m-001 falls back to its 1-0 seed.
  const fresh: VoteEntry =
    matchId === MATCH_ID
      ? { A: 1, B: 0, byVoter: { [SEED_VOTE_SENTINEL]: "A" } }
      : { A: 0, B: 0, byVoter: {} };
  store[matchId] = fresh;
  return fresh;
}

export async function castVote(
  matchId: string,
  voterHash: string,
  side: VoteSide,
): Promise<{ A: number; B: number; total: number; userVote: VoteSide }> {
  const store = await getVotesStore();
  const entry = ensureVoteEntry(store, matchId);
  const prev = entry.byVoter[voterHash];
  if (prev === undefined) {
    entry[side] += 1;
    entry.byVoter[voterHash] = side;
  } else if (prev !== side) {
    entry[prev] = Math.max(0, entry[prev] - 1);
    entry[side] += 1;
    entry.byVoter[voterHash] = side;
  }
  await writeJsonAtomic(filePath("votes.json"), store);
  return { A: entry.A, B: entry.B, total: entry.A + entry.B, userVote: side };
}

export function voteSummary(
  store: VotesFile,
  matchId: string,
  voterHash: string | null,
): { A: number; B: number; total: number; userVote: VoteSide | null } {
  const entry = store[matchId];
  if (!entry) {
    if (matchId === MATCH_ID) {
      const seed = defaultVotes()[MATCH_ID];
      if (!seed) return { A: 1, B: 0, total: 1, userVote: null };
      return { A: seed.A, B: seed.B, total: seed.A + seed.B, userVote: null };
    }
    return { A: 0, B: 0, total: 0, userVote: null };
  }
  const userVote = voterHash != null ? (entry.byVoter[voterHash] ?? null) : null;
  return { A: entry.A, B: entry.B, total: entry.A + entry.B, userVote };
}

// ---------------------------------------------------------------------------
// Comments (key = "scope:id", oldest-first)
// ---------------------------------------------------------------------------

export function commentKey(scope: string, id: string): string {
  return `${scope}:${id}`;
}

export async function getCommentsStore(): Promise<CommentsFile> {
  return readJson<CommentsFile>(filePath("comments.json"), defaultComments);
}

export async function addComment(
  key: string,
  name: string,
  text: string,
): Promise<{ comment: CommentEntry; count: number }> {
  const store = await getCommentsStore();
  const thread = store[key] ?? [];
  const comment: CommentEntry = {
    id: crypto.randomUUID(),
    name,
    text,
    createdAt: new Date().toISOString(),
  };
  thread.push(comment);
  const capped =
    thread.length > MAX_COMMENTS_PER_THREAD
      ? thread.slice(thread.length - MAX_COMMENTS_PER_THREAD)
      : thread;
  store[key] = capped;
  await writeJsonAtomic(filePath("comments.json"), store);
  return { comment, count: capped.length };
}

export function listComments(store: CommentsFile, key: string): CommentEntry[] {
  return store[key] ?? [];
}
