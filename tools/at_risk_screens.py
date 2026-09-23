#!/usr/bin/env python3
"""★間に合わない かもしれない 画面を 見つける（2026-09-23）

  ★出どころ  実行ルート 第13版 §1・§1b ／ 坂本さんの お問い（2026-09-23）
    「★どの画面が『間に合わない可能性が高い』か、実測に基づいて特定してください」

  ★数を 覚えません。★毎回 数え直します ──
    ① 見本（4本）の SC の 鍵を、★実際に 動かして 取る
    ② 実行ルート §1b に 名ざしで 書かれた 画面を 取る
    ③ その 名前（または 見本の 中の 字）が、★実装の どこかに あるか 探す
    ④ 3つに 分ける …… 見本無し ／ 見本あり実装無し ／ 設計不完全

  ★「実装が ある」の 見方（★甘くしない）:
    ★画面の 題（h2 の 字）が components/ app/ の どこかに あるか。
    ★★字が 1つも 無ければ「実装 無し」と します。
      ★★★字が あっても「できて いる」とは 言いません。★足がかりが ある、まで です。

使い方: python3 tools/at_risk_screens.py
"""
import asyncio, json, os, re, subprocess, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [
  "00-動く見本-PC・iPad（運営）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-PC・iPad（個人）.html",
]

# ★隠して ある 機能（裁定176 §2 の 10鍵）。★B群 は ここに 属する 画面 です。
KAKUSU = ["公演", "レッスン割", "ポートフォリオ", "ホームページ", "値段", "さがす", "採点"]

JS = r"""(() => {
  const out = {};
  for (const k of Object.keys(SC)) {
    let html = '';
    try { html = String(SC[k](0) ?? ''); } catch (e) { html = ''; }
    const m = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
    out[k] = m ? m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  }
  return out;
})()"""


async def 見本の鍵(path):
  from playwright.async_api import async_playwright
  async with async_playwright() as p:
    b = await p.chromium.launch(); pg = await b.new_page()
    await pg.goto("file://" + urllib.parse.quote(os.path.abspath(path)))
    await pg.wait_for_function("typeof SC==='object'")
    await pg.wait_for_timeout(400)
    d = await pg.evaluate(JS); await b.close()
  return d


def ルートの画面():
  """★実行ルート §1b に 名ざしで 書かれた 画面（★見本の 有無に かかわらず）"""
  p = None
  for f in sorted(os.listdir(PACK)):
    if f.startswith("実行ルート") and "第13版" in f: p = os.path.join(PACK, f)
  if not p: return {}, None
  s = open(p, encoding="utf-8").read()
  i = s.find("## 1b.")
  j = s.find("\n## ", i + 5)
  blk = s[i:j if j > 0 else len(s)]
  出 = {}
  群 = ""
  for line in blk.split("\n"):
    m = re.match(r"^(公演（[^）]+）|学校（[^）]+）|個人（[^）]+）):\s*$", line.strip())
    if m: 群 = m.group(1); continue
    if line.strip().startswith("★同じときに"): 群 = "既存の直し"; continue
    # ★★「裁定」で 始まる ところ までを 名前と します。
    #   ★前は `★.*` も 受けて いたので、★名前が 「はじめの 1週間 裁定183 P4」に なって いました。
    m = re.match(r"^\s{2,}★?([^\s].*?)\s{2,}裁定\S+", line.rstrip())
    if not m:
      # ★「既存の直し」の 行は 裁定を 書かず、★で 説明が 始まります。
      m = re.match(r"^\s{2,}★?([^\s].*?)\s{2,}★", line.rstrip())
    if m and 群:
      名 = m.group(1).replace("★", "").strip()
      if 名 and not 名.startswith("#"): 出[名] = 群
  return 出, os.path.basename(p)


def 字だけ(s):
  """★空白（半角・全角）を 落とします。★見本の 鍵は「作品をさがす」、★h2 は「作品を さがす」。
     ★★同じ ものを 別と 数えない ように します。"""
  return re.sub(r"[\s\u3000]+", "", s or "")


def 対応表():
  """★見本の 画面 → ★作った ファイル（`tools/screen_impl.json`）。

     ★★★名前で 探す だけ では 足りません。
       ★見本 `SC['スタッフの自分の予定']` の 見出しは「自分の 予定」です。
       ★★画面の 名前が そのまま コードに 出る とは かぎりません
         （★2026-09-24、★作って ある 7画面を「無い」と 出しました）。
     ★★だから、★対応を 1枚の 紙に 書きます。★2つの 道具が 同じ 紙を 読みます。
  """
  p = os.path.join(ROOT, "tools", "screen_impl.json")
  if not os.path.exists(p): return {}
  try:
    d = json.load(open(p, encoding="utf-8"))
  except Exception:
    return {}
  return {k: v for k, v in d.items() if not k.startswith("_")}


def 実装を探す(語):
  """★その 字が 実装の **註では ない ところ** に あるか。★あった 行を 返します。

     ★★★2026-09-23 に 3件 とも 偽でした ──
       ★「自分の 予定」…… OpsKumu.jsx の **註**（裁定142・別の 機能）に 当たって いました
       ★「書き出す」  …… MorePanel.jsx の「記録をCSVで 書き出す」に 当たって いました
       ★★短い 字は どこにでも あります。★当たった ことは、★在る ことでは ありません。

     ★★だから 2つ 変えました ──
       ① 註を 外して から 探す
       ② 当たった **行** を 返す（★人が 見て 確かめられる ように）
  """
  語 = re.sub(r"[\s\u3000]+", "", 語 or "")
  if len(語) < 4: return []          # ★短すぎる 字では 探しません
  出 = []
  for 根 in ("components", "app", "lib"):
    for d, _, fs in os.walk(os.path.join(ROOT, 根)):
      if "/tests" in d or "node_modules" in d: continue
      for f in fs:
        if not f.endswith((".js", ".jsx")): continue
        fp = os.path.join(d, f)
        try: 中 = open(fp, encoding="utf-8").read()
        except Exception: continue
        # ★★註を 外す とき、★行の 数を 変えません。
        #   ★★（2026-09-23、★空に 置き換えた ため 行番号が ずれ、
        #      ★註の 行を 指して いる ように 見えました）
        中 = re.sub(r"/\*[\s\S]*?\*/", lambda m: "\n" * m.group(0).count("\n"), 中)
        for n, line in enumerate(中.split("\n"), 1):
          if re.match(r"^\s*//", line): continue
          if 語 in re.sub(r"[\s\u3000]+", "", line):
            出.append("%s:%d" % (os.path.relpath(fp, ROOT), n))
            break
        if 出 and len(出) >= 3: return 出
  return 出


def main():
  鍵 = {}
  for f in MIHON:
    p = os.path.join(PACK, f)
    if not os.path.exists(p):
      print("★止まりました ── 見本が ありません:", f); return 2
    d = asyncio.run(見本の鍵(p))
    for k, h2 in d.items():
      if k not in 鍵 or not 鍵[k][0]: 鍵[k] = (h2, f)
  if not 鍵:
    print("★止まりました ── 見本から 1つも 取れませんでした"); return 2

  # ★★★道具の 目盛り合わせ ── ★**在る と 分かって いる もの** で 試します。
  #   ★見つけない 道具は、★世の中が きれいなのでは なく、★壊れて いる のかも しれません。
  #   ★「希望の 地図」は `components/LessonPrefMap.jsx` に 字として あります。
  #   ★「ありえない画面の名」は どこにも ありません。
  当 = 実装を探す("希望の 地図")
  空 = 実装を探す("★ありえない画面の名")
  if not 当 or 空:
    print("★止まりました ── 目盛りが 合いません（在るはず=%s ／ 無いはず=%s）" % (当, 空))
    return 2
  print("  目盛り合わせ …… 在るはず ○（%s）／ 無いはず ○" % 当[0])

  ルート, ルート紙 = ルートの画面()

  print("AT_RISK_SCREENS")
  print("  見本 …… %d本 ／ 画面 %d" % (len(MIHON), len(鍵)))
  print("  実行ルート §1b …… %s ／ 名ざし %d画面" % (ルート紙 or "★読めない", len(ルート)))
  print()

  A, B, C = [], [], []   # ★見本無し ／ 見本あり実装無し ／ 見本あり足がかりあり

  # ★★見本の 画面 → 作った ファイルの 対応（★2つの 道具が 同じ 紙を 読みます）
  表 = 対応表()
  表字 = {字だけ(k): v for k, v in 表.items()}

  for 名, 群 in sorted(ルート.items()):
    n = 字だけ(名)
    候 = [k for k in 鍵 if n and (n in 字だけ(k) or n in 字だけ(鍵[k][0]))]
    if not 候:
      A.append((名, 群, "見本 無し"))
      continue
    k = 候[0]
    # ★★対応表に 書いて あれば、★それが 答え です（★名前で 探しません）。
    紙表 = 表.get(k) or 表字.get(字だけ(k))
    if 紙表:
      有 = [f for f in 紙表 if os.path.exists(os.path.join(ROOT, f))]
      (C if 有 else B).append((名, 群, k, k, 有[:2]))
      continue
    題 = 鍵[k][0] or k
    # ★★★探すのは **見本の 鍵**（画面の 名）です。★h2 では ありません。
    #   ★h2 は「自分の 予定」「書き出す」の ように 短く、★どこにでも あります。
    #   ★★2026-09-23、★h2 で 探した ため 5件 とも 偽でした ──
    #     ★「自分の 予定」→ console.error の 文 ／「書き出す」→ 記録をCSVで 書き出す
    #   ★★★当たった ことは、★在る ことでは ありません。
    紙 = 実装を探す(k)
    (C if 紙 else B).append((名, 群, k, 題, 紙[:2]))

  # ★隠して ある 機能の 画面 ぜんぶ（★§1b に 無い ものも 含める）
  隠 = []
  for k, (h2, f) in sorted(鍵.items()):
    if not any(字だけ(w) in 字だけ(k) or 字だけ(w) in 字だけ(h2) for w in KAKUSU): continue
    if 表.get(k) or 表字.get(字だけ(k)): continue
    紙 = 実装を探す(h2 or k)
    if not 紙: 隠.append((k, h2, f))

  print("■ ① 見本 すら 無い（%d）" % len(A))
  for 名, 群, _ in A: print("   ", 名, "／", 群)
  print()
  print("■ ② 見本は ある・実装に 字が 1つも 無い（%d）" % len(B))
  for 名, 群, k, 題, _ in B: print("   ", 名, "／", 群, "／ 見本 SC[%s]" % k)
  print()
  print("■ ③ 見本が あり、実装に 足がかりが ある（%d）" % len(C))
  for 名, 群, k, 題, 紙 in C: print("   ", 名, "／", 群, "／", "・".join(紙))
  print()
  print("■ ④ 隠して ある 機能で、実装に 字が 無い 見本（%d）" % len(隠))
  for k, h2, f in 隠: print("   ", k, ("／" + h2) if h2 and h2 != k else "")
  print()
  print("RESULT: OK（★数えました。★「できて いる」とは 言って いません）")
  return 0


if __name__ == "__main__":
  sys.exit(main())
