import type { Invite } from "@/invites/schema";
import type { ThemePackage } from "@/engine/types";
import { DinosaurExperience } from "@/themes/dinosaur/DinosaurExperience";

function keep(urls: Array<string | undefined>): string[] {
  return urls.filter((url): url is string => Boolean(url));
}

export const dinosaurTheme: ThemePackage = {
  id: "dinosaur",
  name: "Jungle dino adventure",
  leaf: "/themes/dinosaur/leaf.webp",
  scenes: [
    { id: "intro", label: "The adventure" },
    { id: "ride", label: "The long-neck" },
    { id: "dig", label: "The fossil" },
    { id: "party", label: "The party" },
  ],
  preload(invite: Invite) {
    const child = invite.photos.childSticker;
    const pet = invite.photos.petSticker;
    return [
      keep(["/themes/dinosaur/jungle.webp", child, pet]),
      keep(["/themes/dinosaur/ride.webp", "/themes/dinosaur/hero-ride.webp", child, pet]),
      keep(["/themes/dinosaur/grotto.webp", "/themes/dinosaur/hero-dig.webp", "/themes/dinosaur/fossil.webp"]),
      keep(["/themes/dinosaur/party.webp", child, pet, "/themes/dinosaur/hero-party-child.webp"]),
    ];
  },
  Experience: DinosaurExperience,
};

const themes: Record<string, ThemePackage> = { dinosaur: dinosaurTheme };

export function getTheme(id: string): ThemePackage {
  return themes[id] ?? dinosaurTheme;
}
