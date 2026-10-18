import { buildIcs } from "@/invites/logic";
import { getInvite } from "@/invites/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const invite = await getInvite(slug);
  if (!invite) return new Response("Invite not found", { status: 404 });
  const ics = buildIcs(invite);
  if (!ics) return new Response("This invite has no calendar date.", { status: 422 });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${invite.slug}-birthday.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
