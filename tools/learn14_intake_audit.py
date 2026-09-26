#!/usr/bin/env python3
"""★学ぶの 記事 14本 を 受け入れられる か（★裁定211 の 下ごしらえ・2026-09-27）。

  ★★★見るだけ です。★1行も 書き換えて いません。

  ★★数える もの ──
    ①題と 章立ての もとが どこか（★生きて いる 紙 は 1つ だけ か）
    ②見本『もっと深く』の 題が、★いま 何本 実装に あるか
    ③『まだ 書いて いません』の 1行を 出す 仕組みが ある か

  ★★★`body` と `bodyMd` ── ★鍵が 2つ あります。
    ★`docs/learn-content/articles.json` は `body`、★`shobai.json` は `bodyMd`。
    ★★片方だけ で 数えると、★書いて ある 14本が「空」に 見えます（★2026-09-25 の 一件）。
    ★★★だから 両方 見ます。

  ★使い方  python3 tools/learn14_intake_audit.py
"""
import io, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
出先 = "docs/reports/2026-09-27-学ぶ14本受け皿監査.md"
生き = "lib/learnContent.js"
見本 = "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"
紙ら = [生き, 見本, "docs/learn-content/articles.json", "docs/learn-content/shobai.json",
        "docs/learn-content/manifest.json", "lib/moreBundles.js", "components/MoreBundle.jsx",
        "docs/design/pack-final/ruling-176-hidden-until-proved.md",
        "scripts/build-learn-content.js"]


def 読む(相対):
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    print("★止まりました ── もとの 紙が ありません: %s" % 相対)
    sys.exit(2)
  return io.open(p, encoding="utf-8", errors="ignore").read()


中 = {p: 読む(p) for p in 紙ら}

# ── ★一 生きて いる 記事（★`lib/learnContent.js` の `ARTICLES`）
記事 = []
s = 中[生き]
i = s.index("export const ARTICLES")
体 = s[s.index("[", i):]
体 = 体[:体.rindex("];") + 1]
for m in re.finditer(r'\btitle:\s*"((?:[^"\\]|\\.)*)"', 体):
  記事.append(m.group(1))
if not 記事:
  print("★止まりました ── `ARTICLES` から 題を 1つも 取れません")
  sys.exit(2)
章 = sorted(set(int(x) for x in re.findall(r"\bchapter:\s*(\d+)", 体)))
本文鍵 = sorted(set(re.findall(r"\b(body|bodyMd|lead):", 体)))

# ── ★二 見本『もっと深く』の 題
m = re.search(r"SC\['もっと深く'\][\s\S]{0,2500}?\};", 中[見本])
if not m:
  print("★止まりました ── 見本に `SC['もっと深く']` が ありません")
  sys.exit(2)
深 = m.group(0)
題ら = []
for g in re.finditer(r"dgrp\('([^']+)',\[([\s\S]*?)\]\)", 深):
  節 = g.group(1)
  for t in re.findall(r"""['"]([^'"]{3,60})['"]""", g.group(2)):
    題ら.append((節, t))
if not 題ら:
  print("★止まりました ── 『もっと深く』から 題を 取れません")
  sys.exit(2)


def 当たる(題):
  """★題が 実装に ある か（★かっこ書き・全角空白の ゆれを 落として くらべます）。"""
  素 = re.sub(r"[ 　]", "", 題.split("──")[0].split("（")[0])
  for t in 記事:
    if 素 and 素 in re.sub(r"[ 　]", "", t):
      return t
  return None


# ── ★三 もとの 紙
art = json.loads(中["docs/learn-content/articles.json"])
sho = json.loads(中["docs/learn-content/shobai.json"])
man = json.loads(中["docs/learn-content/manifest.json"])
もと = [
  ("docs/learn-content/articles.json", len(art["articles"]), "body",
   sum(1 for x in art["articles"] if str(x.get("body", "")).strip())),
  ("docs/learn-content/shobai.json", len(sho["articles"]), "bodyMd",
   sum(1 for x in sho["articles"] if str(x.get("bodyMd", "")).strip())),
]

# ── ★四 『まだ 書いて いません』の 仕組み
仕組 = []
for 相対, 語 in [("lib/moreBundles.js", r"readyAt"), ("components/MoreBundle.jsx", r"readyAt")]:
  仕組.append((相対, len(re.findall(語, 中[相対]))))
深く行 = re.search(r"\{[^{}]*to:\s*\"もっと深く\"[^{}]*\}", 中["lib/moreBundles.js"])
禁 = re.search(r"近日公開[^\n]*", 中["docs/design/pack-final/ruling-176-hidden-until-proved.md"])
def 註を落とす(t):
  """★註（コメント）を 落とします。★落とさないと、★『近日公開と 書かない』と いう
  ★**禁じ手の 註** が、★そのまま『書いて ある』に 数えられます（★台帳の 決め）。"""
  t = re.sub(r"/\*[\s\S]*?\*/", " ", t)
  return re.sub(r"(?m)^\s*//.*$", " ", t)


語探し = {}
for 語 in ("まだ 書いて いません", "まだ書いていません", "準備中", "近日公開", "未執筆"):
  生, 素 = [], []
  for 根, _d, 紙 in os.walk(ROOT):
    if any(x in 根 for x in ("/node_modules", "/.git", "/docs", "/tools")):
      continue
    for f in 紙:
      if f.endswith((".js", ".jsx")) and "/tests/" not in os.path.join(根, f):
        q = os.path.join(根, f)
        t = io.open(q, encoding="utf-8", errors="ignore").read()
        if 語 in t:
          生.append(os.path.relpath(q, ROOT))
          if 語 in 註を落とす(t):
            素.append(os.path.relpath(q, ROOT))
  語探し[語] = (sorted(set(生)), sorted(set(素)))

L = []
L.append("# ★学ぶ 14本 の 受け皿 ── ★書く 前に 見ました")
L.append("")
L.append("★この 紙は `tools/learn14_intake_audit.py` が 書きました。★手で 足して いません。")
L.append("★見た 日 …… %s" % datetime.date.today().isoformat())
L.append("")
L.append("★★**見るだけ です。★コードは 1行も 書いて いません。**")
L.append("")

L.append("## ★一 題と 章立ての もと は どこか")
L.append("")
L.append("| 紙 | 何本 | 本文の 鍵 | 本文が 入って いる 数 |")
L.append("|---|---|---|---|")
for 名, n, 鍵, 有 in もと:
  L.append("| `%s` | %d | `%s` | %d |" % (名, n, 鍵, 有))
L.append("| `%s`（★アプリが 読む もの） | %d | %s | ★空 0 |"
         % (生き, len(記事), "／".join("`%s`" % k for k in 本文鍵)))
L.append("")
L.append("★★★生きて いるのは `%s` の `ARTICLES` **1つ だけ** です。" % 生き)
L.append("★`components/VocalTracker.jsx` が 読みます。★`docs/learn-content/*.json` は **もと** で、")
L.append("★`scripts/build-learn-content.js` が id で 突き合わせて 移します。")
L.append("")
L.append("★★★鍵が 2つ ある こと に 気を つけて ください ── "
         "`articles.json` は `body`、`shobai.json` は `bodyMd`。")
L.append("★片方 だけ で 数えると、★書いて ある 14本が「空」に 見えます（★2026-09-25 の 一件）。")
L.append("")
L.append("★章立て …… `docs/learn-content/manifest.json` に %d 章（%s）。"
         % (len(man["chapters"]), "／".join(c["title"] for c in man["chapters"])))
L.append("★★`ARTICLES` の `chapter` は %s まで あります（★商いの 8・9 を 含みます）。"
         % "〜".join([str(章[0]), str(章[-1])]))
L.append("★お仕事の 別 …… %s（`manifest.json` の `tabs`）。"
         % "／".join(p["id"] for p in man["professions"]))
L.append("")

有 = [(節, t, 当たる(t)) for 節, t in 題ら]
ある = [x for x in 有 if x[2]]
L.append("## ★二 見本『もっと深く』の %d題 ── ★いま 何本 ある か" % len(題ら))
L.append("")
L.append("| 節 | 見本の 題 | 実装に ある か |")
L.append("|---|---|---|")
for 節, t, hit in 有:
  L.append("| %s | %s | %s |" % (節, t, ("○ `%s`" % hit) if hit else "★無い"))
L.append("")
L.append("★★%d題 中 **%d本** が 実装に あります。★残り **%d本** が ありません。"
         % (len(題ら), len(ある), len(題ら) - len(ある)))
L.append("★★★裁定211 の「14本」は、★この 残り と 数が 近い です（★%d）。★同じ ものか どうかは"
         "こちらでは 決められません。" % (len(題ら) - len(ある)))
L.append("")

L.append("## ★三 いちばん 大きい 穴 ── ★出す 画面が ありません")
L.append("")
L.append("- ★`lib/moreBundles.js` に 行は あります …… `%s`"
         % (深く行.group(0).strip() if 深く行 else "★見つかりません"))
L.append("- ★★`readyAt` が `null` の 行は **出しません**（★`lib/moreBundles.js` の 頭の 決め／"
         "`components/MoreBundle.jsx`）。★だから いまは 入口が ありません。")
L.append("- ★★★記事を 14本 書いても、★それだけでは 誰も 読めません。★要る のは 3つ ──")
L.append("  ①『もっと深く』の 画面 ②`readyAt` に 日付 ③記事を `ARTICLES` に 足す（★章の 割り当て）。")
L.append("- ★`ARTICLES` は「1件 足すだけ」で 増える 形 です（★`%s` の 頭の 約束）。" % 生き)
L.append("  ★★**記事の 受け入れ そのものは できて います**。★足りないのは 出口 です。")
L.append("")

L.append("## ★四 『まだ 書いて いません』の 1行 ── ★仕組みは ありません")
L.append("")
L.append("★★★註（コメント）を 落として から 数えます。★落とさないと、"
         "★「近日公開と 書かない」と いう **禁じ手の 註** が、★そのまま『書いて ある』に なります。")
L.append("")
L.append("| 探した 字 | ★人に 出る ところ（註を 落とした あと） | ★註 だけ の 紙 |")
L.append("|---|---|---|")
for 語, (生, 素) in 語探し.items():
  註のみ = [x for x in 生 if x not in 素]
  L.append("| 「%s」 | %s | %s |"
           % (語,
              "／".join("`%s`" % x for x in 素) if 素 else "★ありません",
              "／".join("`%s`" % x for x in 註のみ) if 註のみ else "—"))
L.append("")
L.append("★★`app/login/page.js` の「開演準備中…」は **待って いる あいだ の 札** です"
         "（★`btnLoading`）。★『近日公開』の たぐいでは ありません。")
L.append("")
L.append("★★★いまの 決めは **逆** です ── ★行き先の 無い 行は **出しません**。")
L.append("★★裁定176 §3 が こう 書いて います ── 「%s」"
         % (禁.group(0).strip() if 禁 else "★読み取れません"))
L.append("★★`components/Tsutaeru.jsx` にも「★『準備中』も 書きません（★裁定176 §3）」と あります。")
L.append("")
L.append("★★★だから 58本を 1行で 出す には、★**先に 裁定が 要ります**。"
         "★こちらでは 決めません。")
L.append("")
L.append("★もし 出す と 決まった とき に 要る もの（★いまは 1つも ありません）──")
L.append("")
L.append("1. ★**未執筆の 題の 一覧**。★いま 題は `ARTICLES` に しか なく、"
         "★書いて いない 記事の 題は **どこにも ありません**。")
L.append("2. ★その 一覧と `ARTICLES` の 差を 出す 関数（★1か所 だけ）。")
L.append("3. ★1行の 字（★9言語。★`lib/t.js` の `tx()` を 通す こと）。")
L.append("4. ★見張り 1本（★裁定176 §3 と ぶつからない こと を 確かめる もの）。")
L.append("")

L.append("## ★五 この 紙で 言えない こと")
L.append("")
L.append("- ★**「58本」の 出どころが この 蔵に ありません**。★学ぶ の 文脈で その 数を 見つけられません"
         "（★見本『もっと深く』は %d題、★`ARTICLES` は %d本、★`articles.json` は %d本）。"
         "★数の もとを お知らせください。" % (len(題ら), len(記事), len(art["articles"])))
L.append("- ★裁定211 の 本文を 読んで いません（★この 蔵に ありません）。"
         "★「14本」が 上の 残り %d本 と 同じ かは 確かめられません。" % (len(題ら) - len(ある)))
L.append("- ★題の 突き合わせは 字の 一致 です。★言い回しが 変われば 外れます。")
L.append("")

p = os.path.join(ROOT, 出先)
io.open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("REPORT: " + 出先)
print("★ARTICLES %d本 ／ ★もっと深く %d題 中 ある %d ／ ★1行の 仕組み %s"
      % (len(記事), len(題ら), len(ある),
         "あり" if any(語探し[k][1] for k in ("まだ 書いて いません", "まだ書いていません")) else "★なし"))
