import type { ComponentType } from "react";
import type { Invite } from "@/invites/schema";

export type SceneMeta = { id: string; label: string };

export type ThemePackage = {
  id: string;
  name: string;
  scenes: SceneMeta[];
  preload: (invite: Invite) => string[][];
  leaf?: string;
  Experience: ComponentType;
};

export type ShellValue = {
  invite: Invite;
  scene: number;
  scenes: SceneMeta[];
  goTo: (index: number) => void;
  shake: () => void;
};
