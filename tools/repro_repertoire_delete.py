#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★消した 曲が 戻るかを、★実際に 動かして 確かめる（★No.014）。

  ★出どころ 2026-09-14、★坂本さん

  ★★確かめる 筋は 3つ です。
    ★㋐ findAffectedDatesForRepertoire の 見える 範囲
       → ★entries を ぜんぶ 読んで いるか。★送った 日付の 数で 分かります。
    ★㋑ migrateLegacyToActivities が 旧列から 作り直す
       → ★書き戻した 行の `activities` と `repertoire` を 見ます。
    ★㋒ writeWithMissingColumnFallback が 列を 黙って 落とす
       → ★画面の 言づて（console）に 出ます。★そこを 拾います。

  ★★だから 見るのは 3つ。
    ★① console の 言づて ぜんぶ
    ★② 台帳への 書き込み（★送った 中身を そのまま）
    ★③ 消す 前・消した 後・読み直した 後 の 3枚

  ★★言づてと 通信を 取らずに 絵だけ 撮ると、
    ★「戻りました」しか 分かりません。★なぜ 戻ったかは 分かりません。
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "repro")
os.makedirs(OUT, exist_ok=True)

EMAIL = os.environ.get("REPRO_EMAIL", "kyo0703opera+localtest@gmail.com")
PASS = os.environ.get("REPRO_PASS", "LocalTest-2026-0914!")
SONG = os.environ.get("REPRO_SONG", "テスト曲A")
BASE = os.environ.get("REPRO_BASE", "http://localhost:3000")

JS = r"""
const { chromium } = require("playwright");
const [, , base, email, pass, song, out] = process.argv;
const log = [];
const calls = [];

const shot = async (p, name) => {
  await p.screenshot({ path: out + "/" + name + ".png", fullPage: true });
};

(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 430, height: 900 },
    deviceScaleFactor: 2 });

  p.on("console", (m) => log.push({ type: m.type(), text: m.text() }));
  p.on("pageerror", (e) => log.push({ type: "pageerror", text: String(e) }));
  // ★★台帳との やりとりを、★ぜんぶ 控えます。
  //   ★★はじめは 表を 5つに しぼって いました。★それが 誤りでした ──
  //     ★profiles も notes も 通って いたのに、★控えに 残らず、
  //     ★「読んで いない」と 読み違えました。
  //   ★★しぼらずに 取り、★あとで 選びます。
  p.on("response", async (res) => {
    const u = res.url();
    if (!/\/rest\/v1\/|\/auth\/v1\//.test(u)) return;
    const r = res.request();
    let body = null;
    try { body = r.postData(); } catch (e) {}
    let out = null;
    // ★★しくじった ときだけ、★返って きた 中身も 控えます。
    if (res.status() >= 400) {
      try { out = (await res.text()).slice(0, 600); } catch (e) {}
    }
    calls.push({ method: r.method(), status: res.status(),
      url: u.replace(/^https:\/\/[^/]+/, "").slice(0, 300),
      body: body ? body.slice(0, 2500) : null, res: out });
  });

  // ★① 入る
  await p.goto(base + "/login");
  await p.waitForTimeout(800);
  await p.getByRole("textbox").first().fill(email);
  const pw = await p.locator('input[type="password"]').first();
  await pw.fill(pass);
  await shot(p, "01-login");
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(9000);
  // ★★はじめての 人には、★同意の 画面が 出ます。
  //   ★★はじめ これに 気づかず、★「読み込み中で 止まって いる」と
  //     ★読み違えました。★絵だけ 見て いたからです。
  const consent = p.getByText("同意して続ける", { exact: true }).first();
  if (await consent.count()) { await consent.click(); await p.waitForTimeout(4000); }
  await shot(p, "02-after-login");
  const url1 = p.url();

  // ★② ノート → レパートリー
  const go = async (name) => {
    const t = p.getByRole("button", { name: name, exact: true }).first();
    if (await t.count()) { await t.click(); await p.waitForTimeout(1200); return true; }
    const t2 = p.getByText(name, { exact: true }).first();
    if (await t2.count()) { await t2.click(); await p.waitForTimeout(1200); return true; }
    return false;
  };
  await p.waitForTimeout(3000);
  const okNote = await go("ノート");
  await shot(p, "03-notes");
  const okRep = await go("レパートリー");
  await p.waitForTimeout(1200);
  await shot(p, "04-repertoire");

  const countSong = async () => {
    return await p.getByText(song, { exact: false }).count();
  };
  const before = await countSong();

  // ★③ 曲を 開いて 消す
  // ★★画面の 言づて ── ★「曲を 開くと、右上の … から 直す・消す ことが できます」
  //   ★★はじめ「直す」を 直に 探して いました。★そこには ありません。
  let deleted = false;
  const steps = [];
  const row = p.getByRole("button", { name: new RegExp("^" + song) }).first();
  if (await row.count()) {
    await row.click();
    await p.waitForTimeout(1500);
    await shot(p, "05-song-open");
    steps.push("曲を 開いた");
    // ★★右上の 丸い「…」。★字では 引けません（★HeadRound の mark）。
    //   ★★読み上げ用の 名前で 引きます ──「<曲名>を 直す・消す」。
    const dots = p.getByRole("button", { name: song + "を 直す・消す" }).first();
    if (await dots.count()) {
      await dots.click(); await p.waitForTimeout(1200); steps.push("… を 押した");
    }
    await shot(p, "06-menu");
    // ★★「消す」は 2回 出ます。★1回目は 品書き、★2回目は 念押しの 札。
    const m = p.getByText("消す", { exact: true }).first();
    if (await m.count()) {
      await m.click(); await p.waitForTimeout(1200); steps.push("品書きの 消す");
    }
    await shot(p, "07-confirm");
    const yes = p.getByRole("button", { name: "消す", exact: true }).last();
    if (await yes.count()) {
      await yes.click(); steps.push("念押しの 消す"); deleted = true;
    }
    await p.waitForTimeout(6000);
  }
  console.log("STEPS:" + JSON.stringify(steps));
  await shot(p, "08-after-delete");
  const afterDelete = await countSong();

  // ★④ 読み直す
  await p.reload();
  await p.waitForTimeout(4500);
  await shot(p, "09-after-reload-home");
  const c2 = p.getByText("同意して続ける", { exact: true }).first();
  if (await c2.count()) { await c2.click(); await p.waitForTimeout(3000); }
  await go("ノート");
  await go("レパートリー");
  await p.waitForTimeout(2000);
  await shot(p, "10-after-reload-repertoire");
  const afterReload = await countSong();

  await b.close();
  console.log("RESULT:" + JSON.stringify({
    url1, okNote, okRep, deleted, before, afterDelete, afterReload,
    log, calls
  }));
})();
"""
js = os.path.join(OUT, "_repro.js")
io.open(js, "w", encoding="utf-8").write(JS)
r = subprocess.run(["node", js, BASE, EMAIL, PASS, SONG, OUT],
                   capture_output=True, text=True, cwd=ROOT)
os.remove(js)
line = [x for x in r.stdout.split("\n") if x.startswith("RESULT:")]
if not line:
  print("ERR: " + (r.stderr or r.stdout).strip()[:900])
  sys.exit(1)
d = json.loads(line[0][7:])

print("".join([x for x in r.stdout.split(chr(10)) if x.startswith("STEPS:")]) or "STEPS:なし")
print("★入った あとの 行き先: " + d["url1"])
print("★ノートへ " + str(d["okNote"]) + " ／ レパートリーへ " + str(d["okRep"]))
print("★消す 前 " + str(d["before"]) + " ／ 消した 後 " + str(d["afterDelete"])
      + " ／ 読み直した 後 " + str(d["afterReload"]))
print("★消せたか: " + str(d["deleted"]))
print()
print("★㋒ 列が 落ちた 言づて")
drop = [x for x in d["log"] if "まだ 無い 列" in x["text"] or "まだ無い列" in x["text"]]
print("  " + ("出て いません" if not drop else str(len(drop)) + "件"))
for x in drop:
  print("    " + x["text"][:200])
print()
print("★言づて（★ぜんぶ・先頭 40件）")
for x in d["log"][:40]:
  print("  [" + x["type"] + "] " + x["text"][:170])
print()
print("★台帳への 書き込み: " + str(len(d["calls"])) + "件")
bad = [c for c in d["calls"] if c["status"] >= 400]
print("★しくじった やりとり: " + str(len(bad)) + "件")
for c in bad:
  print("  " + str(c["status"]) + " " + c["method"] + " " + c["url"][:110])
  if c["res"]:
    print("      " + c["res"][:260])
print("\n★書き込み（GET 以外）")
for c in d["calls"]:
  if c["method"] == "GET":
    continue
  print("  " + str(c["status"]) + " " + c["method"] + " " + c["url"][:80])
  if c["body"]:
    print("      " + c["body"][:600])

io.open(os.path.join(OUT, "calls.json"), "w", encoding="utf-8").write(
  json.dumps(d, ensure_ascii=False, indent=1))
print("\n→ " + OUT)
