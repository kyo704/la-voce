#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★きょうの 直しを、★実際に 動かして 確かめる（★2026-09-14）。

  ★★見る こと
    ★① 下の 帯 5つ とも、★押したら いちばん 上に 戻るか
    ★② レパートリーの 札の 大きさ
    ★③ かぞえるの「あなたの 普段」の 大きさ
    ★④ ひつじの 部屋 ── ★ながめる と したく で、★家具の 位置が 合うか

  ★★④が この 便の 要です。
    ★★舞台（★比の 決まった 1枚）に した ので、
      ★同じ ％が 同じ 場所に なる はず です。
    ★★だから「舞台に 対する ％」を 両方で 読み、★くらべます。
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "kensho")
os.makedirs(OUT, exist_ok=True)

JS = r"""
const { chromium } = require("playwright");
const [, , base, email, pass, out] = process.argv;
const errs = [];
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 430, height: 900 },
    deviceScaleFactor: 2 });
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  p.on("pageerror", (e) => errs.push("pageerror: " + String(e)));
  await p.goto(base + "/login");
  await p.waitForTimeout(900);
  await p.getByRole("textbox").first().fill(email);
  await p.locator('input[type="password"]').first().fill(pass);
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(10000);
  const c = p.getByText("同意して続ける", { exact: true }).first();
  if (await c.count()) { await c.click(); await p.waitForTimeout(4000); }

  const tab = async (name) => {
    await p.getByRole("button", { name: name, exact: true }).first().click();
    await p.waitForTimeout(2200);
  };
  const txt = () => p.evaluate(() =>
    document.body.innerText.replace(/\n+/g, "/").slice(0, 150));
  const click = async (label) => {
    const el = p.getByText(label, { exact: true }).first();
    if (await el.count()) { await el.click(); await p.waitForTimeout(1800); return true; }
    return false;
  };

  // ★① 5つの 帯
  const tabs = [];
  // ★きょう … 時間割を 開く
  await tab("きょう");
  await click("時間割を 入れる");
  let a = await txt(); await tab("きょう"); let z = await txt();
  tabs.push({ tab: "きょう", sub: "時間割を 入れる", ok: a !== z });

  // ★記録 … 下から 出る 1枚を 開く
  await tab("記録");
  // ★★「足す」の 行を 押すと、★下から 1枚が 上がります。
  //   ★★はじめ「ねむり」「こえ」で 探して いました。★その 名の 行は ありません。
  //   ★★この 1枚も、★下の 帯を 覆います。★帯を 押す ことが できません。
  const addRow = p.getByRole("button", { name: /^＋食べたもの/ }).first();
  let opened = false;
  let coveredRec = null;
  if (await addRow.count()) {
    await addRow.click(); await p.waitForTimeout(1800); opened = true;
    coveredRec = await p.evaluate(() => {
      const t = Array.from(document.querySelectorAll("button"))
        .find(e => e.textContent.trim() === "記録");
      if (!t) return null;
      const r = t.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(top === t || t.contains(top));
    });
    // ★★閉じてから 先へ 進みます。
    for (const w of ["とじる", "やめる", "これでいい"]) {
      const e = p.getByRole("button", { name: w, exact: true }).first();
      if (await e.count()) {
        try { await e.click({ timeout: 4000 }); } catch (err) { /* ★進みます */ }
        await p.waitForTimeout(1200);
        break;
      }
    }
  }
  tabs.push({ tab: "記録", sub: opened ? "記録の 1枚（下から）" : "（開けず）",
    ok: null, covered: coveredRec });

  // ★ふりかえる … かぞえるの 札へ
  await tab("ふりかえる");
  const kz = await click("かぞえる");
  a = await txt(); await tab("ふりかえる"); z = await txt();
  tabs.push({ tab: "ふりかえる", sub: kz ? "かぞえる" : "（開けず）",
    ok: kz ? a !== z : null });

  // ★ノート … レパートリーの 札へ
  await tab("ノート");
  const rp = await click("レパートリー");
  a = await txt(); await tab("ノート"); z = await txt();
  tabs.push({ tab: "ノート", sub: rp ? "レパートリー" : "（開けず）",
    ok: rp ? a !== z : null });

  // ★ひつじ … したくへ
  //   ★★したくは 引き出しが 画面を 覆います。★下の 帯は 押せません。
  //     ★★だから「帯を 押して 戻る」は 当てはまりません。★出口は「おわり」です。
  //   ★★覆って いるかを、★その場で 測って 残します。
  await tab("ひつじ");
  await p.waitForTimeout(1800);
  const st = await click("したく");
  const covered = await p.evaluate(() => {
    const t = Array.from(document.querySelectorAll("button"))
      .find(e => e.textContent.trim() === "ひつじ");
    if (!t) return null;
    const r = t.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(top === t || t.contains(top));
  });
  tabs.push({ tab: "ひつじ", sub: st ? "したく（引き出し）" : "（開けず）",
    ok: null, covered: covered });
  // ★★引き出しを 閉じます。★はじめて 開いた ときは、★説明の 1枚が 先に 出ます。
  for (const w of ["とじる", "おわり"]) {
    const e = p.getByRole("button", { name: w, exact: true }).first();
    if (await e.count()) {
      try { await e.click({ timeout: 4000 }); } catch (err) { /* ★覆われて いても 進みます */ }
      await p.waitForTimeout(1500);
    }
  }

  // ★② レパートリーの 札
  await tab("ノート"); await click("レパートリー");
  const rep = await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('[role="button"]'))
      .find(e => /カロ|オンブラ|初恋/.test(e.innerText));
    if (!btn) return null;
    const s = getComputedStyle(btn);
    const bold = btn.querySelector("b");
    return { pad: s.padding, h: Math.round(btn.getBoundingClientRect().height),
      title: bold ? getComputedStyle(bold).fontSize : null };
  });
  await p.screenshot({ path: out + "/01-レパートリー.png", fullPage: true });

  // ★③ かぞえる
  await tab("ふりかえる"); await click("かぞえる");
  const kaz = await p.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".li"))
      .filter(e => /声を使った|書いた日|寝た|食べ終えて/.test(e.innerText));
    const head = Array.from(document.querySelectorAll("*"))
      .find(e => !e.children.length && e.textContent.trim() === "あなたの 普段");
    const note = document.body.innerText.includes("まんなかの値です");
    return { n: rows.length, fs: rows[0] ? getComputedStyle(rows[0]).fontSize : null,
      h: rows[0] ? Math.round(rows[0].getBoundingClientRect().height) : null,
      head: !!head, note };
  });
  await p.screenshot({ path: out + "/02-かぞえる.png", fullPage: true });

  // ★④ ひつじの 部屋
  const roomOf = async (label) => {
    return await p.evaluate(() => {
      const box = document.getElementById("room-anchor");
      if (!box) return null;
      // ★舞台 … 箱の すぐ 下の、★まんなか寄せの 器
      const stage = box.firstElementChild;
      const sr = stage ? stage.getBoundingClientRect() : null;
      const br = box.getBoundingClientRect();
      // ★家具（★％で 置かれた もの）の、★舞台に 対する 割合
      const items = Array.from(box.querySelectorAll("img"))
        .filter(e => e.src && !/sheep|hitsuji/i.test(e.src))
        .slice(0, 6).map(e => {
          const r = e.getBoundingClientRect();
          return sr && sr.width > 0 ? {
            src: (e.src.split("/").pop() || "").slice(0, 22),
            left: +(((r.left - sr.left) / sr.width) * 100).toFixed(2),
            top: +(((r.top - sr.top) / sr.height) * 100).toFixed(2),
            w: +((r.width / sr.width) * 100).toFixed(2)
          } : null;
        }).filter(Boolean);
      return {
        box: { w: Math.round(br.width), h: Math.round(br.height),
          a: +(br.width / br.height).toFixed(3) },
        stage: sr ? { w: Math.round(sr.width), h: Math.round(sr.height),
          a: +(sr.width / sr.height).toFixed(3) } : null,
        items
      };
    });
  };
  await tab("ひつじ"); await p.waitForTimeout(2500);
  const nagame = await roomOf("ながめる");
  await p.screenshot({ path: out + "/03-ながめる.png", fullPage: true });
  await click("したく"); await p.waitForTimeout(2500);
  const shitaku = await roomOf("したく");
  await p.screenshot({ path: out + "/04-したく.png", fullPage: true });

  await b.close();
  console.log("R:" + JSON.stringify({ tabs, rep, kaz, nagame, shitaku, errs }));
})();
"""
js = os.path.join(OUT, "_v.js")
io.open(js, "w", encoding="utf-8").write(JS)
r = subprocess.run(["node", js, "http://localhost:3000",
                    "kyo0703opera+localtest@gmail.com", "LocalTest-2026-0914!", OUT],
                   capture_output=True, text=True, cwd=ROOT)
os.remove(js)
line = [x for x in r.stdout.split("\n") if x.startswith("R:")]
if not line:
  print("ERR: " + (r.stderr or r.stdout).strip()[:700])
  sys.exit(1)
d = json.loads(line[0][2:])

print("① 下の 帯 5つ")
for t in d["tabs"]:
  mark = "✓" if t["ok"] is True else ("—" if t["ok"] is None else "✗")
  extra = ""
  if t.get("covered") is True:
    extra = "　★引き出しが 帯を 覆います（★出口は「おわり」）"
  print("  " + mark + " " + t["tab"] + "　（下位: " + t["sub"] + "）" + extra)

print("\n② レパートリーの 札")
print("  " + json.dumps(d["rep"], ensure_ascii=False))

print("\n③ かぞえるの「あなたの 普段」")
print("  " + json.dumps(d["kaz"], ensure_ascii=False))

print("\n④ ひつじの 部屋 ── 舞台の 比が そろって いるか")
for name, v in (("ながめる", d["nagame"]), ("したく", d["shitaku"])):
  if not v:
    print("  " + name + " … 部屋が 見つかりません")
    continue
  print("  " + name + "　箱 " + str(v["box"]["w"]) + "×" + str(v["box"]["h"])
        + "（比 " + str(v["box"]["a"]) + "）　舞台 "
        + (str(v["stage"]["w"]) + "×" + str(v["stage"]["h"])
           + "（比 " + str(v["stage"]["a"]) + "）" if v["stage"] else "—"))

if d["nagame"] and d["shitaku"] and d["nagame"]["stage"] and d["shitaku"]["stage"]:
  a1 = d["nagame"]["stage"]["a"]
  a2 = d["shitaku"]["stage"]["a"]
  print("\n  ★舞台の 比　ながめる " + str(a1) + " ／ したく " + str(a2)
        + "　→ " + ("★同じ" if abs(a1 - a2) < 0.01 else "★ちがう"))
  # ★★家具の ％を くらべます。
  m1 = {i["src"]: i for i in d["nagame"]["items"]}
  m2 = {i["src"]: i for i in d["shitaku"]["items"]}
  both = [k for k in m1 if k in m2]
  print("\n  ★同じ 家具 " + str(len(both)) + "点の、★舞台に 対する 位置")
  for k in both:
    a, b2 = m1[k], m2[k]
    dl = abs(a["left"] - b2["left"])
    dt = abs(a["top"] - b2["top"])
    print("    " + ("✓" if dl < 1 and dt < 1 else "✗") + " " + k
          + "　左 " + str(a["left"]) + " / " + str(b2["left"])
          + "　上 " + str(a["top"]) + " / " + str(b2["top"]))
  if not both:
    print("    ★くらべられる 家具が ありません（★置いて いません）")

print("\n★誤りの 言づて: " + str(len(d["errs"])))
for e in d["errs"][:4]:
  print("  " + e[:150])
print("\n→ " + OUT)
