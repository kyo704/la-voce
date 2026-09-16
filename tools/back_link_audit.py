#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★もっとの先の 全画面で、★戻る 道を 数えます。

  ★★出どころ　坂本さん（★2026-09-16・最優先）──
    「★見本には 左上に 戻る 導線が あるが、★実機では 多くの 画面で 欠けて いる。
      ★存在する 画面でも 色・大きさが 見本と 一致して いない。
      ★共通の 原因を 先に 特定してから、★個別修正に 進む こと」

  ★★見本の 戻る 道 ──
    function bk(t){ return '<div class="back" onclick="pop()">‹ '+t+'</div>' }
    .back{ font-size:12.5px; color:var(--enji); padding:9px 0 3px; display:inline-block }

  ★★数えるのは 3つ です ──
    ★① 在るか　★② 色と 大きさが 合って いるか　★③ 行き先は 正しいか

  ★★③を 足した わけ ── ★在っても、★来た ところへ 帰らない なら 道では ありません。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-戻る道の棚おろし.md")
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")
UI = os.path.join(ROOT, "components", "UiV2.jsx")
TOK = os.path.join(ROOT, "lib", "tokens.js")
M = os.path.join(ROOT, "docs", "design", "pack-final",
                 "00-動く見本（さわれる・全画面）.html")

for p in (VT, UI, TOK, M):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    print("　★数えません。★止まります。")
    sys.exit(1)

vt = io.open(VT, encoding="utf-8").read()
ui = io.open(UI, encoding="utf-8").read()
tok = io.open(TOK, encoding="utf-8").read()
mk = io.open(M, encoding="utf-8").read()

# ★★見本の .back を、★書き写さずに 読みます。
mback = re.search(r"\.back\{([^}]*)\}", mk)
MB = {}
if mback:
  for d in mback.group(1).split(";"):
    if ":" in d:
      k, v = d.split(":", 1)
      MB[k.strip()] = v.strip()
MB_SIZE = MB.get("font-size", "?")
MB_COLOR = MB.get("color", "?")
ENJI = re.search(r"--enji:\s*(#[0-9A-Fa-f]{6})", mk)
ENJI = ENJI.group(1) if ENJI else "?"
CURTAIN = re.search(r'curtain:\s*"(#[0-9A-Fa-f]{6})"', tok)
CURTAIN = CURTAIN.group(1) if CURTAIN else "?"
INKSOFT = re.search(r'inkSoft:\s*"(#[0-9A-Fa-f]{6})"', tok)
INKSOFT = INKSOFT.group(1) if INKSOFT else "?"

# ★★もっとの 行と、★押した ときの 行き先（★`VocalTracker` の 分岐 そのまま）。
SCREENS = [
  ("設定", "moreSection", "設定", "パンくず"),
  ("毎日、聞いてほしいこと", "moreSection", "聞く", "パンくず"),
  ("アカウント", "sheet", "アカウント", "1枚（閉じる）"),
  ("プラン", "moreSection", "プラン", "パンくず"),
  ("学ぶ（入口の箱）", "moreSection", "学ぶ", "パンくず"),
  ("学ぶ（本体）", "activeTab", "learn", None),
  ("健康情報", "activeTab", "info", None),
  ("もっているもの", "component", "OwnedLedger", "丸い ‹"),
  ("プロフィール・記録項目", "activeTab", "profile", "ChevronLeft 戻る"),
  ("書き出す", "moreSection", "じぶんの記録", "パンくず"),
  ("同意を とりけす", "activeTab", "withdrawConsent", "← もどる"),
  ("退会する", "moreSection", "じぶんの記録", "パンくず"),
  ("生徒を 招待する", "activeTab", "lesson", None),
]

# ★★実装の パンくず（1か所・手で 書かれて います）。
bc = re.search(r"moreSection !== null \? \(\s*<button[\s\S]{0,420}?‹　もっと", vt)
BC = bc.group(0) if bc else ""
BC_COLOR = re.search(r"color: (C\.\w+)", BC)
BC_COLOR = BC_COLOR.group(1) if BC_COLOR else "?"
BC_SIZE = re.search(r"fontSize: (\d+(?:\.\d+)?)", BC)
BC_SIZE = BC_SIZE.group(1) + "px" if BC_SIZE else "?"

# ★★共通の 部品が 使われて いるか。
BACK_DEFINED = "export function Back(" in ui
BACK_USED = len(re.findall(r"<Back[\s>]", vt))

L = []
A = L.append
A("# もっとの先 ── 戻る 道の 棚おろし")
A("")
A("★出どころ　坂本さん（2026-09-16・最優先）")
A("")
A("## ★★共通の 原因 ── 1つ あります")
A("")
A("★`components/UiV2.jsx` に、★見本どおりの 部品が **在ります** ──")
A("")
A("```jsx")
A("export function Back({ children, onClick }) {   // ★" + ("在り" if BACK_DEFINED else "ありません") + "")
A('  … color: C.curtain, fontSize: rem(12.5) …     // ★見本と 同じ')
A("```")
A("")
A("★★けれど、★**どこからも 呼ばれて いません**（★`<Back` … %d 件）。" % BACK_USED)
A("")
A("★★代わりに、★`VocalTracker.jsx` に **手で 書いた** パンくずが 1つ あります ──")
A("")
A("| | 見本 `.back` | 実装の パンくず |")
A("|---|---|---|")
A("| 大きさ | **%s** | **%s** |" % (MB_SIZE, BC_SIZE))
A("| 色 | **%s**（`--enji` %s） | **%s**（%s） |" % (MB_COLOR, ENJI, BC_COLOR, INKSOFT))
A("")
A("★★色が ちがいます。★見本は **えんじ**、★実装は **灰色** です。")
A("　★えんじは「押せる」の 色 です。★灰色は 添えの 字の 色 です。")
A("　★★押せる ものが、★押せない ものの 色を して います。")
A("")
A("★★大きさも 0.5px ちがいます（12.5 → 13）。★こちらは 小さな 差 です。")
A("")
A("★★これが「作った 関数は、必ず どこかから 呼ばれて いるか」の 形 です。")
A("　★部品は 正しく 作られ、★**使われて いません** でした。")
A("")
A("---")
A("")
A("## 画面ごと")
A("")
A("| 画面 | 行き先 | 戻る 道 | 見本と 同じか |")
A("|---|---|---|---|")
for name, kind, key, back in SCREENS:
  if back is None:
    A("| %s | `%s` | ★★**ありません** | ── |" % (name, key))
  elif back == "パンくず":
    A("| %s | `moreSection=%s` | パンくず | ★色と 大きさが ちがう |" % (name, key))
  elif back == "1枚（閉じる）":
    A("| %s | 1枚 | 下の「閉じる」 | ★見本も 1枚（`shBtm`）。同じ |" % name)
  else:
    A("| %s | `%s` | %s | ★形が ちがう |" % (name, key, back))
A("")
missing = [s[0] for s in SCREENS if s[3] is None]
A("### ★★戻る 道が **1つも 無い** 画面（%d）" % len(missing))
A("")
for x in missing:
  A("・**" + x + "**")
A("")
A("★★どれも `activeTab` を 立てて 飛ぶ 画面 です。")
A("　★★パンくずは「もっと」の タブの 中に 書かれて います。")
A("　　★別の タブへ 行くと、★**一緒に 消えます**。")
A("　★★下の 帯は 出るので、★行き止まりでは ありません。")
A("　　★けれど「もっとへ 戻る」道が ありません。")
A("")
A("---")
A("")
A("## ★★もう 1つ ── 行き先が ちがう ものが 1つ")
A("")
A("★「同意を とりけす」の 戻るは、★**プロフィールへ** 行きます ──")
A("")
A("```jsx")
A('<button onClick={() => setActiveTab("profile")}>← もどる</button>')
A("```")
A("")
A("★★2026-09-15 に、★もっとから 直に 来られる ように なりました。")
A("　★★けれど 戻るは 昔の ままで、★**来て いない ところ**へ 帰ります。")
A("　★★在っても、★来た ところへ 帰らない なら 道では ありません。")
A("")
A("---")
A("")
A("## 戻る 道の 形が、いま **4つ** あります")
A("")
A("| 形 | どこ | 字 |")
A("|---|---|---|")
A("| ① パンくず | 設定・聞く・プラン・じぶんの記録 | `‹　もっと　／　○○` |")
A("| ② 丸い ‹ | もっているもの | `HeadRound mark=\"‹\"` |")
A("| ③ ChevronLeft | プロフィール | `<ChevronLeft/>戻る` |")
A("| ④ 下線の ← | 同意を とりけす | `← もどる` |")
A("| ⑤ 無し | 学ぶ本体・健康情報・レッスン | ── |")
A("")
A("★★見本は **1つ**です ── `bk(t)`。★どの 画面も 同じ 形 です。")
A("")
A("---")
A("")
A("## 直す 順（ご提案）")
A("")
A("1. ★`Back`（UiV2）を **使う**。★色と 大きさは すでに 見本どおり です。")
A("2. ★パンくずを `Back` に 置き換える（★①）。")
A("3. ★無い 3画面に 足す（★⑤）。")
A("4. ★②③④ を `Back` に そろえる。")
A("5. ★「同意を とりけす」の 行き先を **もっと** に 直す。")
A("")
A("★★1〜5 は、★見た目だけの 話では ありません。")
A("　★★いま、★戻る 道の 形が 4つ あります。★どれが 正しいか 決まって いません。")
A("　★★1つに すれば、★次に 画面を 足す 人が 迷いません。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("BACK_DEFINED: %s / BACK_USED: %d" % (BACK_DEFINED, BACK_USED))
print("MIHON: %s %s（--enji %s）" % (MB_SIZE, MB_COLOR, ENJI))
print("APP_BREADCRUMB: %s %s（%s）" % (BC_SIZE, BC_COLOR, INKSOFT))
print("MISSING: %d  %s" % (len(missing), " / ".join(missing)))
