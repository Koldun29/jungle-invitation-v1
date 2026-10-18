"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
float hash(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float sp = 0.025 + hash(fi * 3.1) * 0.05;
    vec2 p = vec2(
      fract(hash(fi * 1.7) + uTime * sp + uPointer.x * 0.03),
      fract(hash(fi * 2.9) + sin(uTime * 0.35 + fi) * 0.08 + uPointer.y * 0.03)
    );
    vec2 d = (uv - p) * vec2(aspect, 1.0);
    float tw = 0.35 + 0.65 * sin(uTime * 2.2 + fi * 1.3);
    col += vec3(1.0, 0.92, 0.55) * exp(-dot(d, d) * 1100.0) * tw;
  }
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 p = vec2(fract(hash(fi + 9.0) + uTime * 0.012), fract(hash(fi + 4.0) - uTime * 0.03));
    float d = length((uv - p) * vec2(aspect, 1.0));
    col += vec3(0.95, 0.78, 0.5) * exp(-d * d * 5000.0) * 0.55;
  }
  float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(0.8, 1.2)));
  gl_FragColor = vec4(col, clamp(vig, 0.0, 0.95));
}
`;

export function FireflyField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uPointer = gl.getUniformLocation(program, "uPointer");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const pointer = { x: 0, y: 0 };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    };
    canvas.parentElement?.addEventListener("pointermove", onMove);

    let frame = 0;
    let running = true;
    const draw = (now: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 0 : now / 1000);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduced && !document.hidden) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const onVis = () => {
      if (!document.hidden && !reduced) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVis);
      canvas.parentElement?.removeEventListener("pointermove", onMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className="fireflies" aria-hidden="true" />;
}
