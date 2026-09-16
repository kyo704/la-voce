#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★書き出しの 約束が、★どこで どう 書かれて いるか。

  ★★出どころ　Opus（★2026-09-16・裁定）──
    「★正は No.023 の 文言。★見本を 直す。
      ★grep して ください ── 「書き出し」「無料」「いつでも」「お手元」
      ★範囲 アプリ・見本・営業資料・特商法・利用規約。
      ★食い違って いる ものを 一覧で 報告」

  ★★正しい 1文 ──
    「書き出しは いつでも 無料です。退会された あとも、
      お手元の ファイルは あなたの ものです。」

  ★★落ちて いると まずい 語が 2つ あります（★裁定の 言うとおり）──
    ★「いつでも」…… 将来にわたる 約束。★無いと「いま 無料」と 読めます。
    ★「お手元の」…… もう 手元に ある 状態。★「書き出した」は 行いを 指します。

  ★★だから この 道具は、★字が 同じかでは なく
    ★**この 2語が 揃って いるか**を 見ます。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser("~")
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-書き出しの約束のありか.md")

CANON = ("書き出しは いつでも 無料です。退会された あとも、"
         "お手元の ファイルは あなたの ものです。")

ROOTS = [
  ("アプリ・見本", ROOT),
  ("営業資料ほか", os.path.join(HOME, "Desktop", "docs:")),
  ("デスクトップ直下", os.path.join(HOME, "Desktop")),
]
SKIP_DIR = {".git", "node_modules", ".next", "dist", "build", ".vercel",
            "DCIM", "MP_ROOT", "AnyTrans.app", "ios", "capacitor-www"}
EXT = {".js", ".jsx", ".ts", ".tsx", ".md", ".txt", ".html", ".sql", ".json"}

# ★★この 道具 自身と、★その 報告は 読みません（★2026-09-16 に 1度 尻尾を 噛みました）。
SELF = {os.path.realpath(OUT), os.path.realpath(__file__)}

# ★★「書き出し」と「無料」が 同じ ところに 出る ものだけ を 拾います。
NEAR = 90


def kind(rel):
  if rel.startswith("app/legal"):
    return "★特商法・規約"
  if rel.startswith(("app/", "components/", "lib/")):
    return "★本番に 出ます"
  if "pack-final" in rel:
    return "★見本（正）"
  if "docs/opus" in rel or "_before" in rel:
    return "見本の 控え"
  if rel.startswith(("docs/reports", "docs/records")):
    return "記録（直しません）"
  if rel.startswith("docs/"):
    return "書きもの"
  return "★家の 外（営業資料など）"


hits, read, seen = [], 0, set()
for label, base in ROOTS:
  if not os.path.isdir(base):
    continue
  for dp, dns, fns in os.walk(base):
    dns[:] = [d for d in dns if d not in SKIP_DIR and not d.startswith(".")]
    if base == os.path.join(HOME, "Desktop") and dp != base:
      dns[:] = []
      continue
    for fn in fns:
      if os.path.splitext(fn)[1].lower() not in EXT:
        continue
      p = os.path.join(dp, fn)
      rp = os.path.realpath(p)
      # ★★聞かれた 範囲だけ ── アプリ・見本・営業資料・特商法・規約。
      #   ★★設計の 書きものや、★過去の 報告は 約束では ありません。
      rel0 = os.path.relpath(p, ROOT) if p.startswith(ROOT) else ""
      # ★★見張りは 約束では ありません。★約束を 見張る 側 です。
      #   ★★`components/tests/` を 入れると、★正しい 字が「食い違い」に 見えます。
      # ★★見本の 中の 裁定の 紙（.md）も 約束では ありません。★決めの 記録 です。
      if rel0 and not rel0.startswith(("app/", "components/", "lib/",
                                       "docs/design/pack-final/")):
        continue
      if rel0.startswith("components/tests/"):
        continue
      if rel0.startswith("docs/design/pack-final/") and not rel0.endswith(".html"):
        continue
      if rp in SELF or rp in seen:
        continue
      seen.add(rp)
      read += 1
      try:
        s = io.open(p, encoding="utf-8", errors="ignore").read()
      except Exception:
        continue
      # ★★★はじめの 網は 広すぎました（★2026-09-16）。
      #   ★★「書き出」と「無料」が 90字 以内に 在れば 拾って いました。
      #     ★★271件 出ました。★ほとんどが **この 話を して いる 書きもの**です。
      #       ★設計の 紙、★過去の 報告、★私の 台帳 まで 拾って いました。
      #   ★★聞かれて いるのは「★どこで **利用者に 約束して いるか**」です。
      #     ★★だから 2つ 絞ります ──
      #       ★① 覚え書き（コメント）を 外す
      #       ★② 「1つの 文の 中」に 両方 在る ものだけ
      #     ★★書きものの 中の 議論は、★約束では ありません。
      # ★★★行の 数が ずれて いました（★2026-09-16・出す 前に 捕まえました）。
      #   ★★覚え書きを 消してから 行を 数えて いました。
      #     ★★`app/legal/tokushoho/page.js:76` と 出ましたが、
      #       ★その 行には 値段が 書いて ありました。★別の ところ です。
      #   ★★人が 開く 行の 数を 出さなければ、★報告は 役に 立ちません。
      #   ★★だから、★消した 字を **同じ 長さの 空白**に 置き換えます。
      #     ★★これで 中身は 消え、★行の 数は 変わりません。
      if os.path.splitext(fn)[1].lower() in (".js", ".jsx", ".ts", ".tsx"):
        blank = lambda m: re.sub(r"[^\n]", " ", m.group(0))
        s = re.sub(r"^\s*//.*$", blank, s, flags=re.M)
        s = re.sub(r"/\*[\s\S]*?\*/", blank, s)
      for m in re.finditer(r"書き出|エクスポート|持ち出", s):
        # ★★文の 切れ目（。★や 改行）で 区切って、★その 中だけ を 見ます。
        st = max(s.rfind("。", 0, m.start()), s.rfind("\n", 0, m.start())) + 1
        en = s.find("。", m.start())
        en = (en + 1) if en >= 0 else m.start() + NEAR
        w = s[st:en]
        if len(w) > 160:
          continue
        if "無料" not in w and "無償" not in w:
          continue
        line = s[:m.start()].count("\n") + 1
        rel = os.path.relpath(p, ROOT) if p.startswith(ROOT) else p.replace(HOME, "~")
        txt = re.sub(r"\s+", " ", w).strip()
        hits.append({
          "rel": rel, "line": line, "kind": kind(rel), "text": txt,
          "itsudemo": "いつでも" in w,
          "otemoto": "お手元" in w,
          "canon": CANON.replace(" ", "") in s.replace(" ", ""),
        })

if read == 0:
  print("★★1つも 読めませんでした。★止まります。")
  sys.exit(1)

# ★★同じ 行を 2度 出しません。
uniq, key = [], set()
for h in hits:
  k = (h["rel"], h["line"])
  if k in key:
    continue
  key.add(k)
  uniq.append(h)

live = [h for h in uniq if h["kind"] in ("★本番に 出ます", "★特商法・規約")]
# ★★★裁定が 名指しした 危うさは これ です ──
#   「『無料です』だけ だと『★いま 無料』と 読める」
#   ★★だから「いつでも」が **無い** ものを 出します。
#   ★★「お手元」は 2つめの 文の 語 です。★短く 言う ところには 元から ありません。
#     ★だから それだけ では 食い違いに しません。★表には 出します。
short = [h for h in uniq if not h["itsudemo"]
         and h["kind"] not in ("記録（直しません）", "見本の 控え", "書きもの")]

L = []
A = L.append
A("# 書き出しの 約束の ありか")
A("")
A("★出どころ　Opus（2026-09-16・裁定）／★調べただけ です。1文字も 直して いません。")
A("")
A("## 正しい 1文（No.023）")
A("")
A("> " + CANON)
A("")
A("★落ちて いると まずい 語が 2つ あります ──")
A("")
A("・**いつでも** …… 将来にわたる 約束。★無いと「いま 無料」と 読めます。")
A("・**お手元の** …… もう 手元に ある 状態。★「書き出した」は 行いを 指します。")
A("")
A("★だから この 数えは、★字が 同じかでは なく **2語が 揃って いるか**を 見ます。")
A("")
A("★読んだ 紙 … %d 枚 ／ 当たった ところ … %d" % (read, len(uniq)))
A("")
A("## 本番と 法律の 紙（%d）" % len(live))
A("")
if not live:
  A("★ありません。")
else:
  A("| どこ | 行 | いつでも | お手元 | どういう 紙か |")
  A("|---|---|---|---|---|")
  for h in live:
    A("| `%s` | %d | %s | %s | %s |" % (
      h["rel"], h["line"], "○" if h["itsudemo"] else "★無",
      "○" if h["otemoto"] else "★無", h["kind"]))
A("")
A("## ★「いつでも」が 無い ところ（%d）" % len(short))
A("")
if not short:
  A("★ありません。")
for h in short:
  A("**`%s:%d`**　%s" % (h["rel"], h["line"], h["kind"]))
  A("")
  A("```")
  A(h["text"][:200])
  A("```")
  A("")
A("## 紙の 種類ごと")
A("")
g = {}
for h in uniq:
  g.setdefault(h["kind"], []).append(h)
A("| どういう 紙か | 件 |")
A("|---|---|")
for k in sorted(g):
  A("| %s | %d |" % (k, len(g[k])))
A("")
A("★★実装は 直す 必要が ありません（★裁定）。★見本は Opus が 直します。")
A("★★私からは 1文字も 直して いません。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("FILES_READ: %d  HITS: %d" % (read, len(uniq)))
print("LIVE: %d  NO_ITSUDEMO: %d" % (len(live), len(short)))
for h in short:
  print("  ★%-52s:%-5d いつでも=%s お手元=%s  [%s]" % (
    h["rel"][:52], h["line"], "○" if h["itsudemo"] else "無",
    "○" if h["otemoto"] else "無", h["kind"]))
