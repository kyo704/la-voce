#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "equippedCache.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const store = new Map();
  global.window = { localStorage: {
    setItem: (k, v) => store.set(k, v), getItem: (k) => store.get(k) || null,
    removeItem: (k) => store.delete(k)
  } };
  m.rememberEquipped("u1", { hat: "h1", outfit: "o1" });
  ok(m.recallEquipped("u1").hat === "h1", "装備を端末へ覚える");
  ok(m.recallEquipped("u2") === null, "別ユーザーを混ぜない");
  store.set("woolsong-equipped-u1", "壊れた");
  ok(m.recallEquipped("u1") === null, "壊れた値はnull");
  m.rememberEquipped("u1", ["bad"]);
  ok(m.recallEquipped("u1") === null, "配列を装備として読まない");
  m.rememberEquipped("u1", { hat: "h2" });
  m.forgetEquipped("u1");
  ok(m.recallEquipped("u1") === null, "忘れる");
  delete global.window;
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
