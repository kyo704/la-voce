#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★できことの 鍵が、★どこかで 読まれて いるか
#   ★出どころ 2026-09-13・Opus の N-1 の 決まり。
#     ★★shukketsu は 書かれて いて、★どこでも 読まれて いませんでした（No.002）。
#   ★★この 道具は 落としません。★数えて 並べる だけ です。
#   使い方  python3 tools/verify_perm_keys_used.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OWNER = os.path.join("lib", "opsPerms.js")
DIRS = ["components", "app", "lib", "supabase"]


def keys():
  with open(os.path.join(ROOT, OWNER), encoding="utf-8") as f:
    src = f.read()
  m = re.search(r"PERMS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)", src)
  if not m:
    raise SystemExit("PERMS を 読めません")
  return re.findall(r'\{ key: "([a-z_]+)"', m.group(1))


# ★★「読まれて いる」を 3つに 分けます（★2026-09-13）。
#   ★★はじめ、★字が 在るか だけ を 見て いました。
#     ★★すると 私の 種まき SQL の 羅列に 当たり、
#       ★★13の 鍵ぜんぶが「読まれて いる」と 出ました。
#     ★★shukketsu を 見のがす のと 同じ 形です。★役に 立ちません。
#   ★★止めて いるか どうかで 分けます。
ASK = [
  (r"has_can\s*\([^)]*'%s'", "台帳の 決まり"),
  (r"\bcan\s*\([^)]*[\"']%s[\"']", "できことを 尋ねる"),
  (r"mayGrant\s*\([^)]*[\"']%s[\"']", "渡せるか"),
  (r"perms\.has\(\s*[\"']%s[\"']", "できことを 尋ねる"),
]
TAB = r"any:\s*\[[^\]]*['\"]%s['\"]"


def classify(key, src):
  for rx, label in ASK:
    if re.search(rx % re.escape(key), src):
      return label
  if re.search(TAB % re.escape(key), src):
    return "札を 出すか だけ"
  return None


def hits(key):
  out = []
  for top in DIRS:
    base = os.path.join(ROOT, top)
    if not os.path.isdir(base):
      continue
    for d, dirs, files in os.walk(base):
      dirs[:] = [x for x in dirs if x != "node_modules" and not x.startswith(".")
                 and x != "tests"]
      for fn in files:
        if not fn.endswith((".js", ".jsx", ".sql")):
          continue
        rel = os.path.relpath(os.path.join(d, fn), ROOT)
        # ★★決めて いる ファイル自身は、★ふつうは 数えません。
        #   ★★ただし TAB_RULES（★どの 札を 出すか）は そこに あります。
        #     ★★「札だけ」を 数える ために、★そこは 見ます。
        owner_file = (rel == OWNER)
        try:
          with open(os.path.join(d, fn), encoding="utf-8") as f:
            src = f.read()
        except Exception:                                       # noqa: BLE001
          continue
        kind = classify(key, src)
        if owner_file and kind != "札を 出すか だけ":
          continue
        if kind:
          out.append((rel, kind))
  return out


def main():
  stop, tab_only, dead = [], [], []
  print("鍵の 棚おろし")
  print("  %-12s %-14s %s" % ("鍵", "たぐい", "どこで"))
  for k in keys():
    h = hits(k)
    kinds = {x[1] for x in h}
    if kinds - {"札を 出すか だけ"}:
      mark, bucket = "★止める", stop
    elif kinds:
      mark, bucket = "・札だけ", tab_only
    else:
      mark, bucket = "★★どこにも", dead
    bucket.append(k)
    where = "、".join(sorted({x[0] for x in h})[:2]) if h else "—"
    print("  %-12s %-14s %s" % (k, mark, where[:70]))
  print()
  print("止める %d ／ 札だけ %d ／ どこにも %d" % (len(stop), len(tab_only), len(dead)))
  if tab_only:
    print()
    print("★札だけ の 鍵: %s" % "、".join(tab_only))
    print("  ★★札を 出さない ことは、★書けない ことでは ありません。")
    print("  ★★ブラウザは 表に 直に 書けます。★札は 通り道では ありません。")
  if dead:
    print()
    print("★★どこでも 尋ねられて いない 鍵 %d 件: %s" % (len(dead), "、".join(dead)))
    print("  ★No.002（出席）と 同じ 形です。")
  print()
  print("★★この 道具が 見て いない こと")
  print("  ★尋ねて いる 書き方（has_can／can／mayGrant／perms.has）を 探します。")
  print("  ★★台帳に 実際に 立って いる 決まりは 見て いません。")
  print("    ★帳面の SQL は 流した ものと 流して いない ものが 混ざります。")
  print("    ★本当の 数は pg_policies でしか 分かりません。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
