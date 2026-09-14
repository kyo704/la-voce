#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★外から 来た 下書きを、★着手する 前に 見る
#   ★出どころ 2026-09-13。★この家に 無い 土台の 下書きで 往復しました。
#   使い方  python3 tools/check_external_draft.py <下書きの ファイル>
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RULES = [
  ([r":\s*(string|number|boolean)\b", r"interface\s+\w+", r"export\s+type\s+\w+",
    r"<T\s+extends", r"\)\s*:\s*Promise<"],
   "TypeScript の 書き方。★この家は plain JavaScript／JSX。tsconfig.json は ありません。"),
  ([r"\bdescribe\s*\(", r"\bit\s*\(", r"\bexpect\s*\("],
   "Jest／Vitest の 書き方。★この家の 見張りは 自作（node で 1本ずつ）。動きません。"),
  ([r"from ['\"]\./supabaseClient['\"]", r"import \{ supabase \}"],
   "Supabase の 取り込みが ちがいます。★正は @/lib/supabase/client の createClient()。"),
  ([r"\.github/workflows", r"vercel/action"],
   "GitHub Actions 経由の 配備。★廃止済み。★Vercel の Git 連携が 正。"),
  ([r"memberships[\s\S]{0,40}student", r"role:\s*['\"]student['\"]"],
   "生徒を memberships に 置いて います。★生徒は enrollments（裁定 その21）。"),
  ([r"is_org_owner_or_admin", r"role IN \('owner'"],
   "役割で 権限を 見て います。★正は has_can(org_id, key)（§6-3・移行中）。"),
]

FILE = re.compile(r"[`'\"]([A-Za-z0-9_\-/.]+\.(?:js|jsx|ts|tsx|sql|py|md))[`'\"]")


def main():
  if len(sys.argv) < 2:
    print("使い方: python3 tools/check_external_draft.py <下書きの ファイル>")
    return 1
  with open(sys.argv[1], encoding="utf-8") as f:
    text = f.read()

  out = []
  for pats, why in RULES:
    for p in pats:
      m = re.search(p, text)
      if m:
        out.append("★土台が ちがう … %s\n    見つけた 字 `%s`" % (why, m.group(0)[:50]))
        break

  seen, missing = set(), []
  for m in FILE.finditer(text):
    rel = m.group(1)
    if rel in seen:
      continue
    seen.add(rel)
    if not os.path.exists(os.path.join(ROOT, rel)):
      missing.append(rel)
  if missing:
    out.append("★実在しない ファイルを 指して います（%d 件）\n    %s"
               % (len(missing), "、".join(missing[:8])))

  if not out:
    print("★引っかかる ところは ありません。")
    print("★★ただし、★すべてを 見た わけでは ありません。")
    return 0
  print("★%d 件" % len(out))
  for i, o in enumerate(out, 1):
    print("  %d. %s" % (i, o))
  print()
  print("★★これは 目安です。★通っても 中身は 確かめて ください。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
