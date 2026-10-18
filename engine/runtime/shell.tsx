"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import type { Invite } from "@/invites/schema";
import type { ShellValue, ThemePackage } from "@/engine/types";
import { useAudio } from "@/engine/audio/AudioProvider";
import { FireflyField } from "@/engine/webgl/FireflyField";
import { Footprints } from "@/engine/input/Footprints";
import { formatPartyDate } from "@/invites/logic";

const ShellContext = createContext<ShellValue | null>(null);

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside InviteApp");
  return value;
}

export function InviteShell({ invite, theme, children }: { invite: Invite; theme: ThemePackage; children: ReactNode }) {
  const audio = useAudio();
  const [scene, setScene] = useState(0);
  const sceneRef = useRef(0);
  const busy = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const count = theme.scenes.length;

  useEffect(() => {
    const lists = theme.preload(invite);
    for (const src of lists[scene + 1] ?? []) {
      if (!src || src.startsWith("data:")) continue;
      const image = new Image();
      image.src = src;
    }
  }, [invite, scene, theme]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--px", x.toFixed(3));
      stage.style.setProperty("--py", y.toFixed(3));
    };
    stage.addEventListener("pointermove", onMove);
    return () => stage.removeEventListener("pointermove", onMove);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (busy.current || next === sceneRef.current || next < 0 || next >= count) return;
      busy.current = true;
      audio.start();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const left = leftRef.current;
      const right = rightRef.current;
      const release = () => {
        busy.current = false;
        if (next === count - 1) {
          window.setTimeout(() => document.getElementById("party-details")?.focus(), reduced ? 30 : 200);
        }
      };
      if (reduced || !left || !right) {
        sceneRef.current = next;
        setScene(next);
        release();
        return;
      }
      gsap
        .timeline({ onComplete: release })
        .to(left, { xPercent: 0, duration: 0.38, ease: "power2.inOut" })
        .to(right, { xPercent: 0, duration: 0.38, ease: "power2.inOut" }, "<")
        .call(() => {
          sceneRef.current = next;
          setScene(next);
        })
        .to(left, { xPercent: -105, duration: 0.4, ease: "power2.inOut" }, "+=0.04")
        .to(right, { xPercent: 105, duration: 0.4, ease: "power2.inOut" }, "<");
    },
    [audio, count],
  );

  const shake = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stage.classList.remove("shaking");
    void stage.offsetWidth;
    stage.classList.add("shaking");
    window.setTimeout(() => stage.classList.remove("shaking"), 460);
  }, []);

  const value: ShellValue = { invite, scene, scenes: theme.scenes, goTo, shake };
  const when = formatPartyDate(invite.date, invite.time, invite.timezone);

  return (
    <ShellContext.Provider value={value}>
      <div
        className="desk"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest(".mute")) return;
          audio.start();
        }}
      >
        <a
          className="skip"
          href="#party-details"
          onClick={(event) => {
            event.preventDefault();
            goTo(count - 1);
          }}
        >
          Skip to party details
        </a>
        <aside className="dossier">
          <p className="dossier-kicker">{theme.name}</p>
          <h2>{invite.childName}</h2>
          <p className="hand">turning {invite.age}</p>
          <ul>
            <li>{when}</li>
            {invite.venue ? <li>{invite.venue}</li> : null}
            {invite.host ? <li>{invite.host}</li> : null}
          </ul>
        </aside>
        <div className="portal">
          <FireflyField />
          <div className="stage" ref={stageRef}>
            <div className="scene-slot">{children}</div>
            <div className="leafs" aria-hidden="true">
              <div className="leaf left" ref={leftRef}>
                {theme.leaf ? <img src={theme.leaf} alt="" /> : null}
              </div>
              <div className="leaf right" ref={rightRef}>
                {theme.leaf ? <img src={theme.leaf} alt="" /> : null}
              </div>
            </div>
            <div className="chrome">
              <span className="brand">
                youin<span>.lol</span>
              </span>
              <span className="pager">
                0{scene + 1} / 0{count}
              </span>
              <button
                type="button"
                className="mute"
                aria-pressed={audio.muted}
                aria-label={audio.muted ? "Unmute jungle sounds" : "Mute jungle sounds"}
                onClick={(event) => {
                  event.stopPropagation();
                  audio.toggleMute();
                }}
              >
                {audio.muted ? "Muted" : "Mute"}
              </button>
            </div>
          </div>
        </div>
        <aside className="dossier right">
          <p className="dossier-kicker">Scenes</p>
          <nav aria-label="Invitation scenes">
            {theme.scenes.map((item, index) => (
              <button key={item.id} type="button" aria-current={index === scene ? "step" : undefined} onClick={() => goTo(index)}>
                0{index + 1} {item.label}
              </button>
            ))}
          </nav>
          <p className="hand hint">Sounds start on the first tap. Footprints follow your finger.</p>
        </aside>
        <Footprints />
        <p className="sr-only" aria-live="polite">
          Scene {scene + 1} of {count}: {theme.scenes[scene]?.label}
        </p>
      </div>
    </ShellContext.Provider>
  );
}
