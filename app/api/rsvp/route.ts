import { getInvite, saveRsvp } from "@/invites/store";
import { rsvpSchema } from "@/invites/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the RSVP as JSON." }, { status: 400 });
  }
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Check the name, guest counts, and reply." }, { status: 400 });
  }
  const invite = await getInvite(parsed.data.slug);
  if (!invite) return Response.json({ ok: false, error: "That invite does not exist." }, { status: 404 });

  const storage = await saveRsvp({
    ...parsed.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  return Response.json({ ok: true, storage, persisted: storage !== "memory" });
}
