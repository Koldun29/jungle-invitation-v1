import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { neon } from "@neondatabase/serverless";
import { FLAGSHIP_SLUG, corinaInvite } from "@/invites/seed";
import { inviteSchema, type Invite, type StoredRsvp } from "@/invites/schema";

type MemoryShape = { invites: Record<string, Invite>; rsvps: StoredRsvp[] };

const memory: MemoryShape = ((globalThis as unknown as { __youin?: MemoryShape }).__youin ??= {
  invites: {},
  rsvps: [],
});

export type StorageKind = "upstash" | "neon" | "memory";

export function storageKind(): StorageKind {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return "upstash";
  if (process.env.DATABASE_URL) return "neon";
  return "memory";
}

function redis(): Redis | null {
  if (storageKind() !== "upstash") return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

let neonReady: Promise<void> | null = null;

async function ensureNeon() {
  const sql = sqlClient();
  if (!sql) return;
  neonReady ??= (async () => {
    await sql`create table if not exists youin_invites (slug text primary key, data jsonb not null)`;
    await sql`create table if not exists youin_rsvps (
      id text primary key,
      slug text not null,
      data jsonb not null,
      created_at timestamptz not null default now()
    )`;
  })();
  await neonReady;
}

const tmpFile = path.join("/tmp", "youin-store.json");

async function readMemoryFile() {
  try {
    const raw = await readFile(tmpFile, "utf8");
    const parsed = JSON.parse(raw) as MemoryShape;
    Object.assign(memory.invites, parsed.invites ?? {});
    if (Array.isArray(parsed.rsvps)) {
      const known = new Set(memory.rsvps.map((item) => item.id));
      for (const item of parsed.rsvps) if (!known.has(item.id)) memory.rsvps.push(item);
    }
  } catch {
    /* first run, or a read-only filesystem */
  }
}

async function writeMemoryFile() {
  try {
    await mkdir(path.dirname(tmpFile), { recursive: true });
    await writeFile(tmpFile, JSON.stringify(memory), "utf8");
  } catch {
    /* preview instances can still answer from module memory */
  }
}

export async function getInvite(slug: string): Promise<Invite | null> {
  if (slug === FLAGSHIP_SLUG) return corinaInvite;
  const client = redis();
  if (client) {
    const raw = await client.get<Invite | string>(`invite:${slug}`);
    if (!raw) return null;
    const data = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    const parsed = inviteSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  }
  if (storageKind() === "neon") {
    await ensureNeon();
    const sql = sqlClient();
    if (!sql) return null;
    const rows = await sql`select data from youin_invites where slug = ${slug} limit 1`;
    const data = rows[0]?.data;
    const parsed = inviteSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  }
  await readMemoryFile();
  return memory.invites[slug] ?? null;
}

export async function saveInvite(invite: Invite): Promise<StorageKind> {
  if (invite.slug === FLAGSHIP_SLUG) {
    throw new Error("The flagship invite is seeded in the repo and cannot be overwritten.");
  }
  const kind = storageKind();
  if (kind === "upstash") {
    await redis()!.set(`invite:${invite.slug}`, JSON.stringify(invite));
    return kind;
  }
  if (kind === "neon") {
    await ensureNeon();
    const sql = sqlClient()!;
    const payload = JSON.stringify(invite);
    await sql`insert into youin_invites (slug, data) values (${invite.slug}, ${payload}::jsonb)
      on conflict (slug) do update set data = excluded.data`;
    return kind;
  }
  memory.invites[invite.slug] = invite;
  await writeMemoryFile();
  return kind;
}

export async function saveRsvp(rsvp: StoredRsvp): Promise<StorageKind> {
  const kind = storageKind();
  if (kind === "upstash") {
    await redis()!.lpush(`rsvp:${rsvp.slug}`, JSON.stringify(rsvp));
    return kind;
  }
  if (kind === "neon") {
    await ensureNeon();
    const sql = sqlClient()!;
    const payload = JSON.stringify(rsvp);
    await sql`insert into youin_rsvps (id, slug, data) values (${rsvp.id}, ${rsvp.slug}, ${payload}::jsonb)`;
    return kind;
  }
  memory.rsvps.push(rsvp);
  await writeMemoryFile();
  return kind;
}
