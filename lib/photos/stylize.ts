import sharp from "sharp";

export type StylizeResult = {
  webp: Buffer;
  /** Share of pixels cleared as background, 0–1. */
  cleared: number;
  /** True when the cut-out was too uncertain and a soft vignette was used instead. */
  uncertain: boolean;
};

/**
 * Vercel-safe sticker pipeline: resize, flood-fill a simple backdrop from the
 * corners, posterize, ink the edges, and paint a cream sticker stroke.
 * Busy backgrounds (the sample cat on a grey rug) are handled offline by
 * `scripts/process-sample-photos.py` and cached. This function is the runtime
 * worker for uploads.
 */
export async function stylizeToSticker(input: Buffer): Promise<StylizeResult> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = new Uint8ClampedArray(data);
  const original = pixels.slice(0);
  const cleared = floodBackground(pixels, width, height);
  const remaining = opaqueRatio(pixels, width, height);
  let uncertain = false;
  if (cleared < 0.06 || remaining < 0.16) {
    pixels.set(original);
    vignette(pixels, width, height);
    uncertain = true;
  } else {
    posterize(pixels, width, height);
    inkEdges(pixels, width, height);
  }
  const outlined = paintOutline(pixels, width, height);
  const webp = await sharp(Buffer.from(outlined.pixels), {
    raw: { width: outlined.width, height: outlined.height, channels: 4 },
  })
    .webp({ quality: 80 })
    .toBuffer();
  return { webp, cleared, uncertain };
}

function opaqueRatio(pixels: Uint8ClampedArray, width: number, height: number): number {
  let opaque = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 20) opaque++;
  return opaque / (width * height);
}

function floodBackground(pixels: Uint8ClampedArray, width: number, height: number): number {
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const index of corners) {
    const o = index * 4;
    r += pixels[o];
    g += pixels[o + 1];
    b += pixels[o + 2];
  }
  r /= corners.length;
  g /= corners.length;
  b /= corners.length;

  const seen = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (index: number) => {
    if (seen[index]) return;
    const o = index * 4;
    const dr = pixels[o] - r;
    const dg = pixels[o + 1] - g;
    const db = pixels[o + 2] - b;
    if (dr * dr + dg * dg + db * db > 52 * 52) return;
    seen[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  let cleared = 0;
  while (head < tail) {
    const index = queue[head++];
    const o = index * 4;
    pixels[o + 3] = 0;
    cleared++;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(index - 1);
    if (x + 1 < width) push(index + 1);
    if (y > 0) push(index - width);
    if (y + 1 < height) push(index + width);
  }
  return cleared / (width * height);
}

function posterize(pixels: Uint8ClampedArray, width: number, height: number) {
  const step = 28;
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    if (pixels[o + 3] < 8) continue;
    pixels[o] = Math.min(255, Math.round(pixels[o] / step) * step + 6);
    pixels[o + 1] = Math.min(255, Math.round(pixels[o + 1] / step) * step);
    pixels[o + 2] = Math.max(0, Math.round(pixels[o + 2] / step) * step - 8);
  }
}

function inkEdges(pixels: Uint8ClampedArray, width: number, height: number) {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (alpha[i] < 40) continue;
      const gx = Math.abs(alpha[i + 1] - alpha[i - 1]);
      const gy = Math.abs(alpha[i + width] - alpha[i - width]);
      if (gx + gy < 80) continue;
      const o = i * 4;
      pixels[o] = Math.round(pixels[o] * 0.45);
      pixels[o + 1] = Math.round(pixels[o + 1] * 0.38);
      pixels[o + 2] = Math.round(pixels[o + 2] * 0.32);
    }
  }
}

function vignette(pixels: Uint8ClampedArray, width: number, height: number) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const keep = d < 0.72 ? 1 : Math.max(0, 1 - (d - 0.72) / 0.38);
      pixels[(y * width + x) * 4 + 3] = Math.round(pixels[(y * width + x) * 4 + 3] * keep);
    }
  }
}

function paintOutline(pixels: Uint8ClampedArray, width: number, height: number) {
  const pad = 18;
  const outW = width + pad * 2;
  const outH = height + pad * 2;
  const out = new Uint8ClampedArray(outW * outH * 4);
  const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? 0 : pixels[(y * width + x) * 4 + 3]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = alpha(x, y);
      const dx = x + pad;
      const dy = y + pad;
      const o = (dy * outW + dx) * 4;
      if (a > 24) {
        const src = (y * width + x) * 4;
        out[o] = pixels[src];
        out[o + 1] = pixels[src + 1];
        out[o + 2] = pixels[src + 2];
        out[o + 3] = pixels[src + 3];
        continue;
      }
      let ring = false;
      for (let ky = -3; ky <= 3 && !ring; ky++) {
        for (let kx = -3; kx <= 3; kx++) {
          if (kx * kx + ky * ky > 10) continue;
          if (alpha(x + kx, y + ky) > 40) {
            ring = true;
            break;
          }
        }
      }
      if (ring) {
        out[o] = 255;
        out[o + 1] = 247;
        out[o + 2] = 230;
        out[o + 3] = 255;
      }
    }
  }
  return { pixels: out, width: outW, height: outH };
}
