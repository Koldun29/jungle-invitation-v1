import { z } from "zod";

export const themeIds = ["dinosaur"] as const;

export const inviteSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  themeId: z.enum(themeIds),
  childName: z.string().trim().min(1).max(40),
  childPronoun: z.enum(["her", "his", "their"]).default("their"),
  age: z.number().int().min(1).max(18),
  petName: z.string().trim().max(40).default(""),
  petSpecies: z.string().trim().max(24).default("cat"),
  /** Kept as entered. The flagship seed is `25.05.1996`. */
  date: z.string().trim().min(1).max(40),
  time: z.string().trim().max(20).default(""),
  timezone: z.string().trim().max(40).default(""),
  venue: z.string().trim().max(120).default(""),
  address: z.string().trim().max(180).default(""),
  mapUrl: z.string().trim().max(400).default(""),
  host: z.string().trim().max(80).default(""),
  whatsappNumber: z.string().trim().max(24).default(""),
  rsvpDeadline: z.string().trim().max(40).default(""),
  photos: z
    .object({
      child: z.string().default(""),
      pet: z.string().default(""),
      childSticker: z.string().default(""),
      petSticker: z.string().default(""),
      treatment: z.enum(["cached-sticker", "sticker", "illustration-fallback"]).default("illustration-fallback"),
    })
    .default({
      child: "",
      pet: "",
      childSticker: "",
      petSticker: "",
      treatment: "illustration-fallback",
    }),
});

export type Invite = z.infer<typeof inviteSchema>;

export const rsvpSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().trim().min(1).max(80),
  attending: z.enum(["yes", "no", "maybe"]),
  adults: z.number().int().min(0).max(20),
  kids: z.number().int().min(0).max(20),
  note: z.string().trim().max(280).default(""),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export type StoredRsvp = RsvpInput & { id: string; createdAt: string };
