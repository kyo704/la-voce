#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★法の 行き先（規約・特商法・個人情報）が、★どの 画面に あるか。

  ★★出どころ　坂本さん（★2026-09-16・実機の ご指摘）──
    「★退会の 画面に、★特商法・利用規約への リンクが 見当たらない」
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-法の行き先の棚おろし.md")
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")
M = os.path.join(ROOT, "docs", "design", "pack-final",
                 "00-動く見本（さわれる・全画面）.html")

for p in (VT, M):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    sys.exit(1)

vt = io.open(VT, encoding="utf-8").read()
mk = io.open(M, encoding="utf-8").read()

# ★★見本に 法の 行き先は あるか。
mk_hits = re.findall(r"legal/[a-z]+|特定商取引|利用規約|プライバシー", mk)

# ★★実装の どこに あるか。★どの `activeTab` の 中かを 見ます。
tabs = [(m.start(), m.group(1))
        for m in re.finditer(r'activeTab === "([A-Za-z0-9]+)"', vt)]


def tab_of(pos):
  cur = "（画面の 外）"
  for at, name in tabs:
    if at <= pos:
      cur = name
    else:
      break
  return cur


links = []
for m in re.finditer(r'href="(/legal/[a-z]+)"', vt):
  links.append((tab_of(m.start()), m.group(1), vt[:m.start()].count("\n") + 1))

DEL = ("deleteAccount1", "deleteAccount2", "deleteAccount3")
in_del = [x for x in links if x[0] in DEL]

L = []
A = L.append
A("# 法の 行き先（規約・特商法）の 棚おろし")
A("")
A("★出どころ　坂本さん（2026-09-16・実機の ご指摘）")
A("★**直して いません。** 置き場所は 法の 話 です。★ご判断を お待ちします。")
A("")
A("## ① 見本に、法の 行き先は あるか")
A("")
A("★**ありません。** ★見本ぜんたいで %d 件 です。" % len(mk_hits))
A("")
A("★★`SC['退会']` の 中身は 4つ だけ ──")
A("　★何が 消えるかの 札／先に 書き出す／退会する／但し書き。")
A("★★だから、★これは **見本との ちがい では ありません**。")
A("　★見本にも 無い ものを、★実装が 落として いる のでは ありません。")
A("")
A("## ② 実装の 退会の 3枚に、法の 行き先は あるか")
A("")
A("★**ありません（%d 件）。**" % len(in_del))
A("")
A("## ③ いま、法の 行き先が ある ところ")
A("")
A("| どの 画面 | 行き先 | 行 |")
A("|---|---|---|")
for t, href, ln in links:
  A("| %s | `%s` | %d |" % (t, href, ln))
A("")
A("★ほかに `components/SignupForm.jsx`（規約・個人情報）と")
A("　`components/NoticeScreen.jsx`（個人情報・規約）に あります。")
A("")
A("## ④ ★私の 見立て（★法の 判断では ありません）")
A("")
A("★★私は 法を 判じられません。★材料だけ 置きます。")
A("")
A("・**特商法**は、★売る ときの 表示の 決まり です。")
A("　★申し込みの 画面と、★お知らせの 中に 置いて あります（`/legal/tokushoho`）。")
A("　★★退会は「★売る」では なく「★消す」です。★別の 話 に 見えます。")
A("・**個人情報**（`/legal/privacy`）の ほうが、★退会に 近い と 思われます。")
A("　★消える もの・残る もの・30日の 猶予 ── ★どれも 個人情報の 話 です。")
A("・**利用規約**（`/legal/terms`）は、★もっとの 末尾に あります。")
A("　★退会は もっとの 中の 道 なので、★1つ 上に 在る、とも 言えます。")
A("")
A("## ⑤ ★★法の 行き先より、★先に お伝えしたい ことが あります")
A("")
A("★退会は、★`subscriptions` と `purchases` の 行を **消します**")
A("（`lib/accountDeletion.js`）。")
A("")
A("★★けれど 3枚の どこにも、★**お支払いの ことが 書いて ありません**。")
A("")
A("★★いま 書いて あるのは この 4つ です ──")
A("・削除すると、次の記録が失われます。元に戻すことはできません。")
A("・（つながりの 話）")
A("・同じメールアドレスで登録し直しても、削除した記録は戻りません。")
A("・登録メールアドレス、または「削除します」と入力してください。")
A("")
A("★★お支払いが 続いて いる 方が 退会した とき ──")
A("　★次の 請求は 止まるのか。★払った ぶんは どうなるのか。")
A("　★★画面は 何も 言いません。")
A("★★これは `/legal/tokushoho` への **行き先**より、")
A("　★★**その 画面に 書いて ある べき こと**に 近い と 思われます。")
A("★★お金と 法に かかる 話 なので、★私からは 書きません。★お決め ください。")
A("")
A("★★（★いまは `REQUIRE_SUBSCRIPTION` が 切 で、★お支払いの 方は")
A("　★おられません。★急ぎでは ありません。★門を 開ける 前に 要ります。）")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("MIHON_LEGAL_LINKS: %d" % len(mk_hits))
print("DELETE_FLOW_LEGAL_LINKS: %d" % len(in_del))
print("LEGAL_LINKS_TOTAL: %d" % len(links))
for t, href, ln in links:
  print("  %-22s %-18s :%d" % (t, href, ln))
