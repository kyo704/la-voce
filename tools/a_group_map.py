#!/usr/bin/env python3
"""★段3a A群 ── ★見本の 画面が、★どの 紙で できて いるかを 探します（2026-09-24）

  ★出どころ  実行ルート 第13版 §1「★A いま比べられる 225画面」
    ★坂本さんの お決め …「網羅性を 優先する。1画面ずつ 丁寧に、しかし 止まらずに」

  ★★★手で 143枚 書き写すと、★写しまちがいが 必ず 出ます。
    ★だから **探させます**。★見本の その 画面 だけ に ある 長い 字を 取り、
    ★★`components/` と `lib/` の どこに あるかを 数えます。

  ★★見つけ方（★当てずっぽうに しない）──
    ① その 画面の 見える 字の うち、★**その 画面に しか 無い** 長い ものを 選ぶ
       ★★ほかの 画面にも ある 字（「戻る」「もっと」…）は 手がかりに なりません
    ② その 字を 持つ 紙を 数える
    ③ 2枚 以上 当たったら、★多く 当たった ほうを 先に 出す（★決めません）

  ★★★決めません。★**下書き**を 出す だけ です。
    ★`tools/screen_impl.json` に 写すのは 人（私）が 1枚ずつ 見てから です。

使い方: python3 tools/a_group_map.py            ★下書きを 出す
        python3 tools/a_group_map.py --json     ★JSON で 出す
"""
import asyncio, io, json, os, re, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [
  "00-動く見本-PC・iPad（運営）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-PC・iPad（個人）.html",
]

JS = """(() => {
  const out = {};
  for (const k of Object.keys(SC)) {
    let html = '';
    try { html = String(SC[k](0) ?? ''); } catch (e) { html = ''; }
    out[k] = html.replace(/<[^>]*>/g, '\\u0001').split('\\u0001');
  }
  return out;
})()"""


def 字だけ(s):
  return re.sub(r"[^0-9０-９A-Za-zぁ-んァ-ヶ一-龠々ー「」（）]", "", s or "")


async def 見本を読む(path):
  from playwright.async_api import async_playwright
  async with async_playwright() as p:
    b = await p.chromium.launch(); pg = await b.new_page()
    await pg.goto("file://" + urllib.parse.quote(os.path.abspath(path)))
    await pg.wait_for_function("typeof SC==='object'")
    await pg.wait_for_timeout(300)
    d = await pg.evaluate(JS); await b.close()
  return d


def 紙をあつめる():
  出 = {}
  for 根 in ("components", "lib"):
    for d, _, fs in os.walk(os.path.join(ROOT, 根)):
      if "/tests" in d or "node_modules" in d: continue
      for f in fs:
        if not f.endswith((".js", ".jsx")): continue
        fp = os.path.join(d, f)
        try: s = io.open(fp, encoding="utf-8").read()
        except Exception: continue
        # ★註は 落とします。★註に 書いて あるのは「出して いる」ことに なりません
        s = re.sub(r"/\*[\s\S]*?\*/", " ", s)
        s = re.sub(r"^\s*//.*$", " ", s, flags=re.M)
        出[os.path.relpath(fp, ROOT)] = 字だけ(s)
  return 出


def main(json_out=False):
  画面 = {}
  もと = {}
  for f in MIHON:
    p = os.path.join(PACK, f)
    if not os.path.exists(p): continue
    for k, v in asyncio.run(見本を読む(p)).items():
      if k not in 画面: 画面[k] = v; もと[k] = f
  if not 画面:
    print("★止まりました ── 見本を 読めません"); return 2

  # ★★その 画面に しか 無い 字（★ほかの 画面にも あれば 手がかりに しません）
  数 = {}
  for k, 行 in 画面.items():
    for t in 行:
      w = 字だけ(t)
      if len(w) < 12: continue
      数[w] = 数.get(w, 0) + 1

  紙 = 紙をあつめる()
  対 = json.load(io.open(os.path.join(ROOT, "tools", "screen_impl.json"), encoding="utf-8"))
  済 = set(k for k in 対 if not k.startswith("_"))

  下書き = {}
  手がかり無し = []
  for k in sorted(画面):
    if k in 済: continue
    印 = [字だけ(t) for t in 画面[k]
          if len(字だけ(t)) >= 12 and 数.get(字だけ(t), 0) == 1]
    if not 印:
      手がかり無し.append(k); continue
    当 = {}
    for p, s in 紙.items():
      n = sum(1 for w in 印 if w in s)
      if n: 当[p] = n
    if not 当:
      手がかり無し.append(k); continue
    並 = sorted(当.items(), key=lambda x: (-x[1], x[0]))
    下書き[k] = {"印": len(印), "当": 並[:3], "見本": もと[k]}

  if json_out:
    print(json.dumps({"下書き": 下書き, "手がかり無し": 手がかり無し},
                     ensure_ascii=False, indent=2))
    return 0

  print("A_GROUP_MAP")
  print("  見本の 画面 …… %d ／ 対応表に ある …… %d ／ 探した …… %d"
        % (len(画面), len(済), len(画面) - len(済)))
  print("  見つかった …… %d ／ 手がかりが 無い …… %d" % (len(下書き), len(手がかり無し)))
  print()
  確 = [k for k, v in 下書き.items() if v["当"] and v["当"][0][1] >= 2]
  薄 = [k for k in 下書き if k not in 確]
  print("■ ★手がかりが 2つ 以上 当たった（%d）" % len(確))
  for k in 確:
    v = 下書き[k]
    print("   %-22s %s（%d）" % (k[:22], v["当"][0][0], v["当"][0][1]))
  print()
  print("■ ★手がかりが 1つ だけ（%d）★確かめが 要ります" % len(薄))
  for k in 薄[:40]:
    v = 下書き[k]
    print("   %-22s %s" % (k[:22], v["当"][0][0]))
  if len(薄) > 40: print("   … ほか %d" % (len(薄) - 40))
  print()
  print("■ ★手がかりが 無い（%d）★作って いない か、★字が 短い だけ" % len(手がかり無し))
  for k in 手がかり無し[:30]: print("   ", k)
  if len(手がかり無し) > 30: print("   … ほか %d" % (len(手がかり無し) - 30))
  print()
  print("RESULT: OK（★下書き です。★対応表に 写すのは 1枚ずつ 見てから）")
  return 0


if __name__ == "__main__":
  sys.exit(main("--json" in sys.argv))
