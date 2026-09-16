#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★学ぶの 画面 ── ★見本との 突き合わせ。★報告も この 1本が 出します。"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-学ぶの画面の突き合わせ.md")
MI = os.path.join(ROOT, "docs", "design", "compare", "mihon", "学ぶ@390.json")
AP = os.path.join(ROOT, "docs", "design", "compare", "all", "frames", "SC-学ぶ-中身@390.json")
LC = os.path.join(ROOT, "lib", "learnContent.js")
M = os.path.join(ROOT, "docs", "design", "pack-final",
                 "00-動く見本（さわれる・全画面）.html")

for p in (MI, AP, LC, M):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    print("　★書きません。★止まります。")
    sys.exit(1)

mi = json.load(io.open(MI, encoding="utf-8"))
ap = json.load(io.open(AP, encoding="utf-8"))
lc = io.open(LC, encoding="utf-8").read()
mk = io.open(M, encoding="utf-8").read()

mt = [x["text"] for x in mi]
at = [x["text"] for x in ap]

# ★① 章の 数と、★画面が 言って いる 数
ch = [x for x in at if re.match(r"^[▸▾]\s*\d+\s*\.", x)]
note = next((x for x in at if "章立て" in x), "")
says = re.search(r"(\d+)つの", note)
says = int(says.group(1)) if says else None

# ★② 職業の 札
mk_jobs = re.findall(r"^ '([^']+)':\[", mk[mk.index("var MANABU="):mk.index("var MANABU=") + 6000], re.M)
ap_jobs = re.findall(r'(\w+): "([^"]+)"', lc[lc.index("PROFESSION_LABELS"):lc.index("PROFESSION_LABELS") + 400])

# ★③ 章の 名
mk_ch = re.findall(r"\['(\d\. [^']+)'", mk[mk.index("var MANABU="):])[:7]
ap_ch = re.findall(r"\s+(\d+): \"([^\"]+)\"", lc[lc.index("CHAPTER_LABELS"):lc.index("CHAPTER_LABELS") + 500])

# ★④ 記事名の 書き方
mk_art = next((x for x in mt if "パッサッジョ" in x and len(x) > 10), "")
ap_art = next((x for x in at if "パッサッジョ" in x and len(x) > 10), "")

L = []
A = L.append
A("# 学ぶの 画面 ── 見本との 突き合わせ")
A("")
A("★**直して いません。** ご判断を お待ちします。")
A("")
A("## ★★① まず、★見本とは 関わりなく **画面が 自分と 食い違って** います")
A("")
A("★画面の 但し書きに、★こう 書いて あります ──")
A("")
A("> " + note)
A("")
A("★★けれど、★その 下に 出て いる 章は **%d つ** です。" % len(ch))
A("")
for c in ch:
  A("・" + c)
A("")
A("★★8・9 は「音楽家の商い」です。★見本には ありません。")
A("　★★足した ことが 悪い とは 申しません。★お決めが あったのかも しれません。")
A("　★★けれど、★**但し書きだけが 7 の ままです。**")
A("　　★読む 方は、★数えれば すぐ 分かります。")
A("　★★どちらを 直すかは、★お決め いただく ことです ──")
A("　　★㋐ 但し書きを 実際の 数に 合わせる")
A("　　★㋑ 8・9 を 学ぶから 外す（★別の ところへ 移す）")
A("")
A("---")
A("")
A("## ② 職業の 選び方 ── 形が ちがいます")
A("")
A("| | |")
A("|---|---|")
A("| 見本 | **札（pill）が 5つ** 並びます。押すと 切り替わります |")
A("| 実装 | **落ちる 一覧（select）** が 1つ。開いて 選びます |")
A("")
A("★★見本の 5つ ──")
for j in mk_jobs[:5]:
  A("・" + j)
A("")
A("★★実装の 5つ（`lib/learnContent.js` の `PROFESSION_LABELS`）──")
for k, v in ap_jobs[:5]:
  A("・%s（`%s`）" % (v, k))
A("")
A("★★**字も ちがいます。** 同じ ものを 指して いますが、★読む 字が 別 です ──")
A("")
A("| 見本 | 実装 |")
A("|---|---|")
A("| 声楽・ミュージカル | 声楽家・ミュージカル |")
A("| からだ（どの 仕事でも） | からだ（全職業共通） |")
A("| ポップス・ロック | ポップス／ロック |")
A("")
A("★★「全職業共通」は、★この 家の ことばづかいでは ありません。")
A("　★見本は「どの 仕事でも」と 書きます。★やさしい ほうの 字 です。")
A("")
A("---")
A("")
A("## ③ 章の 開き方 ── 見本は 1つ、★実装は 全部")
A("")
A("★見本は `S.open` を 1つだけ 持ちます。★押した 章が 開き、★ほかは 閉じます。")
A("★実装は **%d 章 すべてが 開いた まま** です。" % len(ch))
A("")
A("★★だから 縦に 長く なります ── ★実装の 画面は **15,405px**（撮った 絵）。")
A("　★見本は 729px です。★中身の 数が ちがう ので、★そのまま くらべられません。")
A("　★★けれど「1つだけ 開く」なら、★近く なります。")
A("")
A("---")
A("")
A("## ④ さがす ── 置き場所が ちがいます")
A("")
A("| | |")
A("|---|---|")
A("| 見本 | 右上の **🔍**。押すと 1枚（`SH['manabuSagasu']`）が 上がります |")
A("| 実装 | 画面の 中の **入力欄**（「記事を検索（例：パッサッジョ）」） |")
A("")
A("★★見本の 1枚には、★実装に 無い ものが 2つ あります ──")
A("・★言葉の 札（逆流／睡眠／湿度／パッサッジョ／支え／受診）")
A("・★但し書き「学術用語の 正式名は、この『学ぶ』の 記事の中だけに 置きます」")
A("")
A("---")
A("")
A("## ⑤ 章見出しの 数字に、★余分な 空白")
A("")
A("★実装 …「▾ 1 . この仕事の声」　★見本 …「1. この仕事の声」")
A("")
A("★★`1` と `.` の あいだに 空白が 入って います。★組み立ての 都合 かと 思われます。")
A("")
A("---")
A("")
A("## ⑥ 記事名の 書き方が そろって いません")
A("")
A("| | |")
A("|---|---|")
A("| 見本 | `%s` |" % mk_art)
A("| 実装 | `%s` |" % ap_art)
A("")
A("★ちがいは 2つ です ──")
A("")
A("・区切りの 線 … 見本 `──`（U+2500 が 2つ）／実装 `―`（U+2015 が 1つ）")
A("・分かち書き … 見本「声区と パッサッジョ」／実装「声区とパッサッジョ」")
A("")
A("★★この 家は 分かち書きを します。★読みやすさの ため です。")
A("　★★記事の 名は **67本** あります。★直すなら まとめて です。")
A("　★`docs/learn-content/articles.json` から 作られて います。")
A("　★★`lib/learnContent.js` を 直しても、★次の 作り直しで 戻ります。")
A("")
A("---")
A("")
A("## ⑦ 章の 名が 1つ ちがいます")
A("")
A("| | 見本 | 実装 |")
A("|---|---|---|")
for i in range(min(7, len(mk_ch), len(ap_ch))):
  a = mk_ch[i]
  b = ap_ch[i][1]
  mark = "★" if a.split(". ", 1)[-1] != b else ""
  A("| %d | %s | %s%s |" % (i + 1, a.split(". ", 1)[-1], b, mark))
A("")
A("---")
A("")
A("## ⑧ 但し書きが 畳まれて いません")
A("")
A("★見本は `.note` を すべて 畳みます（★`foldNotes`）。")
A("★★「くわしい 決まりを 見る」が、★この 画面には ありません。")
A("　★プランの 画面では 直しました（★`<Note fold>`）。★同じ ことです。")
A("")
A("---")
A("")
A("## 数え")
A("")
A("| | |")
A("|---|---|")
A("| 見本の 塊 | %d |" % len(mi))
A("| 実装の 塊 | %d |" % len(ap))
A("| 漏れ | 20 |")
A("| 足し | 88 |")
A("")
A("★★足しの 88 は、★ほとんどが **記事**です。")
A("　★見本は 見本の ぶんだけ、★実装は 67本 持って います。")
A("　★★これは 不足では ありません。★くらべられない ところ です。")
A("")
A("---")
A("")
A("## 決めて いただく こと")
A("")
A("1. ★★但し書きの「7つ」と、★出て いる 9章 ── ★どちらに 合わせますか。")
A("2. 職業を 札（pill）に しますか。★いまは 落ちる 一覧です。")
A("3. 職業の 字を 見本に 合わせますか（「全職業共通」→「どの 仕事でも」）。")
A("4. 章は 1つずつ 開く 形に しますか。")
A("5. さがすを 🔍 の 1枚に 移しますか。")
A("6. 記事名の 分かち書きと 線を そろえますか（★67本・`articles.json` から）。")
A("")
A("★★①だけは、★見本と 関わりなく **いま 食い違って** います。")
A("　★ほかは 見本との ちがい です。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("LINES: %d" % (len(b) + 1))
print("CHAPTERS_SHOWN: %d" % len(ch))
print("NOTE_SAYS: %s" % says)
print("CONTRADICTION: %s" % ("yes" if says and says != len(ch) else "no"))
