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

test("ships eight weeks of lessons and the complete voice library", async () => {
  const [page, manifestText, audioFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/audio/manifest.json", import.meta.url), "utf8"),
    readdir(new URL("../public/audio/", import.meta.url)),
  ]);

  const lessons = [...page.matchAll(/^\s+id:\s*(\d+),\s*week:\s*(\d+),/gm)];
  assert.equal(lessons.length, 24);
  assert.deepEqual(
    lessons.map((match) => Number(match[1])),
    Array.from({ length: 24 }, (_, index) => index + 1),
  );
  assert.deepEqual(
    [...new Set(lessons.map((match) => Number(match[2])))],
    Array.from({ length: 8 }, (_, index) => index + 1),
  );
  assert.match(page, /八周，二十四次小探险/);
  assert.doesNotMatch(page, /signIn|signUp|login|logout/i);

  const manifest = JSON.parse(manifestText);
  const mp3Files = audioFiles.filter((file) => file.endsWith(".mp3"));
  assert.equal(manifest.clip_count, 244);
  assert.equal(manifest.clips.length, 244);
  assert.equal(mp3Files.length, 244);
  assert.ok(audioFiles.includes("lesson-24-intro.mp3"));
});
