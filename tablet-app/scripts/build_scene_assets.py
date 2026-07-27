"""Crop the original Thinking Island contact sheet into game-ready WebP scenes."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "game-scenes" / "source-contact.png"
OUTPUT = ROOT / "public" / "game-scenes"


def crop_panel(sheet: Image.Image, index: int) -> Image.Image:
    columns, rows = 5, 2
    width, height = sheet.size
    column = index % columns
    row = index // columns
    gutter = max(8, width // 220)
    left = round(column * width / columns) + gutter
    right = round((column + 1) * width / columns) - gutter
    top = round(row * height / rows) + gutter
    bottom = round((row + 1) * height / rows) - gutter
    return sheet.crop((left, top, right, bottom)).convert("RGB")


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE)
    for category_index in range(10):
        panel = crop_panel(sheet, category_index)
        variants = [
            cover(panel, (960, 720)),
            cover(ImageOps.mirror(panel), (960, 720)),
            ImageEnhance.Color(cover(panel.resize((round(panel.width * 1.12), round(panel.height * 1.12))), (960, 720))).enhance(0.88),
        ]
        for scene_index, scene in enumerate(variants, start=1):
            path = OUTPUT / f"scene-{category_index + 1}-{scene_index}.webp"
            scene.save(path, "WEBP", quality=88, method=6)
    print(f"wrote 30 scene assets to {OUTPUT}")


if __name__ == "__main__":
    main()
