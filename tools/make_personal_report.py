#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★個人の 6画面の 見比べの 報告を、★測った 字から 組み立てます（★2026-09-26）。

★★★手で 書きません ── ★台帳「報告は、★数を 出した 同じ 走りが 書く」。
★★使い方  python3 tools/make_personal_report.py <走りの 出た 所> <出す 紙>
"""
import io, os, re, sys, json

def 読む(p):
  return io.open(p, encoding="utf-8").read()

def 組(本):
  出 = {"①": [], "②": [], "③": [], "④": [], "⑤": [], "共通": []}
  いま = None
  for l in 本.split("\n"):
    if l.startswith("■ ① "): いま = "①"; continue
    if l.startswith("■ ② "): いま = "②"; continue
    if l.startswith("■ ③ "): いま = "③"; continue
    if l.startswith("■ ④ "): いま = "④"; continue
    if l.startswith("■ ⑤ "): いま = "⑤"; continue
    if l.startswith("■ ★共通"): いま = "共通"; continue
    if l.startswith("★絵") or l.startswith("RESULT"): いま = None; continue
    if いま and l.startswith("    ") and not l.startswith("      "):
      出[いま].append(l.strip())
  m = re.search(r"^RESULT: (.+)$", 本, re.M)
  出["結"] = m.group(1) if m else "（出ません）"
  m2 = re.search(r"見本 …… (\d+) 塊 ／ 実機 …… (\d+) 塊", 本)
  出["数"] = (int(m2.group(1)), int(m2.group(2))) if m2 else (0, 0)
  return 出

def main():
  元, 先 = sys.argv[1], sys.argv[2]
  名一覧 = [f[4:-4] for f in sorted(os.listdir(元)) if f.startswith("fin_") and f.endswith(".txt")]
  行 = []
  行.append("# ★個人の 画面の 見比べ ── ★2026-09-26")
  行.append("")
  行.append("★この 紙は `tools/make_personal_report.py` が、")
  行.append("★`tools/dom_compare_personal.js` の 走りの 出た 字 から 組み立てました。")
  行.append("★手で 書いた ところは ありません。")
  行.append("")
  行.append("## ★まとめ")
  行.append("")
  行.append("| 画面 | 結 | ①見本だけ | ②実機だけ | ③わざと | ④足した | ⑤種ちがい | 共通で 落とした |")
  行.append("|---|---|---|---|---|---|---|---|")
  中身 = {}
  for n in 名一覧:
    d = 組(読む(os.path.join(元, "fin_%s.txt" % n)))
    中身[n] = d
    行.append("| %s | %s | %d | %d | %d | %d | %d | %d |" % (
      n, d["結"], len(d["①"]), len(d["②"]), len(d["③"]), len(d["④"]),
      len(d["⑤"]), len(d["共通"])))
  行.append("")
  for n in 名一覧:
    d = 中身[n]
    行.append("## ★%s" % n)
    行.append("")
    行.append("★塊の 数 …… 見本 %d ／ 実機 %d　★結 …… %s" % (d["数"][0], d["数"][1], d["結"]))
    行.append("")
    for k, 題 in (("①", "★見本に あって 実機に 無い"),
                  ("②", "★実機に あって 見本に 無い"),
                  ("③", "★見本に 在るが わざと 出して いない"),
                  ("④", "★実機に 在って 見本に 無い（わけ あり）"),
                  ("⑤", "★種が 違う だけ（★入れる 種を 書いて あります）"),
                  ("共通", "★どの 画面にも 付く もの として 落とした")):
      行.append("### %s %s（%d）" % (k, 題, len(d[k])))
      行.append("")
      if not d[k]:
        行.append("★ありません。")
      else:
        for x in d[k]: 行.append("- `%s`" % x)
      行.append("")
  io.open(先, "w", encoding="utf-8").write("\n".join(行) + "\n")
  print("★書きました …… %s（%d行）" % (先, len(行)))

if __name__ == "__main__":
  sys.exit(main())
