#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""羊の おうち ── ①③④ を、★測り直す（2026-09-14・2回目）。

  ★出どころ 坂本さん ──「★直したはず で 終わらせず、★前と 同じく 実測を 先に」

  ★★①  2つの ボタンの 位置（★本物の 画面で 測ります）
  ★★③  天井の 高さが、★きょうの 一連の 変更で どう 変わったか
        （★git の 各コミットの 数から 計算します）
  ★★④  掴める ところの 実寸（★品ごと・px）

  ★★いちばん 先に 見る こと ── ★届いて いるか。
    ★★2026-09-11 の 教訓です。★出て いない ものを 直し続けない ため。
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "sheep-room")
REPORT = os.path.join(ROOT, "docs", "reports", "2026-09-14-羊のおうち-測り直し.md")

# ★測る 端末（★iPhone 14 相当）
VW, VH = 390, 844
# ★実測した 値（★前回の measured.json より）
BOX_TOP = 139
BOX_H = 634
BOX_W = 390


def sh(cmd):
  p = subprocess.run(cmd, shell=True, cwd=ROOT,
                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  return p.stdout.decode("utf-8", "replace")


# ---------------------------------------------------------------------------
# ★まず ── 届いて いるか
# ---------------------------------------------------------------------------

def delivery():
  head = sh("git rev-parse --short HEAD").strip()
  unpushed = [l for l in sh("git log --oneline origin/main..HEAD").split("\n") if l.strip()]
  live = ""
  try:
    import urllib.request
    with urllib.request.urlopen("https://woolsong.app/api/version", timeout=10) as r:
      live = json.loads(r.read().decode())["commit"][:7]
  except Exception as e:
    live = "（取れません: %s）" % str(e)[:40]
  return {"head": head, "live": live, "unpushed": unpushed}


# ---------------------------------------------------------------------------
# ★③ 天井 ── きょうの コミットごとに 計算する
# ---------------------------------------------------------------------------

COMMITS = [
  ("8b34cc2", "家具の 位置の ずれを 直す（部屋の 比の 決め打ち）"),
  ("c12441a", "床を 48％に 広げ、割合を 1か所に"),
  ("c09660d", "カメラが 下を 向きすぎない ように"),
  ("3968a59", "ながめるは 羊を 優先（keepTopPct 5→20）"),
  ("f63a608", "札と 字を 大きく（★lib/roomStage.js が 生まれた）"),
  ("1961a29", "比の 決まった 舞台に 載せる"),
  ("9ff134a", "★画面ぜんぶの まま、舞台で そろえる（★stageFit）"),
  ("609dc6b", "★実機の ご指摘 4件（★上に 6割）"),
]


def floor_pct_at(c):
  t = sh("git show %s:lib/sheepInteriorV2.js" % c)
  m = re.search(r"FLOOR_BOTTOM_PCT = (\d+)", t)
  if m:
    return int(m.group(1))
  # ★生まれる 前は、★画面の 中に 直書きで した。
  t = sh("git show %s:components/CharacterHome.jsx" % c)
  m = re.search(r"bottom: 0, height: `\$\{(\d+)\}%`", t)
  return int(m.group(1)) if m else None


def stage_at(c):
  """★その コミットの「家具が 乗る 場所」の 大きさ（★px）。"""
  ui = sh("git show %s:components/CharacterHome.jsx" % c)
  rs = sh("git show %s:lib/roomStage.js" % c)
  uses_fit = "stageFit(roomBoxW" in ui
  uses_size = "stageSize(roomBoxW" in ui
  if not (uses_fit or uses_size):
    # ★舞台が まだ ありません。★箱 そのものが 座標の 場所です。
    return {"mode": "箱そのもの", "w": BOX_W, "h": BOX_H}
  m = re.search(r"STAGE_ASPECT = ([\d]+) / ([\d]+)", rs)
  a = (int(m.group(1)) / int(m.group(2))) if m else 1.4
  if uses_fit:
    # ★収める … 箱が 縦長なら 幅を 合わせる
    if BOX_W / BOX_H >= a:
      return {"mode": "収める(fit)", "w": BOX_H * a, "h": BOX_H}
    return {"mode": "収める(fit)", "w": BOX_W, "h": BOX_W / a}
  # ★覆う … 箱が 縦長なら 高さを 合わせる（★横が 切れる）
  if BOX_W / BOX_H >= a:
    return {"mode": "覆う(cover)", "w": BOX_W, "h": BOX_W / a}
  return {"mode": "覆う(cover)", "w": BOX_H * a, "h": BOX_H}


def ceiling_history():
  rows = []
  for c, why in COMMITS:
    fp = floor_pct_at(c)
    st = stage_at(c)
    if fp is None or not st:
      rows.append({"commit": c, "why": why, "wall": None})
      continue
    wall_pct = 100 - fp
    wall_px = st["h"] * wall_pct / 100.0
    floor_px = st["h"] * fp / 100.0
    rows.append({"commit": c, "why": why, "mode": st["mode"],
                 "stageW": round(st["w"], 1), "stageH": round(st["h"], 1),
                 "floorPct": fp, "wallPx": round(wall_px, 1),
                 "floorPx": round(floor_px, 1)})
  return rows


# ---------------------------------------------------------------------------
# ★④ 掴める ところの 実寸
# ---------------------------------------------------------------------------

TOUCH_MIN = 44   # ★Apple の 目安（44×44）

def hit_boxes():
  ui = open(os.path.join(ROOT, "components", "CharacterHome.jsx"), encoding="utf-8").read()
  scales = dict(re.findall(r"(back|mid|front): \{ z: \d+, scale: ([\d.]+) \}", ui))
  pad = 0
  m = re.search(r"GRAB_PAD_PX = (\d+)",
                open(os.path.join(ROOT, "lib", "sheepInteriorV2.js"), encoding="utf-8").read())
  if m:
    pad = int(m.group(1))
  st = stage_at("609dc6b")
  rows = []
  for name in ("FURNITURE_LAYOUT", "WALLHANG_LAYOUT", "GARDEN_LAYOUT"):
    blk = re.search(name + r"\s*=\s*\{(.*?)\n\};", ui, re.S)
    if not blk:
      continue
    for k, body in re.findall(r"\n  ([a-z_0-9]+): \{([^}]*)\}", blk.group(1)):
      wm = re.search(r"width: (\d+)", body)
      am = re.search(r"aspect: ([\d]+) / ([\d]+)", body)
      lm = re.search(r'layer: "(\w+)"', body)
      if not (wm and am and lm):
        continue
      sc = float(scales.get(lm.group(1), 1))
      w = int(wm.group(1)) * sc / 100.0 * st["w"]
      h = w / (int(am.group(1)) / int(am.group(2)))
      rows.append({"key": k, "layer": lm.group(1),
                   "w": round(w, 1), "h": round(h, 1),
                   "padW": round(w + pad * 2, 1), "padH": round(h + pad * 2, 1),
                   "tooSmall": (w + pad * 2) < TOUCH_MIN or (h + pad * 2) < TOUCH_MIN})
  return rows, pad


# ---------------------------------------------------------------------------
# ★① ボタン ── ★本物の 画面で 測る
# ---------------------------------------------------------------------------

JS = r"""
const { chromium } = require("playwright");
const [, , base, email, pass, out] = process.argv;
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto(base + "/login");
  await p.waitForTimeout(2500);
  for (let i = 0; i < 8; i++) {
    await p.getByRole("textbox").first().fill(email);
    await p.locator('input[type="password"]').first().fill(pass);
    await p.waitForTimeout(700);
    if ((await p.getByRole("textbox").first().inputValue()) === email) break;
  }
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(9000);
  const c = p.getByText("同意して続ける", { exact: true }).first();
  if (await c.count()) { await c.click(); await p.waitForTimeout(4000); }
  for (let i = 0; i < 60; i++) {
    if (!(await p.getByText("読み込み中").count())) break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "ひつじ", exact: true }).first().click();
  await p.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) {
    if (await p.locator("#room-anchor").count()) break;
    await p.getByRole("button", { name: "ひつじ", exact: true }).first().click();
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(2500);

  // ★★「配置を変える」は、★家具が 無いと 出ません。
  //   ★★試しの 口座には 1つも ありません。
  //   ★★だから、★同じ 札（class）の 板を 入れて、★位置だけを 測ります。
  //     ★★数を こしらえて いません。★CSS に place させて、★出た 数を 読みます。
  const geo = await p.evaluate(() => {
    const anchor = document.getElementById("room-anchor");
    if (!anchor) return { error: "部屋が ありません" };
    const mk = (cls) => {
      const el = document.createElement("button");
      el.className = cls + " text-xs px-3 py-1.5 rounded-full font-medium";
      el.textContent = "配置を変える";
      el.setAttribute("data-probe", "1");
      anchor.appendChild(el);
      const r = el.getBoundingClientRect();
      const o = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
        h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
      el.remove();
      return o;
    };
    const old = mk("absolute bottom-2 right-2");
    const now = mk("absolute bottom-2 left-2");
    const sBtn = [...document.querySelectorAll("button")]
      .filter((b) => (b.textContent || "").trim() === "したく")
      .filter((b) => getComputedStyle(b).position === "fixed")[0];
    const s = sBtn ? (() => { const r = sBtn.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
        h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; })() : null;
    const ov = (a) => {
      if (!s || !a) return null;
      const ox = Math.min(s.right, a.right) - Math.max(s.x, a.x);
      const oy = Math.min(s.bottom, a.bottom) - Math.max(s.y, a.y);
      return { x: ox, y: oy, overlaps: ox > 0 && oy > 0 };
    };
    const ra = anchor.getBoundingClientRect();
    return { shitaku: s, old, now, overlapOld: ov(old), overlapNow: ov(now),
      box: { top: Math.round(ra.top), bottom: Math.round(ra.bottom),
             h: Math.round(ra.height), w: Math.round(ra.width) } };
  });
  console.log(JSON.stringify(geo));
  await b.close();
})().catch((e) => { console.error("落: " + e.message.slice(0, 200)); process.exit(1); });
"""


def buttons(base):
  env = {}
  with open(os.path.join(ROOT, ".env.e2e"), encoding="utf-8") as f:
    for line in f:
      if "=" in line and not line.strip().startswith("#"):
        k, v = line.strip().split("=", 1)
        env[k] = v
  js = os.path.join(ROOT, "node_modules", ".cache", "sr3.js")
  os.makedirs(os.path.dirname(js), exist_ok=True)
  open(js, "w", encoding="utf-8").write(JS)
  p = subprocess.run(["node", js, base, env["E2E_EMAIL"], env["E2E_PASSWORD"], OUT],
                     cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  out = p.stdout.decode("utf-8", "replace").strip()
  if not out:
    return {"error": p.stderr.decode("utf-8", "replace").strip()[:300]}
  return json.loads(out.split("\n")[-1])


if __name__ == "__main__":
  base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3111"
  d = delivery()
  print("=== 届いて いるか")
  print("  手元 HEAD :", d["head"])
  print("  本番      :", d["live"])
  print("  未push    :", len(d["unpushed"]), "本")
  print()
  print("=== ③ 天井（★家具が 乗る 場所の 高さ）")
  for r in ceiling_history():
    if r.get("wallPx") is None:
      print("  %s  （読めません）" % r["commit"]); continue
    print("  %s  %-14s 舞台 %6.1f×%6.1f  壁 %6.1f  床 %6.1f   %s"
          % (r["commit"], r["mode"], r["stageW"], r["stageH"],
             r["wallPx"], r["floorPx"], r["why"][:26]))
  print()
  print("=== ④ 掴める ところ（★px・★%d 未満は 小さすぎ）" % TOUCH_MIN)
  rows, pad = hit_boxes()
  for r in sorted(rows, key=lambda x: x["w"] * x["h"]):
    print("  %-22s %5.1f×%5.1f  → 板つき %5.1f×%5.1f  %s"
          % (r["key"], r["w"], r["h"], r["padW"], r["padH"],
             "★小さすぎ" if r["tooSmall"] else ""))
  print()
  print("=== ① ボタン")
  b = buttons(base)
  print(" ", json.dumps(b, ensure_ascii=False))
  json.dump({"delivery": d, "ceiling": ceiling_history(),
             "hits": rows, "pad": pad, "buttons": b},
            open(os.path.join(OUT, "measured3.json"), "w", encoding="utf-8"),
            ensure_ascii=False, indent=1)
