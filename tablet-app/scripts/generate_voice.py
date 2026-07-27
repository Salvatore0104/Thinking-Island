"""Generate reproducible Mandarin guidance audio for Thinking Island.

The script extracts lesson copy from app/page.tsx and generates static MP3 files.
The app never calls a speech service at runtime.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
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


def extract_content(source: str) -> tuple[list[tuple[str, str]], list[tuple[str, str, str, str]]]:
    lessons = re.findall(
        r'id:\s*\d+,\s*week:\s*\d+,\s*title:\s*"([^"]+)",\s*subtitle:\s*"([^"]+)"',
        source,
    )
    activities = re.findall(
        r'\{\s*prompt:\s*"([^"]+)",\s*instruction:\s*"([^"]+)".*?'
        r'answer:\s*\d+,\s*hint:\s*"([^"]+)",\s*explain:\s*"([^"]+)"\s*\}',
        source,
        re.DOTALL,
    )
    if len(lessons) != 12 or len(activities) != 36:
        raise ValueError(f"Expected 12 lessons and 36 activities, got {len(lessons)} and {len(activities)}")
    return lessons, activities


def build_clips(lessons: list[tuple[str, str]], activities: list[tuple[str, str, str, str]]) -> list[Clip]:
    clips = [
        Clip("welcome.mp3", "嗨，小船长！新的思维任务已经准备好。每天想一点，办法多一点。", "global"),
        Clip("try-again.mp3", "没关系，好办法还藏着呢。再看一看线索，或者打开提示试试。", "global"),
        Clip("lesson-complete.mp3", "太棒了，今天的思维探险完成！现在让眼睛休息一下吧。", "global"),
        Clip("hint-open.mp3", "我们来听一个小提示。", "global"),
    ]
    for lesson_index, (title, subtitle) in enumerate(lessons, start=1):
        clips.append(
            Clip(
                f"lesson-{lesson_index:02d}-intro.mp3",
                f"欢迎来到第{lesson_index}课，{title}。{subtitle}。准备好了吗？我们开始吧。",
                "intro",
                lesson_index,
            )
        )
        for step_index in range(1, 4):
            prompt, instruction, hint, explain = activities[(lesson_index - 1) * 3 + step_index - 1]
            base = f"lesson-{lesson_index:02d}-step-{step_index:02d}"
            clips.extend(
                [
                    Clip(
                        f"{base}-prompt.mp3",
                        f"第{step_index}关。{prompt}。{instruction}。想好以后，轻轻点一下答案。",
                        "prompt",
                        lesson_index,
                        step_index,
                    ),
                    Clip(
                        f"{base}-hint.mp3",
                        f"小提示。{hint}",
                        "hint",
                        lesson_index,
                        step_index,
                    ),
                    Clip(
                        f"{base}-correct.mp3",
                        f"{explain}。你观察得很仔细。",
                        "correct",
                        lesson_index,
                        step_index,
                    ),
                ]
            )
    return clips


async def synthesize(clip: Clip, output_dir: Path, semaphore: asyncio.Semaphore, force: bool) -> None:
    destination = output_dir / clip.file
    if destination.exists() and not force:
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


async def run(source_path: Path, output_dir: Path, force: bool) -> None:
    source = source_path.read_text(encoding="utf-8")
    lessons, activities = extract_content(source)
    clips = build_clips(lessons, activities)
    output_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(6)
    await asyncio.gather(*(synthesize(clip, output_dir, semaphore, force) for clip in clips))
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
    parser.add_argument("--source", type=Path, default=Path("app/page.tsx"))
    parser.add_argument("--out", type=Path, default=Path("public/audio"))
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    asyncio.run(run(args.source, args.out, args.force))


if __name__ == "__main__":
    main()
