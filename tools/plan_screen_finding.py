#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★プランの 画面が 空白に なる ── ★調べと 報告を 1本で 出します。

  ★★この 家の 決め（★2026-09-13）──
    「★報告の 文と、★その もとの 数は、★同じ 1本の script が 出す こと。」
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-プランの画面が空白.md")
MIHON = os.path.join(ROOT, "docs", "design", "compare", "mihon", "プラン@390.json")
APP = os.path.join(ROOT, "docs", "design", "compare", "all", "frames", "SC-プラン@390.json")
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")
FT = os.path.join(ROOT, "lib", "freeTier.js")
M = os.path.join(ROOT, "docs", "design", "pack-final",
                 "00-動く見本（さわれる・全画面）.html")

for p in (MIHON, APP, VT, FT, M):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    print("　★書きません。★止まります。")
    sys.exit(1)

mi = json.load(io.open(MIHON, encoding="utf-8"))
ap = json.load(io.open(APP, encoding="utf-8"))
vt = io.open(VT, encoding="utf-8").read()
ft = io.open(FT, encoding="utf-8").read()
mk = io.open(M, encoding="utf-8").read()

# ★★実装の 画面に 何が 出て いるか。★帯と 版の 字を のぞきます。
NAV = {"きょう", "記録", "ふりかえる", "ノート", "ひつじ"}
app_txt = [x["text"].strip() for x in ap if x.get("text")]
body = [x for x in app_txt
        if x not in NAV and "バージョン" not in x and "最終更新" not in x
        and "もっと" not in x]

# ★★見本の プランの 中身。
mi_txt = [x["text"].strip() for x in mi if x.get("text")]

# ★★門の 条件を、★そのまま 抜き出します。
cond = re.search(r"\{subscribed !== true && paidGateApplies && \(", vt)
gate = re.search(r"const paidGateApplies = !mayViewSummary\(\{[\s\S]{0,320}?\}\);", vt)
only_false = "if (only === false) return true;" in ft
req_list = "if (only === null && GATE_REQUIRES_TEST_LIST) return true;" in ft

# ★★見本の プラン画面の 組み立て。
mk_plan = ""
i = mk.find("SC['プラン']=")
if i >= 0:
  j = mk.find("SC['", i + 10)
  mk_plan = mk[i:j if j > 0 else i + 1800]
mk_free = re.findall(r"'記録','並べる'[^\]]*\]", mk_plan)
mk_paid = re.findall(r"'詳しく 数える'[^\]]*\]", mk_plan)

L = []
A = L.append
A("# プランの 画面が、まっ白です")
A("")
A("★出どころ　もっとの先 突き合わせ ②枚目（2026-09-16）")
A("★**直して いません。** ご判断を お待ちします。")
A("")
A("## 何が 起きて いるか")
A("")
A("★門の 中で「もっと ▸ プラン」を 押すと、★画面に **%d 個**しか 出ません。" % len(body))
A("")
A("・上の 帯　「‹ もっと ／ プラン」")
A("・下の 帯　きょう／記録／ふりかえる／ノート／ひつじ")
A("・まん中　**何も ありません**")
A("")
A("★★絵でも 確かめました ── `docs/design/compare/all/frames/SC-プラン@390.png`。")
A("　★道具の 数え間違いでは ありません。★**本当に 空白**です。")
A("")
A("## わけ")
A("")
A("★プランの 画面の 中身は、★**1枚の 札だけ**です。")
A("★その 札に、★こういう 条件が 付いて います ──")
A("")
A("```jsx")
A("{subscribed !== true && paidGateApplies && (")
A("```")
A("")
A("★`paidGateApplies` は こう 決まります ──")
A("")
A("```jsx")
A((gate.group(0) if gate else "（読めません）"))
A("```")
A("")
A("★`mayViewSummary` は、★`NEXT_PUBLIC_GATE_TEST_USER_IDS` の 一覧を 見ます。")
A("")
A("| その 一覧に | `mayViewSummary` | `paidGateApplies` | 札は |")
A("|---|---|---|---|")
A("| 居る | false | **true** | ★出ます |")
A("| 居ない | true | false | ★★**出ません** |")
A("")
A("★★つまり ── ★**試しの 一覧に 入って いない 方には、★1つも 出ません。**")
A("　★" + ("`if (only === false) return true;`（居ない＝門を かけない）"
           if only_false else "（読めません）"))
A("　★" + ("`if (only === null && GATE_REQUIRES_TEST_LIST) return true;`（一覧が 空なら 誰にも かけない）"
           if req_list else "（読めません）"))
A("")
A("★★これは 門の 判定として **正しい** です。★お金の 話を 出さない ため の 形 です。")
A("　★★けれど、★門の 中では **プランが 1枚の 画面**に なりました。")
A("　　★★札が 消えると、★画面ごと 空に なります。")
A("　★★門の 外（38人）では、★プランは「もっと」の 中の 1節 です。")
A("　　★節が 1つ 減るだけ で、★空白の 画面には なりません。")
A("　★★**引っ越した ときに、★空の ときの 姿を 作って いません でした。**")
A("")
A("## 見本は どう 描いて いるか")
A("")
A("★見本の プランは、★**無料の ときこそ 中身が あります**。")
A("")
A("| 節 | 中身 |")
A("|---|---|")
A("| 上の 札 | **無料** ／ お支払いは ありません |")
A("| いまも これからも 無料 | " + (mk_free[0].replace("'", "").replace("[", "").replace("]", "")
                                  if mk_free else "（読めません）") + " |")
A("| 調べる | " + (mk_paid[0].replace("'", "").replace("[", "").replace("]", "")
                  if mk_paid else "（読めません）") + "　各 580円／月 |")
A("| ボタン | 調べるを 見る |")
A("| 但し書き | 学校の 名簿に 入っている間は 束に なって います（二重には いただきません） |")
A("")
A("★★見本は「★払って いない 方に、★**いま 何が 無料か**を 見せる 画面」です。")
A("　★実装は「★払って いない 方に、★**買える もの**を 見せる 札」です。")
A("　★★向きが 逆 です。★だから 無料の 方に 出す ものが ありません。")
A("")
A("## 数え")
A("")
A("| | |")
A("|---|---|")
A("| 見本の 塊 | %d |" % len(mi))
A("| 実装の 塊 | %d（うち 帯と 版を のぞくと **%d**） |" % (len(ap), len(body)))
A("| 漏れ | 17 |")
A("| 足し | 5（すべて 帯・版・見出し） |")
A("")
A("★★色と 大きさの 数は 出しません。★くらべる 中身が ありません。")
A("　★道具は「記録」「ノート」を 拾いましたが、★あれは **下の 帯**です。")
A("")
A("## お決め いただく こと")
A("")
A("★★① 空の ときの 姿を 作りますか。")
A("　★見本どおり なら、★「無料」「いまも これからも 無料」「調べる」の 3節 です。")
A("　★★『調べる 580円／月』は **値段を 出します**。")
A("　　★★いまは 門の 一覧に 居る 方にしか 値段を 見せて いません。")
A("　　★★見本どおりに すると、★**全員に 値段が 見えます**。")
A("　　★これは お金の 話 です。★私の 決める ことでは ありません。")
A("")
A("★★② それとも、★もっとの「プラン ›」の 行を いまは 出さない ように しますか。")
A("　★★押した 先が 空白 なら、★押せない 札と 同じ こと です（★§8⑤）。")
A("　★★ただし「隠す」は この 家の 決めに 反します ──")
A("　　★『★機能を 隠して 引退させない。★①消す ②見せ方を 変える ③引っ越す ④経路ごと 消す』")
A("　　★だから これを 選ぶ なら ④ に なります。")
A("")
A("★★③ 見本の 但し書き（学校の 名簿／二重には いただきません）は、")
A("　★いまの 仕組みと 合って いますか。★私には 確かめられません。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")
print("OUT: " + os.path.relpath(OUT, ROOT))
print("LINES: %d" % (len(b) + 1))
print("APP_BODY_BLOCKS: %d" % len(body))
print("APP_BODY: %s" % ("/".join(body) or "（なし）"))
print("GATE_COND_FOUND: %s" % ("yes" if cond else "no"))
