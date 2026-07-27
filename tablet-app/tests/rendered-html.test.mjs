import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Thinking Island shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>思维岛｜4–6岁儿童思维课<\/title>/i);
  assert.match(html, /正在铺好思维岛的小路/);
  assert.doesNotMatch(html, /登录|注册|账号|密码/);
});

test("ships ten categories with 80 image-first questions each", async () => {
  const [page, css, levelsText, manifestText, audioFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/visual-levels.json", import.meta.url), "utf8"),
    readFile(new URL("../public/audio/manifest.json", import.meta.url), "utf8"),
    readdir(new URL("../public/audio/", import.meta.url)),
  ]);

  const levels = JSON.parse(levelsText);
  assert.equal(levels.length, 800);
  assert.deepEqual(
    levels.map((level) => level.id),
    Array.from({ length: 800 }, (_, index) => index + 1),
  );
  assert.equal(levels.at(-1).week, 20);
  assert.equal(new Set(levels.map((level) => level.skill)).size, 10);
  assert.ok(
    [...new Set(levels.map((level) => level.skill))]
      .every((skill) => levels.filter((level) => level.skill === skill).length === 80),
  );
  assert.match(page, /10个能力类别/);
  assert.match(page, /category-grid/);
  assert.match(page, /每类80题/);
  assert.doesNotMatch(page, /signIn|signUp|login|logout/i);
  assert.doesNotMatch(page, /disabled=\{locked\}|继续前进后解锁/);
  assert.match(page, /const next = categoryLevels\[currentIndex \+ 1\]/);
  assert.match(page, /setActiveLesson\(next\)/);
  assert.match(page, /恭喜答对了/);
  assert.match(page, /setTimeout\(\(\) =>/);
  assert.match(page, /browseLesson\(-1\)/);
  assert.match(page, /browseLesson\(1\)/);
  assert.match(page, /draggable/);
  assert.match(page, /onDrop/);
  assert.match(page, /connect-game/);
  assert.match(page, /interactionMode === "choice"/);
  assert.match(page, /interactionMode === "drag"/);
  assert.match(page, /interactionMode === "connect"/);
  assert.match(page, /window\.speechSynthesis\.speak\(utterance\)/);
  assert.match(css, /celebration-backdrop/);
  assert.match(css, /drag-game/);
  assert.match(css, /match-row/);
  assert.match(css, /option-visual\.compact/);
  assert.match(css, /grid-template-columns:minmax\(180px,220px\) minmax\(0,1fr\) 132px/);
  assert.ok(
    levels
      .flatMap((level) => level.activities)
      .every((activity) => activity.visualOnly && activity.voicePrompt),
  );
  assert.ok(levels.every((level) => level.activities.length === 1));
  assert.ok(
    levels
      .flatMap((level) => level.activities)
      .every((activity) => activity.options.length >= 4),
  );
  assert.ok(
    levels
      .flatMap((level) => level.activities)
      .every(
        (activity) =>
          Number.isInteger(activity.answer) &&
          activity.answer >= 0 &&
          activity.answer < activity.options.length &&
          activity.options.every((option) => option.emoji),
      ),
  );

  const manifest = JSON.parse(manifestText);
  const mp3Files = audioFiles.filter((file) => file.endsWith(".mp3"));
  assert.equal(manifest.clip_count, 484);
  assert.equal(manifest.clips.length, 484);
  assert.equal(mp3Files.length, 484);
  assert.ok(audioFiles.includes("lesson-120-intro.mp3"));
  assert.ok(audioFiles.includes("lesson-120-step-01-prompt.mp3"));
});
