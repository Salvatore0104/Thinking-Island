"""Generate static Mandarin guidance audio for the 800 six-mode levels."""

from __future__ import annotations

import argparse
import asyncio
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import edge_tts


VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "-10%"
VOLUME = "-5%"
PITCH = "-2Hz"


@dataclass
class Clip:
    file: str
    text: str
    kind: str
    lesson: int | None = None
    step: int | None = None


def build_clips(levels: list[dict]) -> list[Clip]:
    clips = [
        Clip(
            "welcome.mp3",
            "嗨，小船长！十个能力岛、八百个逻辑思维关卡已经全部开放。看图片，听规则，再动手试一试。",
            "global",
        ),
        Clip(
            "try-again.mp3",
            "没关系，先停一下，再听听规则或打开提示。",
            "global",
        ),
        Clip(
            "lesson-complete.mp3",
            "太棒了，这一关完成！让眼睛看远一点，再去下一关吧。",
            "global",
        ),
        Clip("hint-open.mp3", "我们来听一个小提示。", "global"),
    ]

    for level in levels:
        level_id = level["id"]
        activity = level["activities"][0]
        guidance = {
            "choice": "想好以后，点一下正确图片。",
            "dragSort": "把每张图片拖进正确的篮子。",
            "dragOrder": "观察规律，把图片拖到对应空位。",
            "match": "从左边拖线连接到右边的伙伴。",
            "path": "从起点沿着相邻格子走到终点。",
            "jigsaw": "把八块拼图拖回正确位置。",
        }.get(activity.get("type"), "动手试一试。")
        prefix = f"lesson-{level_id:02d}-step-01"
        clips.extend(
            [
                Clip(
                    f"lesson-{level_id:02d}-intro.mp3",
                    f"第{level_id}关，{level['title']}。准备好了吗？",
                    "intro",
                    level_id,
                ),
                Clip(
                    f"{prefix}-prompt.mp3",
                    f"{activity.get('voicePrompt', activity['prompt'])} {guidance}",
                    "prompt",
                    level_id,
                    1,
                ),
                Clip(
                    f"{prefix}-hint.mp3",
                    f"小提示。{activity['hint']}",
                    "hint",
                    level_id,
                    1,
                ),
                Clip(
                    f"{prefix}-correct.mp3",
                    f"{activity['explain']} 你想得很仔细。",
                    "correct",
                    level_id,
                    1,
                ),
            ]
        )
    return clips


async def synthesize(
    clip: Clip,
    output_dir: Path,
    semaphore: asyncio.Semaphore,
    force: bool,
    force_from: int | None,
) -> None:
    destination = output_dir / clip.file
    should_refresh = force or (
        force_from is not None
        and clip.lesson is not None
        and clip.lesson >= force_from
    )
    if destination.exists() and not should_refresh:
        return
    async with semaphore:
        communicate = edge_tts.Communicate(
            clip.text,
            VOICE,
            rate=RATE,
            volume=VOLUME,
            pitch=PITCH,
        )
        await communicate.save(str(destination))
        print(f"generated {clip.file}")


async def run(
    curriculum_path: Path,
    output_dir: Path,
    force: bool,
    force_from: int | None,
) -> None:
    levels = json.loads(curriculum_path.read_text(encoding="utf-8"))
    if len(levels) < 120:
        raise ValueError(f"Expected at least 120 levels, got {len(levels)}")
    if any(len(level["activities"]) != 1 for level in levels):
        raise ValueError("Every visual level must contain exactly one activity")

    clips = build_clips(levels)
    output_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(8)
    await asyncio.gather(
        *(
            synthesize(clip, output_dir, semaphore, force, force_from)
            for clip in clips
        )
    )
    manifest = {
        "generator": "edge-tts",
        "voice": VOICE,
        "rate": RATE,
        "volume": VOLUME,
        "pitch": PITCH,
        "clip_count": len(clips),
        "clips": [asdict(clip) for clip in clips],
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(clips)} clips and manifest to {output_dir}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--curriculum",
        type=Path,
        default=Path("app/visual-levels.json"),
    )
    parser.add_argument("--out", type=Path, default=Path("public/audio"))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--force-from", type=int)
    args = parser.parse_args()
    asyncio.run(run(args.curriculum, args.out, args.force, args.force_from))


if __name__ == "__main__":
    main()
