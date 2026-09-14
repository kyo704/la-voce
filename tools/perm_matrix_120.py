#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# A3 ★10役職 × 12画面 ＝ 120通り
#
#   ★出どころ tools/perm-matrix.js（2026-09-10）を そのまま 移した もの。
#     ★★理屈は 1つも 変えて いません。★数も 120の まま です。
#     ★★60（★実在する 6画面）に しません ──
#       ★安全管理の 書類に 120と 書いて ある ため、★変えると 別の 食い違いに なります。
#
#   ★★判定そのものは lib に 尋ねます（★node に 渡します）。
#     ★★Python の 側に 写すと、★同じ 決めごとが 2か所に なります。
#     ★★この家が いちばん 繰り返して きた 不具合の 形です。
#
#   使い方  python3 tools/perm_matrix_120.py
# ============================================================================

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
MIHON = os.path.join(ROOT, "docs", "design", "pack-final",
                     "00-動く見本（さわれる・全画面）.html")

SCREENS = [
  ("home", "ホーム", None),
  ("schedule", "日程", ["sched_all", "sched_mine"]),
  ("roster", "名簿", ["meibo"]),
  ("events", "行事", ["gyoji"]),
  ("threads", "連絡", ["renraku_all", "monka_write"]),
  ("settings", "設定", ["master", "koma"]),
  ("attend", "出欠つけ", ["shukketsu"]),
  ("monka", "門下", ["monka_write"]),
  ("bill", "ご請求", ["bill"]),
  ("pay", "支払い方法", ["bill_pay"]),
  ("post", "役職を変える", ["post"]),
  ("koma", "コマを決める", ["koma", "koma_mine"]),
]

ASK = r"""
const fs = require("fs");
const path = require("path");
// ★★2026-09-13、★引数で 渡して いて ENAMETOOLONG に なりました。
//   ★`node -e` の `--` の あとの 並びが、★思った 場所に 来ません。
//   ★★だから 中身は 標準入力から 受け取ります。
const ROOT = process.env.WS_ROOT;
const strip = (p) => fs.readFileSync(path.join(ROOT, p), "utf8")
  .replace(/^export /gm, "").replace(/import[^\n]*\n/g, "");
const permsSrc = strip("lib/opsPerms.js");
const shellSrc = strip("lib/opsShell.js");
const P = new Function(permsSrc
  + "; return { tabsForPerms, maySeeBill, mayPay };")();
const S = new Function(permsSrc + "\n" + shellSrc
  + "; return { tabsFor, maySeeMoney, mayEditRoster };")();
const input = JSON.parse(fs.readFileSync(0, "utf8"));
const out = input.map((row) => ({
  base: row.base,
  tabsByRole: S.tabsFor(row.base).map((t) => t.key),
  tabsByPerm: S.tabsFor(row.perms).map((t) => t.key),
  seeMoneyRole: S.maySeeMoney(row.base),
  editRosterRole: S.mayEditRoster(row.base),
  seeBillPerm: P.maySeeBill(row.perms),
  payPerm: P.mayPay(row.perms)
}));
process.stdout.write(JSON.stringify(out));
"""


def read_mihon():
  with open(MIHON, encoding="utf-8") as f:
    src = f.read()
  i = src.index("var PERM=[")
  body = src[i:src.index("];", i)]
  perm = [{"key": m[0], "label": m[1], "wide": m[2] == "1"}
          for m in re.findall(r"\['([a-z_]+)','([^']+)',([01])\]", body)]
  j = src.index("var POSTS=[")
  body2 = src[j:src.index("];", j)]
  posts = []
  for m in re.finditer(r"\{n:'([^']+)',base:'([a-z]+)',p:\{([^}]*)\}\}", body2):
    posts.append({"name": m.group(1), "base": m.group(2),
                  "perms": set(re.findall(r"([a-z_]+):1", m.group(3)))})
  return perm, posts


def ask_lib(posts):
  payload = json.dumps([{"base": p["base"], "perms": sorted(p["perms"])} for p in posts])
  env = dict(os.environ, WS_ROOT=ROOT)
  r = subprocess.run(["node", "-e", ASK], input=payload,
                     capture_output=True, text=True, env=env)
  if r.returncode != 0:
    raise SystemExit("lib に 尋ねられません:\n" + r.stderr[:400])
  return json.loads(r.stdout)


def main():
  perm, posts = read_mihon()
  lib = ask_lib(posts)

  rows = []
  for p, L in zip(posts, lib):
    for key, label, need in SCREENS:
      want = True if need is None else any(k in p["perms"] for k in need)
      if key in ("bill", "pay"):
        have = L["seeMoneyRole"]
      elif key == "roster":
        have = "roster" in L["tabsByRole"]
      elif key == "attend":
        have = "schedule" in L["tabsByRole"]
      elif key == "monka":
        have = p["base"] == "teacher"
      elif key in ("post", "koma"):
        have = L["editRosterRole"]
      else:
        have = key in L["tabsByRole"]

      if key == "bill":
        after = L["seeBillPerm"]
      elif key == "pay":
        after = L["payPerm"]
      elif key == "roster":
        after = "roster" in L["tabsByPerm"]
      elif key == "attend":
        after = "shukketsu" in p["perms"]
      elif key == "monka":
        after = "monka" in L["tabsByPerm"]
      elif key == "post":
        after = "post" in p["perms"]
      elif key == "koma":
        after = ("koma" in p["perms"]) or ("koma_mine" in p["perms"])
      else:
        after = key in L["tabsByPerm"]

      rows.append({"post": p["name"], "base": p["base"], "screen": label,
                   "want": want, "have": have, "after": after,
                   "leak": (not want) and have})

  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  say("# A3 ★10役職 × 12画面 ＝ %d通り" % len(rows))
  say()
  say("★この 紙は tools/perm_matrix_120.py が 書き出します。★手で 書いて いません。")
  say()
  say("★見本の できこと %d ／ 役職 %d ／ 画面 %d" % (len(perm), len(posts), len(SCREENS)))
  say()
  say("★★判定は lib に 尋ねて います（★node 経由）。")
  say("　★★Python の 側に 写すと、★同じ 決めごとが 2か所に なります。")
  say()
  say("```")
  head = "役職".ljust(6) + "もと".ljust(9)
  head += "".join(s[1][:3].ljust(5) for s in SCREENS)
  say(head)
  for p in posts:
    line = ""
    for _k, label, _n in SCREENS:
      r = next(x for x in rows if x["post"] == p["name"] and x["screen"] == label)
      mark = "★漏" if r["leak"] else (("○" if r["want"] else "・")
                                      if r["want"] == r["have"] else "✕")
      line += mark.ljust(5)
    say(p["name"].ljust(6) + p["base"].ljust(9) + line)
  say("```")
  say()
  say("★○＝見本も実装も 出す ／ ・＝どちらも 出さない ／ ✕＝食い違い ／ ★漏＝実装が よけいに 出す")
  say()

  bad = [r for r in rows if r["want"] != r["have"]]
  leak = [r for r in bad if r["leak"]]
  say("## ★いま（★名前の ちからで 決めて いる）")
  say()
  say("- 食い違い **%d 通り**／全 %d 通り" % (len(bad), len(rows)))
  say("- うち **★漏れ %d 通り**（★見本は だめ、実装は 出す）" % len(leak))
  say()
  by = {}
  for r in bad:
    by.setdefault(r["screen"], []).append(r["post"] + ("（漏）" if r["leak"] else ""))
  for sc, who in by.items():
    say("- %s: %s" % (sc, "・".join(who)))
  say()

  bad2 = [r for r in rows if r["want"] != r["after"]]
  leak2 = [r for r in bad2 if (not r["want"]) and r["after"]]
  say("## ★★できことで 決めたら")
  say()
  say("- 食い違い **%d 通り**（うち 漏れ %d 通り）" % (len(bad2), len(leak2)))
  say()
  if not bad2:
    say("★★1通りも 食い違いません。")
    say("　★★A13（サーバの 決まりを has_can へ 移す）は、")
    say("　★★好みの 話では ありません。★数字が そう 言って います。")
  else:
    by2 = {}
    for r in bad2:
      by2.setdefault(r["screen"], []).append(r["post"])
    for sc, who in by2.items():
      say("- %s: %s" % (sc, "・".join(who)))
  say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★見本と 実装の 判定を くらべて います。")
  say("　★★実際に 画面を 開いて いません。★台帳の 決まりも 見て いません。")
  say("★★12画面は 見本の ぶんです。★実装に ある Ops の 部品は 6つ です。")
  say("　★★数を 60に しません。★安全管理の 書類が 120と 言って いる ため。")

  p = os.path.join(OUT, "2026-09-13-A3-120通り.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print()
  print("docs/reports/2026-09-13-A3-120通り.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
