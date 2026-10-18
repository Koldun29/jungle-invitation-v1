import { maybeAiStylize } from "@/lib/photos/ai-stylize";
import { stylizeToSticker } from "@/lib/photos/stylize";
import type { Invite } from "@/invites/schema";

export type PhotoJob = {
  status: "ready" | "fallback";
  notes: string[];
  photos: Invite["photos"];
};

/**
 * Background-job entry for the create flow.
 * The route calls it inline (the work is one image each, well under the
 * function limit). A later queue worker can import this same function:
 * the invite is only marked ready after `runPhotoJob` resolves.
 */
export async function runPhotoJob(input: {
  childName: string;
  child?: Buffer | null;
  pet?: Buffer | null;
}): Promise<PhotoJob> {
  const notes: string[] = [];
  const photos: Invite["photos"] = {
    child: "",
    pet: "",
    childSticker: "",
    petSticker: "",
    treatment: "illustration-fallback",
  };

  const childSticker = await one(input.child, "child", input.childName, notes);
  const petSticker = await one(input.pet, "pet", input.childName, notes);
  if (childSticker) photos.childSticker = childSticker;
  if (petSticker) photos.petSticker = petSticker;
  const ready = Boolean(childSticker || petSticker);
  photos.treatment = ready ? "sticker" : "illustration-fallback";
  if (!ready) notes.push("Cut-out was uncertain, so the theme illustrations stay in front.");
  return { status: ready ? "ready" : "fallback", notes, photos };
}

async function one(
  file: Buffer | null | undefined,
  kind: "child" | "pet",
  childName: string,
  notes: string[],
): Promise<string | null> {
  if (!file || file.byteLength === 0) return null;
  try {
    const ai = await maybeAiStylize({ childName, kind });
    if (ai) {
      notes.push(`${kind} photo styled with the AI Gateway image model and cached on the invite.`);
      return `data:image/webp;base64,${ai.toString("base64")}`;
    }
    const sticker = await stylizeToSticker(file);
    notes.push(
      sticker.uncertain
        ? `${kind} photo kept a soft sticker mask because the background was not a clean cut.`
        : `${kind} photo cut out and cached as a sticker (${Math.round(sticker.cleared * 100)}% background cleared).`,
    );
    if (sticker.uncertain) return null;
    return `data:image/webp;base64,${sticker.webp.toString("base64")}`;
  } catch (error) {
    notes.push(`${kind} photo could not be processed (${error instanceof Error ? error.message : "unknown error"}).`);
    return null;
  }
}
