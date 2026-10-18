import { runPhotoJob } from "@/lib/jobs/process-photos";
import { slugifyName } from "@/invites/host";
import { FLAGSHIP_SLUG } from "@/invites/seed";
import { inviteSchema } from "@/invites/schema";
import { getInvite, saveInvite } from "@/invites/store";

export const runtime = "nodejs";

const MAX_BYTES = 4_000_000;

export async function POST(request: Request) {
  const form = await request.formData();
  const childName = String(form.get("childName") ?? "").trim();
  let slug = slugifyName(String(form.get("slug") || childName));
  if (slug === FLAGSHIP_SLUG) slug = `${slug}-party`;
  if (await getInvite(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 40);

  const age = Number(form.get("age"));
  const parsed = inviteSchema.safeParse({
    slug,
    themeId: String(form.get("themeId") || "dinosaur"),
    childName,
    childPronoun: String(form.get("childPronoun") || "their"),
    age,
    petName: String(form.get("petName") ?? ""),
    petSpecies: String(form.get("petSpecies") || "cat"),
    date: String(form.get("date") ?? ""),
    time: String(form.get("time") ?? ""),
    timezone: String(form.get("timezone") ?? ""),
    venue: String(form.get("venue") ?? ""),
    address: String(form.get("address") ?? ""),
    mapUrl: String(form.get("mapUrl") ?? ""),
    host: String(form.get("host") ?? ""),
    whatsappNumber: String(form.get("whatsappNumber") ?? ""),
    rsvpDeadline: String(form.get("rsvpDeadline") ?? ""),
    photos: {
      child: "",
      pet: "",
      childSticker: "",
      petSticker: "",
      treatment: "illustration-fallback",
    },
  });
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Check the name, age, date, and theme." }, { status: 400 });
  }

  let child: Buffer | null = null;
  let pet: Buffer | null = null;
  try {
    child = await readUpload(form.get("childPhoto"));
    pet = await readUpload(form.get("petPhoto"));
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "The photo could not be read." },
      { status: 400 },
    );
  }
  const job = await runPhotoJob({ childName: parsed.data.childName, child, pet });
  const invite = { ...parsed.data, photos: job.photos };
  const storage = await saveInvite(invite);
  const root = process.env.INVITE_ROOT_DOMAIN || "youin.lol";
  return Response.json({
    ok: true,
    url: `/i/${invite.slug}`,
    host: `${invite.slug}.${root}`,
    storage,
    photoJob: { status: job.status, notes: job.notes },
    invite,
  });
}

async function readUpload(value: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_BYTES) throw new Error("Photos need to be under 4 MB.");
  if (value.type && !value.type.startsWith("image/")) throw new Error("Upload a photo.");
  return Buffer.from(await value.arrayBuffer());
}
