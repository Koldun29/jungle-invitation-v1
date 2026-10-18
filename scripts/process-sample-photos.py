#!/usr/bin/env python3
"""Offline sticker pipeline for the sample photos.

Runtime uploads on Vercel use lib/photos/stylize.ts (sharp + flood fill).
These sample portraits are cached here because the cat sits on a grey rug
that a corner flood-fill would eat. Re-run from the repo root:

    python3 scripts/process-sample-photos.py

Inputs:  samples/corina/corina.jpg, samples/corina/cat.jpg
Outputs: public/invites/corina/stickers/*.webp
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples" / "corina"
OUT = ROOT / "public" / "invites" / "corina" / "stickers"


def grabcut(path: Path, rect: tuple[int, int, int, int]) -> tuple[np.ndarray, np.ndarray]:
    bgr = cv2.imread(str(path))
    mask = np.zeros(bgr.shape[:2], np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, rect, bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
    alpha = cv2.GaussianBlur(alpha, (5, 5), 0)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), alpha


def sticker(rgb: np.ndarray, alpha: np.ndarray, max_w: int) -> Image.Image:
    image = Image.fromarray(rgb).convert("RGBA")
    image.putalpha(Image.fromarray(alpha))
    image = image.crop(image.getbbox())
    if image.width > max_w:
        image = image.resize((max_w, int(image.height * max_w / image.width)), Image.Resampling.LANCZOS)
    colored = ImageEnhance.Contrast(ImageEnhance.Color(image.convert("RGB")).enhance(1.22)).enhance(1.1)
    colored = colored.quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert("RGB")
    edges = np.array(image.convert("L").filter(ImageFilter.FIND_EDGES))
    arr = np.array(Image.merge("RGBA", (*colored.split(), image.getchannel("A"))))
    ink = (edges > 48) & (arr[:, :, 3] > 40)
    arr[ink, 0] = (arr[ink, 0] * 0.5).astype(np.uint8)
    arr[ink, 1] = (arr[ink, 1] * 0.42).astype(np.uint8)
    arr[ink, 2] = (arr[ink, 2] * 0.36).astype(np.uint8)
    cut = Image.fromarray(arr)
    alpha_channel = np.array(cut.getchannel("A"))
    canvas = Image.new("RGBA", (cut.width + 48, cut.height + 56), (0, 0, 0, 0))
    shadow = np.zeros((cut.height, cut.width, 4), np.uint8)
    shadow[:, :, 0], shadow[:, :, 1], shadow[:, :, 2] = 10, 32, 22
    shadow[:, :, 3] = (alpha_channel * 0.38).astype(np.uint8)
    canvas.paste(Image.fromarray(shadow).filter(ImageFilter.GaussianBlur(7)), (28, 34), Image.fromarray(shadow).filter(ImageFilter.GaussianBlur(7)))
    canvas.paste(cut, (18, 14), cut)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("corina.jpg", "corina.webp", (30, 8, 770, 680), 560),
        ("cat.jpg", "cat.webp", (160, 200, 1240, 1750), 700),
    ]
    for source, dest, rect, width in jobs:
        rgb, alpha = grabcut(SAMPLES / source, rect)
        sticker(rgb, alpha, width).save(OUT / dest, "WEBP", quality=82, method=6)
        print(dest)


if __name__ == "__main__":
    main()
