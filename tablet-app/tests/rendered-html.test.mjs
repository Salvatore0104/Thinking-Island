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
  const [page, games, css, levelsText, manifestText, packageText, audioFiles, sceneFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-renderers.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/visual-levels.json", import.meta.url), "utf8"),
    readFile(new URL("../public/audio/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../public/audio/", import.meta.url)),
    readdir(new URL("../public/game-scenes/", import.meta.url)),
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
  assert.match(page, /关卡总览/);
  assert.match(page, /800-v4/);
  assert.match(page, /CHALLENGE_LENGTH = 20/);
  assert.match(page, /randomChallenge/);
  assert.match(page, /随机闯关/);
  assert.match(page, /<GameRenderer/);
  assert.match(page, /lessonAudio/);
  assert.doesNotMatch(page, /SpeechSynthesisUtterance|speechSynthesis\.speak/);
  assert.match(games, /type GameType = "choice" \| "dragSort" \| "dragOrder" \| "match" \| "path" \| "jigsaw"/);
  assert.match(games, /onPointerDown/);
  assert.match(games, /setPointerCapture/);
  assert.match(games, /function JigsawGame/);
  assert.match(games, /function MatchGame/);
  assert.match(games, /item\.emoji !== expected\.emoji/);
  assert.match(games, /ResizeObserver/);
  assert.match(games, /data-puzzle-engine="headbreaker"/);
  assert.match(games, /attachSolvedValidator/);
  assert.match(games, /path-trail/);
  assert.match(css, /celebration-backdrop/);
  assert.match(css, /fixed-level-nav/);
  assert.match(css, /jigsaw-board/);
  assert.match(css, /headbreaker-stage-shell/);
  assert.match(css, /match-lines-canvas/);
  assert.match(css, /option-visual\.compact/);
  assert.ok(
    levels
      .flatMap((level) => level.activities)
      .every((activity) => activity.visualOnly && activity.voicePrompt),
  );
  assert.ok(levels.every((level) => level.activities.length === 1));
  const allActivities = levels.flatMap((level) => level.activities);
  assert.equal(new Set(allActivities.map((activity) => activity.contentSignature)).size, 800);
  assert.ok(allActivities.every((activity, index) => activity.reasoningSteps === Math.floor(index % 80 / 20) + 1));
  const expectedTypes = { choice: 34, dragSort: 14, dragOrder: 10, match: 10, path: 8, jigsaw: 4 };
  for (const skill of new Set(levels.map((level) => level.skill))) {
    const skillLevels = levels.filter((level) => level.skill === skill);
    const skillActivities = skillLevels.map((level) => level.activities[0]);
    const typeCounts = skillLevels
      .map((level) => level.activities[0].type)
      .reduce((counts, type) => ({ ...counts, [type]: (counts[type] ?? 0) + 1 }), {});
    assert.deepEqual(typeCounts, expectedTypes);
    assert.ok(new Set(skillActivities.map((activity) => activity.concept)).size >= 16);
    assert.ok(new Set(skillActivities.map((activity) => activity.voicePrompt)).size >= 16);
  }
  for (const activity of levels.flatMap((level) => level.activities)) {
    if (activity.type === "choice") {
      assert.ok(activity.options.length === 4);
      assert.ok(Number.isInteger(activity.answer) && activity.answer >= 0 && activity.answer < 4);
      assert.equal(new Set(activity.options.map((option) => option.emoji)).size, activity.options.length);
    } else if (activity.type === "dragSort") {
      assert.ok(activity.items.length >= 4 && [2, 3].includes(activity.zones.length));
      assert.ok(activity.items.every((item) => activity.zones.some((zone) => zone.id === item.target)));
      assert.ok(activity.zones.every((zone) => zone.emoji !== "🟣"));
    } else if (activity.type === "dragOrder") {
      assert.deepEqual(new Set(activity.items.map((item) => item.id)), new Set(activity.answerOrder));
    } else if (activity.type === "match") {
      assert.equal(activity.left.length, activity.right.length);
      assert.equal(activity.pairs.length, activity.left.length);
      assert.equal(new Set(activity.left.map((item) => item.emoji)).size, activity.left.length);
      assert.equal(new Set(activity.right.map((item) => item.emoji)).size, activity.right.length);
      const leftById = new Map(activity.left.map((item) => [item.id, item]));
      const rightById = new Map(activity.right.map((item) => [item.id, item]));
      assert.ok(activity.pairs.every(([leftId, rightId]) => leftById.has(leftId) && rightById.has(rightId)));
      assert.equal(new Set(activity.pairs.map(([leftId]) => leftId)).size, activity.left.length);
      assert.equal(new Set(activity.pairs.map(([, rightId]) => rightId)).size, activity.right.length);
    } else if (activity.type === "path") {
      assert.ok(!activity.blocked.includes(activity.start) && !activity.blocked.includes(activity.goal));
      assert.ok(activity.solution.every((cell) => !activity.blocked.includes(cell)));
      assert.ok(activity.solution.slice(1).every((cell, index) => {
        const previous = activity.solution[index];
        return Math.abs(Math.floor(cell / activity.size) - Math.floor(previous / activity.size))
          + Math.abs((cell % activity.size) - (previous % activity.size)) === 1;
      }));
    } else if (activity.type === "jigsaw") {
      const pieceCount = activity.rows * activity.columns;
      assert.ok(pieceCount === 4 || pieceCount === 9);
      assert.deepEqual(
        [...activity.order].sort((a, b) => a - b),
        Array.from({ length: pieceCount }, (_, index) => index),
      );
    }
  }
  assert.equal(sceneFiles.filter((file) => /^scene-\d+-\d+\.webp$/.test(file)).length, 30);

  const manifest = JSON.parse(manifestText);
  const packageJson = JSON.parse(packageText);
  const mp3Files = audioFiles.filter((file) => file.endsWith(".mp3"));
  assert.equal(packageJson.dependencies.headbreaker, "3.0.0");
  assert.equal(packageJson.dependencies.konva, "6.0.0");
  assert.equal(manifest.generator, "edge-tts");
  assert.equal(manifest.voice, "zh-CN-XiaoxiaoNeural");
  assert.equal(manifest.clip_count, 1607);
  assert.equal(manifest.clips.length, 1607);
  assert.equal(mp3Files.length, 1607);
  assert.ok(audioFiles.includes("lesson-001-step-01-prompt.mp3"));
  assert.ok(audioFiles.includes("lesson-800-step-01-hint.mp3"));
});
