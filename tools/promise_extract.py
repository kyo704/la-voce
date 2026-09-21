#!/usr/bin/env python3
# ★約束の台帳 ── 見本が利用者に約束している文を、4本から拾います（裁定159 §5）
#
#   ★★★守られているかは、ここでは見ません（次の仕事です）。
#     ★★拾うのは「約束の文」と「どこに書いてあるか」だけです。
#
#   ★★何を約束の文とするか
#     ★① 「〜ません」で終わる（しない、という約束）
#     ★② 「残ります」「消せません」「伝わります」「お見せします」など、
#          ★する、という約束（裁定159 §5 が名ざした形）
#   ★★HTML の札の中身だけを見ます。JavaScript の変数名や関数名は拾いません。
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIHON = [
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本-PC・iPad（運営）.html",
  "00-動く見本-PC・iPad（個人）.html",
]

# ★する、という約束（裁定159 §5 の 例に ならいます）。
SURU = ["残ります", "消せません", "伝わります", "お見せします", "お返しします",
        "お知らせします", "届きます", "残します", "守ります"]

def 文に割る(t):
  # ★句点で割ります。★「〜ません。」の 1文ずつ 見ます。
  return [s.strip() for s in re.split(r"(?<=[。！])", t) if s.strip()]

def 約束か(s):
  if len(s) < 6 or len(s) > 120:
    return None
  if re.search(r"ませ(ん|ぬ)[。！]?$", s):
    return "しない"
  for w in SURU:
    if w in s:
      return "する"
  return None

def main():
  出 = []
  # ★★★約束は「注記」の 中に あります（★見本の 決まった 印）。
  #   ★★`note` ／ `warn` ／ `usu` ／ `wl` ── ★dom_compare.js と 同じ 印 です。
  #   ★★★はじめ 1行ずつ 拾いました。★751件 出ました。
  #     ★★JavaScript の かけら（`$('#offbar')…`・`'}).join('')`）や、
  #       ★見本の 作りもの（「10月5日 学園祭 216人に 届きます」）が 混ざりました。
  #     ★★★約束では ない ものを 台帳に 入れると、★埋める 人が 迷います。
  印 = re.compile(
    r'class\s*=\s*["\']([^"\']*\b(?:note|warn|usu|wl)\b[^"\']*)["\'][^>]*>(.*?)</div>',
    re.S)

  for name in MIHON:
    p = ROOT / "docs/design/pack-final" / name
    if not p.exists():
      raise SystemExit("★止まりました ── 見本がありません: " + name)
    raw = p.read_text(encoding="utf-8")
    行頭 = [0]
    for ch in raw:
      行頭.append(行頭[-1] + (1 if ch == "\n" else 0))
    for m in 印.finditer(raw):
      行 = raw.count("\n", 0, m.start()) + 1
      t = m.group(2)
      t = re.sub(r"<[^>]+>", " ", t)
      t = html.unescape(t)
      # ★JavaScript の 継ぎ目（'…'+ 何か +'…'）は「#」に ならします。
      t = re.sub(r"['\"]\s*\+[^+]{0,80}?\+\s*['\"]", "#", t)
      t = t.replace("\\n", " ")
      t = re.sub(r"\s+", " ", t)
      for s2 in 文に割る(t):
        s2 = s2.strip(" '\"+;,")
        # ★継ぎ目の 印（#）が 頭や 途中に 並ぶ ことが あります。★ならします。
        s2 = re.sub(r"^[#\s]+", "", s2)
        s2 = re.sub(r"#\s*#+", "#", s2).strip()
        # ★かけら を 入れません ── ★印や 括弧が 残って いる もの。
        if re.search(r"[<>{}]|\)\s*\.|\.join\(|innerHTML|function\s*\(", s2):
          continue
        # ★三項の 途中で 切れた かけら（`(own||free?'…`）を 入れません。
        #   ★★括弧や 変数が 頭に 残って いる ものは、文では ありません。
        if re.search(r"^[(\[]|\|\||\?\s*'|[A-Za-z_$][\w.$]*\s*\(", s2):
          continue
        kind = 約束か(s2)
        if kind:
          出.append({"約束": s2, "種": kind, "見本": name, "行": 行})

  # ★同じ 約束が 何本にも 出ます。★文で まとめ、★出どころを 並べます。
  まとめ = {}
  for r in 出:
    k = r["約束"]
    まとめ.setdefault(k, {"約束": k, "種": r["種"], "出どころ": []})
    まとめ[k]["出どころ"].append(f'{r["見本"]}:{r["行"]}')
  並び = sorted(まとめ.values(), key=lambda x: (x["種"], x["約束"]))

  みち = ROOT / "docs/ledgers/09-約束の台帳.md"
  with みち.open("w", encoding="utf-8") as f:
    f.write("# 09 約束の台帳（裁定159 §5）\n\n")
    f.write("この紙は `tools/promise_extract.py` が書きました。手で足していません。\n\n")
    f.write("見本が利用者に約束している文です。**守られているかは、ここでは見ていません。**\n")
    f.write("「守る処理」の欄は空です。1行ずつ Code が埋めます。\n\n")
    f.write(f"拾った約束 …… **{len(並び)}** 件")
    f.write(f"（しない {sum(1 for x in 並び if x['種'] == 'しない')}")
    f.write(f" ／ する {sum(1 for x in 並び if x['種'] == 'する')}）\n\n")
    f.write("| # | 種 | 約束の文言 | 出典（見本:行） | 守る処理 |\n")
    f.write("|---|---|---|---|---|\n")
    for n, x in enumerate(並び, 1):
      出典 = " ／ ".join(x["出どころ"][:3])
      if len(x["出どころ"]) > 3:
        出典 += f" ほか{len(x['出どころ']) - 3}"
      文 = x["約束"].replace("|", "｜")
      f.write(f"| {n} | {x['種']} | {文} | {出典} | |\n")
  print("REPORT: " + str(みち.relative_to(ROOT)))
  print(f"約束 {len(並び)} 件（しない {sum(1 for x in 並び if x['種']=='しない')}"
        f" ／ する {sum(1 for x in 並び if x['種']=='する')}）／ 拾った行 {len(出)}")

if __name__ == "__main__":
  main()
