#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本の 紙が、★どこに いくつ あるか。★取り残しを 出さない ため。

  ★★出どころ　Opus（★2026-09-16）──
    「★docs/design/ 配下に、★他にも 見本ファイルが 無いか 確認して ください。
      ★全部 一覧で 出して ください。★また 取り残しが 起きない ように」

  ★★名前だけ で 探しません。★**中身**でも 探します。
    ★★`00-動く見本…` という 名でない 写しが、★家の 外に いくつも あります
      （★`動く見本.html`／`動く見本_1.html`／…）。
    ★★だから「`SC[` と `SH[` を 持つ HTML」を 見本と 見ます。
      ★★これなら、★名を 変えられても 見つかります。
"""

import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser("~")
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-見本の紙の一覧.md")

ROOTS = [ROOT, os.path.join(HOME, "Desktop")]
SKIP = {".git", "node_modules", ".next", "dist", "build", ".vercel",
        "DCIM", "MP_ROOT", "AnyTrans.app", "ios", "capacitor-www"}

found, seen = [], set()
for base in ROOTS:
  if not os.path.isdir(base):
    continue
  for dp, dns, fns in os.walk(base):
    dns[:] = [d for d in dns if d not in SKIP and not d.startswith(".")]
    for fn in fns:
      if not fn.lower().endswith(".html"):
        continue
      p = os.path.join(dp, fn)
      rp = os.path.realpath(p)
      if rp in seen:
        continue
      seen.add(rp)
      try:
        s = io.open(p, encoding="utf-8", errors="ignore").read()
      except Exception:
        continue
      # ★★★「動く見本」の 見分け方を 広げました（★2026-09-16）。
      #   ★★はじめ `SC['` と `SH['` の **両方**を 求めました。
      #     ★★4本の うち **2本しか** 出ません でした。
      #     ★★`PC・iPad（個人）` と `（運営）` は、★その 書き方を して いません
      #       （★`SC[` が 0件。★画面を 別の 形で 持って います）。
      #   ★★取り残しを 探す 道具が、★取り残して いました。
      #     ★★同じ 過ちです ── ★「自分の 数え方に 合う ものだけ」を 数えて いました。
      #   ★★だから、★見分け方を 3つに します。★どれか 1つで 通します。
      is_mihon = (
        re.search(r"SC\['", s)                      # ★さわれる・iPhone の 形
        or "動く見本" in fn                           # ★名で 分かる もの
        or (re.search(r"function (draw|toast)\b", s)  # ★同じ 仕掛けを 持つ もの
            and re.search(r"<style", s) and len(s) > 50000)
      )
      if not is_mihon:
        continue
      st = os.stat(p)
      rel = os.path.relpath(p, ROOT) if p.startswith(ROOT) else p.replace(HOME, "~")
      sc = len(set(re.findall(r"SC\['([^']*)'\]=", s)))
      sh = len(set(re.findall(r"SH\['([^']*)'\]=", s)))
      # ★★きょうの 処置が 当たって いるか（★4つの 印）。
      # ★★★数だけ で 探すと、★取りちがえます（★Opus の ご注意・2026-09-16）。
      #
      #   ★★私は「4,800円が 無い」を、★運営の 見本にも 出して いました。
      #     ★★4,800円は **個人の 年額**です。★学校の 紙に 無くて 当たり前 です。
      #   ★★同じ 形で、★「9,800円」を 誤りと 疑いかけました。
      #     ★★あれは **学校の 月額の 下限**（★2026-09-13 改定）です。★正しい 数 です。
      #   ★★「12,800円」も 2つの 意味を 持ちます ──
      #     ★個人の「一年の よそおい」と、★学校の 旧・下限。
      #   ★★だから、★数を 見る ときは **どちらの 紙か**を 先に 見ます。
      is_ops = "運営" in fn
      marks = {
        "組版": "--sp1" in s or "letter-spacing:.02em" in s,
        "動き": "prefers-reduced-motion" in s,
        # ★個人の 年額。★学校の 紙には 出ません。★だから 学校の 紙では 見ません。
        "4800": True if is_ops else ("4,800円" in s),
        "束なし": "束に なって" not in s,
        "いつでも": ("書き出し" not in s) or ("いつでも" in s),
      }
      found.append({
        "rel": rel, "bytes": st.st_size, "mtime": st.st_mtime,
        "sc": sc, "sh": sh, "marks": marks,
        "live": rel.startswith("docs/design/pack-final/"),
      })

if not found:
  print("★★1つも 見つかりません。★止まります。")
  sys.exit(1)

import time
found.sort(key=lambda x: (not x["live"], x["rel"]))

L = []
A = L.append
A("# 見本の 紙の 一覧")
A("")
A("★出どころ　Opus（2026-09-16）「また 取り残しが 起きない ように」")
A("")
A("★★名前では なく **中身**で 探しました ── ★`SC[` と `SH[` を 持つ HTML。")
A("　★★名を 変えられても 見つかります（★家の 外に `動く見本_1.html` などが あります）。")
A("")
A("★見つかった … %d 本" % len(found))
A("")
A("## ★正（`docs/design/pack-final/`）")
A("")
A("| 紙 | 画面 | 板 | 更新 | 組版 | 動き | 4,800 | 束なし | いつでも |")
A("|---|---|---|---|---|---|---|---|---|")
for f in found:
  if not f["live"]:
    continue
  m = f["marks"]
  A("| `%s` | %d | %d | %s | %s | %s | %s | %s | %s |" % (
    os.path.basename(f["rel"]), f["sc"], f["sh"],
    time.strftime("%m/%d %H:%M", time.localtime(f["mtime"])),
    "○" if m["組版"] else "★無", "○" if m["動き"] else "★無",
    "○" if m["4800"] else "★無", "○" if m["束なし"] else "★無",
    "○" if m["いつでも"] else "★無"))
A("")
behind = [f for f in found if f["live"] and not all(f["marks"].values())]
A("### ★★処置が 当たって いない 正の 紙（%d）" % len(behind))
A("")
if not behind:
  A("★ありません。")
for f in behind:
  miss = [k for k, v in f["marks"].items() if not v]
  A("・**`%s`** …… ★足りない 印 … %s" % (os.path.basename(f["rel"]), "／".join(miss)))
A("")
A("## そのほか（控え・家の 外）")
A("")
A("| 紙 | 画面 | 更新 |")
A("|---|---|---|")
for f in found:
  if f["live"]:
    continue
  A("| `%s` | %d | %s |" % (f["rel"], f["sc"],
    time.strftime("%m/%d %H:%M", time.localtime(f["mtime"]))))
A("")
A("★★控えは 直す 必要が ありません。★過去の 姿 です。")
A("★★けれど「どれが 正か」を 迷わせます。★正は `docs/design/pack-final/` の ぶん だけ です。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("FOUND: %d（正 %d ／ ほか %d）"
      % (len(found), sum(1 for f in found if f["live"]),
         sum(1 for f in found if not f["live"])))
for f in found:
  if f["live"]:
    miss = [k for k, v in f["marks"].items() if not v]
    print("  %-46s SC%-3d SH%-3d %s" % (
      os.path.basename(f["rel"])[:46], f["sc"], f["sh"],
      ("★足りない: " + "／".join(miss)) if miss else "○"))
