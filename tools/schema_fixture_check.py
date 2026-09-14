#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★見張りの 作り物の 行が、★台帳に 在る 値で 書かれて いるか
#   ★出どころ 2026-09-13。★org-roster.test.js が role:"student" と
#     status:"paused" を 使って いました。★台帳に どちらも ありません。
#     ★★だから 見張りは 通り、★名簿は 1行も 出ませんでした。
#   使い方  python3 tools/schema_fixture_check.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(ROOT, "components", "tests")

# ★★台帳から 写した もの（★2026-09-13 に 坂本さんが 読まれた 結果）。
#   ★★台帳が 変わったら、★ここも 直します。★思い出しで 書きません。
SCHEMA = {
  "memberships": {
    "role": ["owner", "admin", "teacher", "staff"],
  },
  "enrollments": {
    "status": ["active", "left"],
  },
  # ★★Stripe の ぶん。★supabase/schema.sql:35 の 注記から。
  #   ★★2026-09-13、★これが 無い ために
  #     ★subscription-lifecycle／tiers の trialing・canceled を
  #     ★enrollments の 値と 取りちがえて いました。★誤りでした。
  "subscriptions": {
    "status": ["none", "trialing", "active", "past_due", "canceled"],
  },
}

# ★★どの 表の 話かを、★ファイル名から 見分けます。
#   ★★同じ `status` でも、★enrollments と subscriptions では 値が ちがいます。
FILE_TABLE = [
  ("subscription", "subscriptions"),
  ("tiers", "subscriptions"),
  ("billing", "subscriptions"),
  ("plan", "subscriptions"),
]

# ★★同じ 名前の 列でも、★別の 表の 話の ことが あります。
#   ★★2026-09-13、★下の 3つを 拾って いました。★どれも 誤りでした。
#     ★came／absent／canceled … lessons.attendance（lib/todayBand.js:160）
#     ★revoked … teacher_student_links
#     ★expired … purchases
#   ★★これらは この 道具の 見る 表では ありません。
OTHER_TABLE_VALUES = {"came", "absent", "revoked", "expired"}

# ★★わざと 知らない 値を 入れて 試して いる 行。
#   ★★「知らない ものには 何も 当てない」を 確かめる ため の もので、
#     ★★台帳に 入れる 値では ありません。
ON_PURPOSE = re.compile(r"知らない|未知|不明|unknown")


def main():
  bad = []
  for d, dirs, files in os.walk(TESTS):
    for fn in sorted(files):
      if not fn.endswith(".test.js"):
        continue
      path = os.path.join(d, fn)
      with open(path, encoding="utf-8") as f:
        rows = f.read().split("\n")
      for i, line in enumerate(rows):
        if line.strip().startswith("//"):
          continue
        # ★★`role="dialog"` は 画面の 札です（ARIA）。★台帳の 役割では ありません。
        #   ★★2026-09-13、★これを 拾って いました。
        if 'role="dialog"' in line or "role='dialog'" in line or "aria" in line.lower():
          continue
        # ★★その ファイルが どの 表の 話かを 決めます。
        #   ★★決まらない ときは、★subscriptions を 外して 見ます
        #     （★enrollments の 話と して 見る）。
        only = None
        for mark, tb in FILE_TABLE:
          if mark in fn:
            only = tb
            break
        for table, cols in SCHEMA.items():
          if only is not None and table != only and table != "memberships":
            continue
          if only is None and table == "subscriptions":
            continue
          for col, allowed in cols.items():
            for m in re.finditer(r'\b%s\s*[:=]\s*["\']([A-Za-z_]+)["\']' % col, line):
              v = m.group(1)
              if v in OTHER_TABLE_VALUES:
                continue
              if ON_PURPOSE.search(line) or v == "unknown":
                continue
              if v not in allowed:
                bad.append((os.path.relpath(path, ROOT), i + 1, table, col, v,
                            "／".join(allowed)))
  if not bad:
    print("★台帳に 無い 値は 見つかりません でした。")
  else:
    print("★%d 件" % len(bad))
    for p, ln, t, c, v, ok in bad:
      print("  %s:%d  %s.%s = '%s'　★台帳が 許すのは %s" % (p, ln, t, c, v, ok))
  print()
  print("★★この 道具が 見て いない こと")
  print("  ★上の 一覧（SCHEMA）は 手で 写した ものです。")
  print("    ★台帳が 変わったら、★ここも 直さないと 古い ままに なります。")
  print("  ★列の 名前が 在るかは 見て いません。★値だけ です。")
  return 0 if not bad else 1


if __name__ == "__main__":
  sys.exit(main())
