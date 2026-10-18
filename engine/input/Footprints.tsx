"use client";

import { useEffect, useRef } from "react";

type Stamp = { x: number; y: number; angle: number; life: number; flip: number };

export function Footprints() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stamps: Stamp[] = [];
    let frame = 0;
    let last = 0;
    let flip = 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawPrint = (stamp: Stamp) => {
      ctx.save();
      ctx.translate(stamp.x, stamp.y);
      ctx.rotate(stamp.angle);
      ctx.scale(stamp.flip, 1);
      ctx.globalAlpha = Math.max(0, stamp.life);
      ctx.fillStyle = "#123526";
      ctx.beginPath();
      ctx.ellipse(0, 6, 7, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(-8, -8, 3.1, 4.4, -0.5, 0, Math.PI * 2);
      ctx.ellipse(0, -12, 3.1, 4.6, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -8, 3.1, 4.4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = stamps.length - 1; i >= 0; i--) {
        stamps[i].life -= 0.012;
        if (stamps[i].life <= 0) stamps.splice(i, 1);
        else drawPrint(stamps[i]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, .party-scroll, .dossier")) return;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      flip *= -1;
      stamps.push({
        x: event.clientX,
        y: event.clientY,
        angle: (Math.random() - 0.5) * 0.6,
        life: 0.85,
        flip,
      });
      if (stamps.length > 24) stamps.shift();
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="footprints" aria-hidden="true" />;
}
