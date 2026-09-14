#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★役割（role）に 寄りかかって いる ところを、★1行ずつ 並べる
#
#   ★出どころ Opus 裁定 その23・項目4（★9月15日の 関門）
#     ★★「is_org_owner_or_admin／role IN ('owner','admin')／memberships.role を
#       ★使って いる ところを ぜんぶ 挙げ、★どの has_can の 鍵に あたるかを 1行で」
#
#   ★★決めません。★並べる だけ です。
#   ★★帳面の 字を 読みます。★台帳の 決まりは 別に 読む 必要が あります
#     （★supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql）。
#
#   使い方  python3 tools/role_dependent.py
# ============================================================================

import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
SKIP = {".git", "node_modules", ".next", "デスクトップ", "月曜日sonnetに渡すもの",
        # ★★2026-09-01 の 台帳の 写し。★いま 立って いる ものでは ありません。
        #   ★★入れると 数が 倍に なり、★9月15日に 書く 母数を 誤ります。
        "backups"}

PATTERNS = [
  ("is_org_owner_or_admin", re.compile(r"is_org_owner_or_admin")),
  ("role in ('owner','admin')", re.compile(r"role\s*(=\s*any|in)\s*\(?\s*(array)?\s*\[?\s*'owner'", re.I)),
  ("memberships.role を 直に", re.compile(r"m\.role|memberships\.role|\.role\s*===|BY_ROLE|NOT_COUNTED_ROLES")),
  ("role の 4値を 書いて いる", re.compile(r"['\"]owner['\"]\s*,\s*['\"]admin['\"]|['\"]teacher['\"]\s*,\s*['\"]staff['\"]")),
]

# ★★どの 鍵に あたるか。★私の 見立てでは ありません ──
#   ★lib/opsPerms.js の できことの 名前を、★そのまま 添えるだけ です。
HINT = {
  "enrollments": "meibo（名簿を 見る・直す）",
  "memberships": "post（ひとの 役職を 変える）／meibo",
  "org_posts": "post",
  "org_events": "gyoji",
  "lessons": "sched_all ／ sched_mine ／ shukketsu",
  "org_messages": "renraku_all",
  "assignments": "meibo ／ monka_write",
}


def walk():
  for base, dirs, files in os.walk(ROOT):
    # ★★macOS は 名前を 分けて しまいます（★NFD）。
    #   ★★"デスクトップ" が そのままでは 当たりません。★そろえて くらべます。
    dirs[:] = [d for d in dirs
               if unicodedata.normalize("NFC", d) not in SKIP and not d.startswith(".")]
    for fn in files:
      if fn.endswith((".sql", ".js", ".jsx")):
        yield os.path.join(base, fn)


def table_of(text):
  for t in HINT:
    if t in text:
      return t
  return None


def main():
  hits = []
  for path in walk():
    rel = os.path.relpath(path, ROOT)
    if rel.startswith("components/tests/") or rel.startswith("tools/"):
      continue
    try:
      with open(path, encoding="utf-8") as f:
        rows = f.read().split("\n")
    except Exception:                                           # noqa: BLE001
      continue
    for i, line in enumerate(rows):
      for name, rx in PATTERNS:
        if not rx.search(line):
          continue
        win = "\n".join(rows[max(0, i - 6):i + 4])
        hits.append({
          "path": rel, "line": i + 1, "kind": name,
          "text": line.strip()[:100],
          "table": table_of(win) or table_of(line) or "—"
        })
        break

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★役割（role）に 寄りかかって いる ところ")
  say()
  say("★この 紙は tools/role_dependent.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★決めて いません。★並べた だけ です。")
  say("　★★「どの 鍵に あたるか」は、★lib/opsPerms.js の 名前を 添えた だけ で、")
  say("　★★私の 見立てでは ありません。★お決めは Opus と 坂本さんの ものです。")
  say()
  say("★★この 紙は **帳面の 字**を 読んで います。")
  say("　★★台帳に 実際に 立って いる 決まりは、★別に 読む 必要が あります ──")
  say("　★supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql")
  say()

  by_kind = {}
  for h in hits:
    by_kind.setdefault(h["kind"], []).append(h)

  say("## ★数　%d 件" % len(hits))
  say()
  for k, v in sorted(by_kind.items(), key=lambda x: -len(x[1])):
    say("- **%s** … %d 件" % (k, len(v)))
  say()

  sql = [h for h in hits if h["path"].endswith(".sql")]
  app = [h for h in hits if not h["path"].endswith(".sql")]

  for title, rows_, note in [
    ("① 台帳の 側（SQL）", sql, "★決まり・関数。★ここが 権限そのものです。"),
    ("② 画面・サーバの 側（JS）", app, "★描画の 絞りと、★経路の 門。"),
  ]:
    say("## %s　%d 件" % (title, len(rows_)))
    say()
    say(note)
    say()
    say("| 場所 | たぐい | 関わる 表 | あたりそうな 鍵 | 行 |")
    say("|---|---|---|---|---|")
    for h in sorted(rows_, key=lambda x: (x["path"], x["line"])):
      say("| `%s:%d` | %s | %s | %s | `%s` |" % (
        h["path"], h["line"], h["kind"], h["table"],
        HINT.get(h["table"], "—"), h["text"].replace("|", "\\|")))
    say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★台帳に 立って いる 決まりの 本文は 読んで いません。")
  say("　★★帳面の SQL は「流した もの」と「流して いない もの」が 混ざります。")
  say("　★★実際に 何が 立って いるかは `pg_policies` でしか 分かりません。")
  say("★★`role` という 字が 別の 意味で 使われて いる ところも 拾います。")
  say("　★★1件ずつ、★触る 前に お確かめください。")

  p = os.path.join(OUT, "2026-09-13-role-dependent-policies.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("docs/reports/2026-09-13-role-dependent-policies.md  全%d行" % len(lines))
  print("計 %d 件（SQL %d / JS %d）" % (len(hits), len(sql), len(app)))
  for k, v in sorted(by_kind.items(), key=lambda x: -len(x[1])):
    print("  %-30s %d" % (k, len(v)))
  return 0


if __name__ == "__main__":
  sys.exit(main())
