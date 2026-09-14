#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★いま 確かめられない ことを、★はっきり 書き出す（★No.013 ITEM_4）。

  ★出どころ 2026-09-14、★坂本さん
    ★「見本の HTML で 確かめられるのは **色 だけ**。
      ★作りの 不具合は、★動く アプリでないと 分からない」

  ★★だから、★何が 足りないかを 機械で 数えて 出します。
    ★① アプリを 動かすのに 要る 環境変数 … コードが 読んで いる ものを 全部
    ★② いま 手もとに あるか
    ★③ 画面を 撮る 道具が 動くか
"""

import io
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env_used = {}
for d in ("app", "lib", "components", "middleware.js"):
  p = os.path.join(ROOT, d)
  walk = [(os.path.dirname(p), [], [os.path.basename(p)])] if os.path.isfile(p) \
      else os.walk(p)
  for root, dirs, files in walk:
    if isinstance(dirs, list):
      dirs[:] = [x for x in dirs if x not in ("node_modules",)]
    for f in files:
      if not f.endswith((".js", ".jsx")):
        continue
      rel = os.path.relpath(os.path.join(root, f), ROOT)
      raw = io.open(os.path.join(root, f), encoding="utf-8").read()
      for m in re.finditer(r'process\.env\.([A-Z0-9_]+)', raw):
        env_used.setdefault(m.group(1), set()).add(rel)

present = set()
for name in (".env.local", ".env"):
  p = os.path.join(ROOT, name)
  if os.path.exists(p):
    for line in io.open(p, encoding="utf-8"):
      if "=" in line and not line.strip().startswith("#"):
        present.add(line.split("=")[0].strip())

# ★★動かすのに 要る ものだけ（★中で 落ちる ものが 先）
BOOT = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

print("★コードが 読んで いる 環境変数: " + str(len(env_used)))
print("★手もとに ある: " + str(len(present)))
print()
print("★立ち上げに 要る もの")
for k in BOOT:
  print("  " + ("✓" if k in present else "✗") + " " + k)
print()
print("★そのほか")
for k in sorted(env_used):
  if k in BOOT:
    continue
  print("  " + ("✓" if k in present else "✗") + " " + k + "   "
        + ", ".join(sorted(env_used[k])[:2]))

pw = subprocess.run(["node", "-e", "require('playwright');console.log('ok')"],
                    cwd=ROOT, capture_output=True, text=True)
chrome = os.path.exists("/Applications/Google Chrome.app")
cache = os.path.expanduser("~/Library/Caches/ms-playwright")
inst = os.path.isdir(cache) and bool(os.listdir(cache))

L = []
L.append("# いま 確かめられない こと")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★No.013 ITEM_4（★SEVERITY: HIGH）")
L.append("")
L.append("## 何が できて、★何が できないか")
L.append("")
L.append("| | できるか | 理由 |")
L.append("|---|---|---|")
L.append("| 見本の HTML を 開いて 撮る | ○ | Google Chrome を 借りて います |")
L.append("| 色を 測る・くらべる | ○ | 上と 同じ |")
L.append("| **アプリの 画面を 出す** | **×** | `.env.local` が ありません |")
L.append("| **作りの 不具合を 確かめる** | **×** | 上と 同じ |")
L.append("")
L.append("★★だから、★この 便の「確かめました」は **見本の 色だけ** です。")
L.append("　★アプリの 画面は 1枚も 見て いません。")
L.append("")
L.append("## 足りない もの ①　`.env.local`")
L.append("")
L.append("★★`npm run dev` が 500 を 返します。★`middleware.js` が 落ちます ──")
L.append("")
L.append("```")
L.append("Error: Your project's URL and Key are required to create a Supabase client!")
L.append("    at Object.middleware (middleware.js:18)")
L.append("```")
L.append("")
L.append("★★最低 この 2つが 要ります。")
L.append("")
L.append("| 名前 | 手もとに |")
L.append("|---|---|")
for k in BOOT:
  L.append("| `" + k + "` | " + ("あり" if k in present else "**なし**") + " |")
L.append("")
L.append("★★どちらも Supabase の 管理画面 → Settings → API に あります。")
L.append("　★`anon` の 鍵です。★`service_role` では ありません。")
L.append("")
L.append("★★★お願いの 形。★私は 本物の 鍵を 預かりません。")
L.append("　★坂本さんが `.env.local` を 作って ください（★`.gitignore` 済み）。")
L.append("　★作って いただければ、★私の 側で 画面を 出して 撮れます。")
L.append("")
L.append("## 足りない もの ②　画面を 撮る 道具")
L.append("")
L.append("| | |")
L.append("|---|---|")
L.append("| playwright（道具本体） | " + ("あり" if pw.returncode == 0 else "なし") + " |")
L.append("| playwright の Chromium | " + ("あり" if inst else "**なし**") + " |")
L.append("| Google Chrome | " + ("あり" if chrome else "なし") + " |")
L.append("")
L.append("★★`npx playwright install chromium` は 通りません ──")
L.append("")
L.append("```")
L.append("Error: Playwright does not support chromium on mac12")
L.append("```")
L.append("")
L.append("★★この 機械は macOS 12 です。★新しい playwright は 見て いません。")
L.append("　★いまは `channel: \"chrome\"` で、★入って いる Chrome を 借りて います。")
L.append("　★★これで 足ります。★止まって いる 理由は ①だけ です。")
L.append("")
L.append("## そのほかの 環境変数（★あれば できる ことが 増えます）")
L.append("")
L.append("| 名前 | 手もとに | 使う ところ |")
L.append("|---|---|---|")
for k in sorted(env_used):
  if k in BOOT:
    continue
  L.append("| `" + k + "` | " + ("あり" if k in present else "なし") + " | `"
           + sorted(env_used[k])[0] + "` |")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 鍵の 中身は 見て いません。★名前が あるかだけ を 見ます。")
L.append("- 本番の 鍵を 手もとに 置く ことは、★お勧めして いません。")
L.append("  ★試し用の 別の 企画（Supabase project）でも 足ります。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__", "全" + str(len(body.split("\n"))) + "行 / 末尾は「"
                    + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-確かめられないこと.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
