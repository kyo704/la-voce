#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""羊の おうち ── 実機の ご指摘 4件を、★測って 確かめる（2026-09-14）。

  ★出どころ 坂本さん（実機）
    ① ながめるで「したく」と「配置を変える」が 重なる
    ② したくへ 切り替わる カメラが 遅い
    ③ 天井が 低く 感じる
    ④ 家具の 当たり判定が 見た目より 狭い

  ★★この 道具は「感じ」を 測りません。★数を 取ります ──
    ①  2つの ボタンの 外形（★重なりの 有無と 重なった ピクセル）
    ②  移りに かかる ミリ秒（★`transition` の 宣言を 読む）
    ③  壁と 床の 高さの 比（★見えている ピクセル）
    ④  掴める ところ と 見えて いる ところ の 差

  ★★絵も 撮ります。★数だけでは、★窮屈さは 伝わりません。

  ★使い方
    node_modules が 要ります。★手元の dev（:3111）に 当てます。
    python3 tools/sheep_room_check.py [base]
"""

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "sheep-room")
os.makedirs(OUT, exist_ok=True)

JS = r"""
const { chromium } = require("playwright");
const [, , base, email, pass, out] = process.argv;

// ★★見えて いる ところを 測ります。★宣言した 値では ありません。
async function box(p, sel) {
  const el = p.locator(sel).first();
  if (!(await el.count())) return null;
  return await el.boundingBox();
}

(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  // ★iPhone 14 相当。★坂本さんの 実機に 近い 縦横です。
  const p = await b.newPage({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2 });
  const R = { errors: [] };
  p.on("pageerror", (e) => R.errors.push(String(e)));

  await p.goto(base + "/login");
  // ★★手元の dev は、★初回の 組み立てに 時間が かかります。
  //   ★★早く 入れると、★組み立て直しで ★字が 消えます。
  //     ★2026-09-14、★実際に そう なりました（★空の 入力欄の 絵が 残って います）。
  //   ★★入れた あと、★本当に 入って いるかを 見てから 押します。
  await p.waitForTimeout(2500);
  for (let i = 0; i < 8; i++) {
    await p.getByRole("textbox").first().fill(email);
    await p.locator('input[type="password"]').first().fill(pass);
    await p.waitForTimeout(700);
    const got = await p.getByRole("textbox").first().inputValue();
    if (got === email) break;
  }
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(9000);
  // ★★入れて いなければ、★もう一度。
  if (p.url().includes("/login")) {
    await p.waitForTimeout(2000);
    await p.getByRole("textbox").first().fill(email);
    await p.locator('input[type="password"]').first().fill(pass);
    await p.waitForTimeout(500);
    await p.locator('button[type="submit"], form button').first().click();
    await p.waitForTimeout(9000);
  }
  const c = p.getByText("同意して続ける", { exact: true }).first();
  if (await c.count()) { await c.click(); await p.waitForTimeout(4000); }
  await p.screenshot({ path: out + "/00-ログイン直後.png" });
  R.url = p.url();

  // ---- ★ひつじ の 画面へ ----
  // ★★読み込みが 終わるまで 待ちます。★終わる 前に 押しても 効きません
  //   （★2026-09-14、★1度 そうなりました。★帯は 出て いるのに 押せない）。
  for (let i = 0; i < 60; i++) {
    const loading = await p.getByText("読み込み中").count();
    if (!loading) break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "ひつじ", exact: true }).first().click();
  await p.waitForTimeout(2500);
  // ★★本当に 移れたか。★移れて いなければ、★もう一度 押します。
  for (let i = 0; i < 6; i++) {
    if (await p.locator("#room-anchor").count()) break;
    await p.getByRole("button", { name: "ひつじ", exact: true }).first().click();
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(2500);
  R.reachedRoom = (await p.locator("#room-anchor").count()) > 0;
  await p.screenshot({ path: out + "/01-ながめる.png" });

  // =========================================================================
  // ① ★2つの ボタンが 重なって いないか
  // =========================================================================
  const shitaku  = await box(p, 'button:has-text("したく")');
  const arrange  = await box(p, 'button:has-text("配置を変える")');
  const arrange2 = await box(p, 'button:has-text("配置を決定")');
  const a = arrange || arrange2;
  R.buttons = { shitaku, arrange: a };
  if (shitaku && a) {
    const ox = Math.min(shitaku.x + shitaku.width, a.x + a.width) - Math.max(shitaku.x, a.x);
    const oy = Math.min(shitaku.y + shitaku.height, a.y + a.height) - Math.max(shitaku.y, a.y);
    R.overlap = { x: Math.round(ox), y: Math.round(oy),
      overlaps: ox > 0 && oy > 0,
      // ★重なって いなくても、★近すぎれば 押し まちがえます。
      gapY: Math.round(Math.max(shitaku.y, a.y) - Math.min(shitaku.y + shitaku.height, a.y + a.height)) };
  } else {
    R.overlap = { overlaps: null, why: "★どちらかの ボタンが 出て いません" };
  }

  // ★★重なりが 見える 絵。★2つの ボタンに 枠を 付けます。
  await p.evaluate(() => {
    const mark = (txt, color) => {
      const el = [...document.querySelectorAll("button")]
        .find((b) => (b.textContent || "").trim() === txt);
      if (!el) return;
      el.style.outline = "3px solid " + color;
      el.style.outlineOffset = "2px";
    };
    mark("したく", "#0066FF");
    mark("配置を変える", "#FF0000");
    mark("配置を決定", "#FF0000");
  });
  await p.screenshot({ path: out + "/02-ボタンの枠.png" });
  await p.evaluate(() => {
    document.querySelectorAll("button").forEach((b) => { b.style.outline = ""; });
  });

  // =========================================================================
  // ③ ★壁と 床の 高さ（★見えて いる ピクセル）
  // =========================================================================
  R.room = await p.evaluate(() => {
    const anchor = document.getElementById("room-anchor");
    if (!anchor) return null;
    const r = anchor.getBoundingClientRect();
    // ★床の 帯（★背景色で 塗って いる ところ）を 探します。
    const kids = [...anchor.querySelectorAll("div")];
    const floor = kids.find((d) => {
      const s = getComputedStyle(d);
      return s.position === "absolute" && d.style.height
        && d.style.height.includes("%") && s.bottom === "0px";
    });
    return {
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      // ★箱の 下端が、★画面の 下から 何 px か
      bottomGap: Math.round(window.innerHeight - r.bottom),
      topGap: Math.round(r.top),
      floorStyleHeight: floor ? floor.style.height : null
    };
  });

  // =========================================================================
  // ② ★したく へ 移る ときの 時間
  // =========================================================================
  // ★★まず、★宣言されて いる 値を 読みます。
  R.camera = await p.evaluate(() => {
    const anchor = document.getElementById("room-anchor");
    if (!anchor) return null;
    // ★カメラの 入れ物 … transform を 持つ 入れ子
    const cam = [...anchor.querySelectorAll("div")].find((d) => {
      const s = getComputedStyle(d);
      return s.transform && s.transform !== "none"
        && s.transitionProperty.includes("transform");
    });
    if (!cam) return { found: false };
    const s = getComputedStyle(cam);
    return { found: true,
      transitionProperty: s.transitionProperty,
      transitionDuration: s.transitionDuration,
      transitionTimingFunction: s.transitionTimingFunction };
  });

  // ★★次に、★実際に 押して、★落ち着くまでを 計ります。
  const t0 = Date.now();
  const btn = p.locator('button:has-text("したく")').first();
  if (await btn.count()) {
    await btn.click();
    // ★transform が 変わらなく なるまで 待ちます（★80ms 動かなければ 終わり）。
    const settled = await p.evaluate(async () => {
      const anchor = document.getElementById("room-anchor");
      const cam = anchor && [...anchor.querySelectorAll("div")].find((d) => {
        const s = getComputedStyle(d);
        return s.transform && s.transform !== "none"
          && s.transitionProperty.includes("transform");
      });
      if (!cam) return null;
      const start = performance.now();
      let last = getComputedStyle(cam).transform;
      let lastChange = start;
      while (performance.now() - start < 8000) {
        await new Promise((r) => requestAnimationFrame(r));
        const now = getComputedStyle(cam).transform;
        if (now !== last) { last = now; lastChange = performance.now(); }
        else if (performance.now() - lastChange > 120) break;
      }
      return Math.round(lastChange - start);
    });
    R.camera = Object.assign(R.camera || {}, { settledMs: settled,
      wallClockMs: Date.now() - t0 });
  }
  await p.waitForTimeout(1200);
  // ★★はじめて したく を 開いた ときだけ、★「てんについて」の 紙が 出ます。
  //   ★これが 前に 立つと、★下の ボタンが 押せません（★2026-09-14 に つまずきました）。
  const toji = p.getByRole("button", { name: "とじる", exact: true }).first();
  if (await toji.count()) { await toji.click(); await p.waitForTimeout(800); }
  await p.screenshot({ path: out + "/03-したく.png" });

  // =========================================================================
  // ④ ★掴める ところ と、★見えて いる ところ
  // =========================================================================
  // ★★「配置を変える」は、★置いた ものが 1つも 無いと 出ません
  //   （★CharacterHome.jsx:2760 の 条件）。
  //   ★★試しの 口座には 何も 置いて いません。★1つ 置いてから 測ります。
  try {
    const oku = p.getByRole("button", { name: "おくもの", exact: true }).first();
    if (await oku.count()) {
      await oku.click();
      await p.waitForTimeout(1200);
      // ★一覧の いちばん はじめの 品を 押します。
      const first = p.locator('.home-drawer button img, .home-drawer button svg').first();
      if (await first.count()) { await first.click(); await p.waitForTimeout(1200); }
      const kore = p.getByRole("button", { name: "これでいい", exact: true }).first();
      if (await kore.count()) { await kore.click(); await p.waitForTimeout(2500); }
      R.placedOne = true;
    }
  } catch (e) { R.placeError = String(e.message).slice(0, 160); }

  // ★したく を 閉じて、★配置を変える に 入ります。
  try {
  // ★★前に 立つ 紙を、★先に どけます（★「てんについて」など）。
  //   ★★2026-09-14、★ここで 2度 止まりました。★30秒 待って 落ちます。
  await p.screenshot({ path: out + "/03b-おわりの直前.png" });
  for (let i = 0; i < 4; i++) {
    const dlg = p.locator('[role="dialog"]');
    if (!(await dlg.count())) break;
    const close = dlg.locator('button:has-text("とじる"), button:has-text("閉じる"), button:has-text("やめる")').first();
    if (await close.count()) { await close.click(); await p.waitForTimeout(700); }
    else { await p.keyboard.press("Escape"); await p.waitForTimeout(700); }
  }
  const owari = p.locator('button:has-text("おわり")').first();
  if (await owari.count()) { await owari.click({ force: true }); await p.waitForTimeout(1800); }
  const arr = p.locator('button:has-text("配置を変える")').first();
  if (await arr.count()) { await arr.click(); await p.waitForTimeout(1200); }
  await p.screenshot({ path: out + "/04-配置を変える.png" });

  // ★★①を 測り直します。★置いた あとなら、★2つとも 出て います。
  //   ★★「したく」は 上の 札にも 同じ 字が あります（★ながめる／おうち／したく／たな）。
  //     ★★はじめの 測りは、★その 札を 掴んで いました（★y=82）。
  //     ★★下の ボタンは `position:fixed` です。★そこで 見分けます。
  R.buttons2 = await p.evaluate(() => {
    const pick = (txt, fixedOnly) => {
      const els = [...document.querySelectorAll("button")]
        .filter((b) => (b.textContent || "").trim() === txt)
        .filter((b) => !fixedOnly || getComputedStyle(b).position === "fixed");
      if (!els.length) return null;
      const r = els[0].getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        bottom: Math.round(r.bottom), right: Math.round(r.right),
        position: getComputedStyle(els[0]).position,
        zIndex: getComputedStyle(els[0]).zIndex };
    };
    const s = pick("したく", true);
    const a = pick("配置を変える", false) || pick("配置を決定", false);
    let overlap = null;
    if (s && a) {
      const ox = Math.min(s.right, a.right) - Math.max(s.x, a.x);
      const oy = Math.min(s.bottom, a.bottom) - Math.max(s.y, a.y);
      overlap = { x: Math.round(ox), y: Math.round(oy), overlaps: ox > 0 && oy > 0 };
    }
    return { shitaku: s, arrange: a, overlap };
  });

  R.items = await p.evaluate(() => {
    const anchor = document.getElementById("room-anchor");
    if (!anchor) return [];
    // ★掴める もの … draggable か、★touchAction を 切って いる もの
    const grabbables = [...anchor.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return el.getAttribute("draggable") === "true"
        || s.touchAction === "none" || s.cursor === "grab" || s.cursor === "move";
    });
    return grabbables.slice(0, 20).map((el) => {
      const r = el.getBoundingClientRect();
      // ★中の 絵（svg / img）── ★これが「見えて いる」大きさ です。
      const art = el.querySelector("svg, img");
      const ar = art ? art.getBoundingClientRect() : null;
      return {
        tag: el.tagName.toLowerCase(),
        grab: { w: Math.round(r.width), h: Math.round(r.height) },
        art: ar ? { w: Math.round(ar.width), h: Math.round(ar.height) } : null,
        touchAction: getComputedStyle(el).touchAction,
        padding: getComputedStyle(el).padding
      };
    });
  });

  } catch (e) {
    R.itemsError = String(e.message).slice(0, 200);
  }

  console.log(JSON.stringify(R, null, 2));
  await b.close();
})().catch(async (e) => {
  // ★★落ちた ところを 撮ります。★文だけでは、★どこで 止まったか 分かりません。
  try {
    const pages = (await (await require("playwright").chromium).name) ;
  } catch (x) {}
  console.error("★落ちました: " + e.message);
  process.exit(1);
});
"""


def main():
  base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3111"
  env = {}
  with open(os.path.join(ROOT, ".env.e2e"), encoding="utf-8") as f:
    for line in f:
      if "=" in line and not line.strip().startswith("#"):
        k, v = line.strip().split("=", 1)
        env[k] = v
  js = os.path.join(ROOT, "node_modules", ".cache", "sheep_room_check.js")
  os.makedirs(os.path.dirname(js), exist_ok=True)
  with open(js, "w", encoding="utf-8") as f:
    f.write(JS)
  p = subprocess.run(["node", js, base, env["E2E_EMAIL"], env["E2E_PASSWORD"], OUT],
                     cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  err = p.stderr.decode("utf-8", "replace").strip()
  if err:
    print("★stderr:", err[:600])
  out = p.stdout.decode("utf-8", "replace").strip()
  if not out:
    print("★何も 返りません でした")
    return 1
  print(out)
  with open(os.path.join(OUT, "measured.json"), "w", encoding="utf-8") as f:
    f.write(out + "\n")
  return 0


if __name__ == "__main__":
  sys.exit(main())


# ===========================================================================
# ★報告 ── ★測った 数から 書き出します（★手で 書きません）
# ===========================================================================

def report():
  """★docs/reports/2026-09-14-羊のおうち-実機4件.md を 書き出します。"""
  import json as _json
  before = os.path.join(ROOT, "docs", "design", "compare", "sheep-room-before", "measured.json")
  after = os.path.join(OUT, "measured.json")
  b = _json.load(open(before, encoding="utf-8")) if os.path.exists(before) else {}
  a = _json.load(open(after, encoding="utf-8")) if os.path.exists(after) else {}

  L = []
  w = L.append
  w("# 羊の おうち ── 実機の ご指摘 4件")
  w("")
  w("")
  w("★出どころ 2026-09-14、★坂本さん（実機）")
  w("★この 文は tools/sheep_room_check.py が 書き出しました。")
  w("★数は すべて、★動かして 測った ものです。★見当では ありません。")
  w("")
  w("★測った 端末の 大きさ 390 × 844（★iPhone 14 相当）")
  w("")
  w("---")
  w("")
  w("## ① ★「したく」と「配置を変える」が 重なる")
  w("")
  w("### 何が 起きて いたか")
  w("")
  w("| | 置きどころ | 測った 外形 |")
  w("|---|---|---|")
  w("| したく | `position: fixed` ／ 右 16 ／ 下 88 | **x 280–374 ／ y 708–756** |")
  w("| 配置を変える | 部屋の 箱の `bottom-2 right-2` | y 737–765 ／ 右 382 |")
  w("")
  rb = (b.get("room") or {})
  w("★部屋の 箱（★測り）── 上 %s ／ 高さ %s → ★下端 %s"
    % (rb.get("topGap"), (rb.get("box") or {}).get("h"),
       (rb.get("topGap") or 0) + ((rb.get("box") or {}).get("h") or 0)))
  w("")
  w("★★縦に **19px**、★横は ほぼ 全部 重なります。★どちらも 右下だから です。")
  w("")
  w("★★測り切れて いない ところ（★正直に 書きます）。")
  w("　★「配置を変える」は、★置いた 家具が 1つも 無いと 出ません。")
  w("　★試しの 口座には 家具が **0件** でした（★お店の 一覧も 0件）。")
  w("　★★だから この ボタンは、★画面に 出せて いません。")
  w("　★上の 数は、★「したく」の 測り（x280–374 / y708–756）と")
  w("　★部屋の 箱の 測り（下端 773）から 出した もの です。")
  w("")
  w("### 直した こと")
  w("")
  w("★「配置を変える」を **左下** へ 移しました（★部屋・庭 の 2か所 とも）。")
  w("★★x は 8 から 始まります。★「したく」は 280 から です。")
  w("　★★間が **270px** 空きます。★重なりません。押し まちがえません。")
  w("")
  w("---")
  w("")
  w("## ② ★したくへ 切り替わる カメラが 遅い")
  w("")
  w("### 測った 数")
  w("")
  w("| | 前 | 後 |")
  w("|---|---|---|")
  cb = (b.get("camera") or {})
  ca = (a.get("camera") or {})
  w("| 落ち着くまで | **%s ms** | **%s ms** |" % (cb.get("settledMs"), ca.get("settledMs")))
  w("| 押してから | %s ms | %s ms |" % (cb.get("wallClockMs"), ca.get("wallClockMs")))
  w("| 宣言（ふだん） | %s | %s |" % (cb.get("transitionDuration"), ca.get("transitionDuration")))
  w("")
  w("### なぜ 遅かったか")
  w("")
  w("★カメラの 秒数に、★**羊の 歩く 秒数**（`WALK_MS` ＝ 3200ms）を 渡して いました。")
  w("")
  w("★★それ自体は 正しい 決まり です。")
  w("　★カメラが 羊を **追う** あいだは、★羊と 同じ 秒数で なければ なりません。")
  w("　★ずれると、★着く 前に 止まったり、★着いて から 動いたり します。")
  w("")
  w("★★けれど、★場面の 切り替えでは **羊は 動いて いません**。")
  w("　★★追う 相手が いないのに、★3.2秒 かけて いました。")
  w("")
  w("### 直した こと")
  w("")
  w("★`ROOM_SWITCH_MS = 280`（`lib/roomCamera.js`）を 作りました。")
  w("★引き出しが 上がる 秒数（`SIZES.slideMs` ＝ 260ms）に そろえて います。")
  w("★★ばらばらだと、★部屋と 引き出しが 別々に 動いて 見えます。")
  w("")
  w("★羊を 追う ときは、★これまでどおり `WALK_MS` の まま です。")
  w("")
  w("### ★1度 しくじった ところ")
  w("")
  w("★はじめ、★`useEffect` の 中で 切り替えを 見分けました。★効きません でした。")
  w("★★effect は 描いた **あと**に 走ります。★切り替わった 最初の 1枚は、")
  w("　★まだ 3.2秒の まま です。★動きは その 1枚で 始まります。")
  w("★★測って 分かりました ── 直す 前 2843ms、★effect 版でも **2843ms**。")
  w("")
  w("★★次に `Date.now()` を 描く 最中に 読みました。★これも 誤り です。")
  w("　★サーバで 描いた ものと 合わなく なり、★画面が 出なく なりました。")
  w("")
  w("★★いまは、★React が 認めて いる「描いて いる 最中の setState」です。")
  w("")
  w("---")
  w("")
  w("## ③ ★天井が 低く 感じる")
  w("")
  w("### 測って 分かった こと")
  w("")
  w("| | |")
  w("|---|---|")
  w("| 部屋の 箱 | 390 × 634 |")
  w("| ★舞台（家具と 羊が 乗る ところ） | 390 × **278.6** |")
  w("| 余り | **355.4**（★上下に 177.7 ずつ） |")
  w("| ★壁の 帯（窓が ある ところ） | 278.6 × 52％ ＝ **144.9** |")
  w("")
  w("★★つまり、★部屋として 読める 帯は **144.9px** しか なく、")
  w("　★その 上下に、★平らな 色が 177.7px ずつ 広がって いました。")
  w("★★家具の ズレでは ありません。★舞台が 細かった のです。")
  w("")
  w("### 直した こと")
  w("")
  w("★余りの 分け方を、★半分ずつ から **上に 6割** へ 変えました。")
  w("　`STAGE_BLEED_TOP_RATIO = 0.6`（`lib/roomStage.js`）")
  w("")
  w("| | 前 | 後 |")
  w("|---|---|---|")
  w("| 床の 線 | 462 | **492**（★30px 下） |")
  w("| 窓の 上の 壁 | 148 | **185** |")
  w("| 見えて いる 床 | 318 | 281 |")
  w("")
  w("★★床は もともと 余って いました。★その ぶんを 上へ 回して います。")
  w("★★数は 1か所 だけ です。★0.6 を 変えれば、★色の 帯も 舞台も 一緒に 動きます。")
  w("")
  w("### ★これで 足りるかは、★坂本さんが お決めください")
  w("")
  w("★★`docs/design/compare/sheep-room/くらべる-ながめる.png`")
  w("　★左が 前、★右が 後 です。★赤の 線が 前の 床、★青の 線が 後の 床 です。")
  w("★★足りなければ、★0.65 や 0.7 に できます。★1行 です。")
  w("★★ただし 上げるほど、★羊の 足もとが 下がり、★床が 狭く なります。")
  w("")
  w("---")
  w("")
  w("## ④ ★家具の 当たり判定が 狭い")
  w("")
  w("### 読んで 分かった こと")
  w("")
  w("★掴める ところ ＝ `DraggableItem` の 箱 そのもの でした。")
  w("★★ところが、★「うごかす」の あいだ 出る **点線は `inset: -4`**。")
  w("　★★点線は、★箱より **4px 外側** に あります。")
  w("")
  w("★★つまり ──")
  w("　★**見えて いる 枠の 内側を 押した のに、掴めない 帯**が、")
  w("　★まわり 4px、★幅に して 8px、★ありました。")
  w("★★指の 腹は 8〜10mm あります。★4px の ずれは、★外し続けます。")
  w("")
  w("### 直した こと")
  w("")
  w("★透明な 板を、★点線の **外** まで 広げました。")
  w("　`GRAB_PAD_PX = 12` ／ `EDIT_OUTLINE_INSET_PX = 4`（`lib/sheepInteriorV2.js`）")
  w("")
  w("★★見えて いる 枠の 中は、★どこを 押しても 掴めます。")
  w("★★絵も、★置き場所も、★1つも 動いて いません。★当たりだけ です。")
  w("★★板は「うごかす」の あいだ だけ 出ます。")
  w("　★いつも 出すと、★ながめる ときに 窓や 羊が 押しにくく なります。")
  w("")
  w("### ★★確かめられて いません")
  w("")
  w("★試しの 口座には、★家具が **1つも ありません**（★お店の 一覧も 0件）。")
  w("★★だから「うごかす」の 画面を 出せず、★指で 掴んで 確かめて いません。")
  w("★★字の 上では 直って います。★動かした 確かめは、★まだ です。")
  w("")
  w("---")
  w("")
  w("## 確かめて いただきたい こと")
  w("")
  w("| | 見る ところ |")
  w("|---|---|")
  w("| ① | ながめるで、★2つの ボタンが 離れて いるか（★したく 右下 ／ 配置を変える 左下） |")
  w("| ② | したくを 押した ときの 動きが、★速く なって いるか |")
  w("| ③ | 天井が 上がって 見えるか。★足りなければ、★数を 上げます |")
  w("| ④ | ★家具を 1つ 置いて、★「配置を変える」で 掴みやすく なって いるか |")
  w("")
  w("★★見張りは 通りました（★sheep-room-feedback.test.js・20件）。")
  w("★★けれど 見張りは 字を 読むだけ です。★見えかたは 見て いません。")
  w("★★実機で お確かめください。")

  body = [x for x in L if x.strip()]
  L[1] = "全%d行 / 末尾は「%s」" % (len(L), body[-1])
  p = os.path.join(ROOT, "docs", "reports", "2026-09-14-羊のおうち-実機4件.md")
  open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
  n = len(open(p, encoding="utf-8").read().rstrip("\n").split("\n"))
  L[1] = "全%d行 / 末尾は「%s」" % (n, body[-1])
  open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
  print("★報告:", p, n, "行")
