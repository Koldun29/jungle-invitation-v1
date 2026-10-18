"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { JungleAudio } from "@/engine/audio/jungle-audio";

type AudioApi = {
  muted: boolean;
  toggleMute: () => void;
  start: () => void;
  tap: () => void;
  roar: () => void;
  dig: () => void;
  hatch: () => void;
};

const AudioCtx = createContext<AudioApi | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useRef<JungleAudio | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("youin-muted") === "1") setMuted(true);
    } catch {
      /* private mode */
    }
  }, []);

  const api = useMemo<AudioApi>(() => {
    const get = () => (engine.current ??= new JungleAudio());
    return {
      muted,
      toggleMute() {
        const next = !get().muted;
        get().setMuted(next);
        setMuted(next);
        try {
          localStorage.setItem("youin-muted", next ? "1" : "0");
        } catch {
          /* private mode */
        }
      },
      start() {
        const audio = get();
        try {
          if (localStorage.getItem("youin-muted") === "1") {
            audio.setMuted(true);
            setMuted(true);
          }
        } catch {
          /* ignore */
        }
        audio.start();
      },
      tap() {
        get().tap();
      },
      roar() {
        get().roar();
      },
      dig() {
        get().dig();
      },
      hatch() {
        get().hatch();
      },
    };
  }, [muted]);

  return <AudioCtx.Provider value={api}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const value = useContext(AudioCtx);
  if (!value) throw new Error("useAudio must be used inside AudioProvider");
  return value;
}
