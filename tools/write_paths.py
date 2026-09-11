#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★どの 道を 通って 書いて いるか（★裏口か、★ブラウザ 直か）
#
#   ★出どころ 2026-09-11、★50通りの 結果を どう 読むかの お尋ね。
#     ★★「役職と 所属」「レッスンの 日程」の 書き込みは、
#       ★★ブラウザから 直に 投げて いるのか、
#       ★★それとも サーバの 経路（★裏口・service role）を 通って いるのか。
#
#   ★★これが 分かれば、★42501 の 15マスが
#     ★「本当の 不具合」か「私が ちがう 道を 試した だけ」かが 決まります。
#
#   ★★言い分は 書きません。★見つけた 行を そのまま 並べます。
#     ★★読む 方が、★行を 見て 決められる ように します。
#
#   使い方  python3 tools/write_paths.py
# ============================================================================

import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")

# ★探す もの ── ★(見出し, 探す 字, どの 表の 話か)
TARGETS = [
  ("役職と 所属", ["memberships", "org_posts"], "memberships ／ org_posts"),
  ("レッスンの 日程", ["lessons"], "lessons"),
  ("レッスンの 出席", ["lessons"], "lessons の attendance 列"),
]

# ★★その 表への 書き込みの うち、★どれを その 見出しに 数えるか。
#   ★★出席と 日程は 同じ 表なので、★中身の 字で 分けます。
ONLY = {
  "レッスンの 出席": re.compile(r"attendance"),
  "レッスンの 日程": re.compile(r"scheduled_at|\.delete\(|link_id"),
}

WRITE = re.compile(r"\.(insert|update|upsert|delete)\(")
ADMIN = re.compile(r"createAdminClient|admin\.from")


def grep(pattern):
  """★帳面ぜんたいから 探します。★見張りは 除きます。"""
  cmd = ["grep", "-rn", "-E", pattern, "components", "lib", "app"]
  try:
    out = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True).stdout
  except Exception:                                             # noqa: BLE001
    out = ""
  rows = []
  for line in out.split("\n"):
    if not line.strip():
      continue
    if "components/tests/" in line:
      continue
    rows.append(line)
  return rows


FROM = re.compile(r'from\("([a-z_]+)"\)')


def find_writes(tables, only):
  """
  ★その 表へ 書いて いる 行を 探します。

    ★★`.update(` は、★`from("lessons")` と **ちがう 行**に ある ことが あります
      （★VocalTracker.jsx:9739 が そうでした）。
    ★★だから、★書いて いる 行から **上へ 3行** たどって、★表の 名前を 探します。
    ★★2026-09-11、★同じ 行だけを 見て いて、★出席の 行を 1つも 拾えません でした。
  """
  found = []
  for path in walk_sources():
    full = os.path.join(ROOT, path)
    try:
      with open(full, encoding="utf-8") as f:
        src = f.read().split("\n")
    except Exception:                                           # noqa: BLE001
      continue
    for i, line in enumerate(src):
      if not WRITE.search(line):
        continue
      # ★上へ 3行 たどって、★表の 名前を 探します
      table = None
      for j in range(i, max(-1, i - 4), -1):
        m = FROM.search(src[j])
        if m:
          table = m.group(1)
          break
      if table not in tables:
        continue
      # ★書いて いる 中身は、★上下に 窓を 取って 見ます。
      #   ★★`.update(patch)` の ように、★中身を 手前で 組み立てて いる
      #     ★書き方が あります（★VocalTracker.jsx:9739 が そうでした）。
      #   ★★下だけ 見て いて、★出席の 行を 1つ 落として いました。
      block = "\n".join(src[max(0, i - 12):i + 7])
      if only and not only.search(block):
        continue
      found.append((path, str(i + 1), line.strip(), classify(path, line)))
  return found


def walk_sources():
  out = []
  for top in ("components", "lib", "app"):
    for base, _dirs, files in os.walk(os.path.join(ROOT, top)):
      if "tests" in base:
        continue
      for fn in files:
        if fn.endswith((".js", ".jsx")):
          out.append(os.path.relpath(os.path.join(base, fn), ROOT))
  return sorted(out)


def classify(path, text):
  """
  ★その 行が、★どの 道か。

    ★裏口　　 app/api/… の 中で、★admin（service role）を 使って いる
    ★サーバ　 app/api/… の 中だが、★admin では ない
    ★ブラウザ components/ か lib/ ── ★画面から 直に 投げて いる
  """
  if path.startswith("app/api/"):
    return "裏口（service role）" if ADMIN.search(text) else "サーバ（RLS あり）"
  return "ブラウザ 直"


def main():
  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  say("# ★どの 道を 通って 書いて いるか")
  say()
  say("★この 紙は tools/write_paths.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★見つけた 行を そのまま 並べます。★言い分は 足しません。")
  say()

  verdicts = {}
  rows_by = {}

  for title, patterns, what in TARGETS:
    say("## " + title + "　（" + what + "）")
    say()
    found = find_writes(patterns, ONLY.get(title))

    rows_by[title] = found
    if not found:
      say("★書いて いる 行が 1つも ありません。")
      say()
      verdicts[title] = "書く 道が 無い"
      continue

    found.sort(key=lambda r: (r[0], int(r[1])))
    say("| 場所 | 道 | 行 |")
    say("|---|---|---|")
    for path, no, text, how in found:
      short = text if len(text) <= 100 else text[:100] + "…"
      short = short.replace("|", "\\|")
      say("| `%s:%s` | **%s** | `%s` |" % (path, no, how, short))
    say()

    ways = sorted({r[3] for r in found})
    verdicts[title] = "／".join(ways)
    say("★通って いる 道　**" + "／".join(ways) + "**")
    say()

  say("## ★まとめ")
  say()
  say("| 何を 書くとき | どの 道 |")
  say("|---|---|")
  for k, v in verdicts.items():
    say("| " + k + " | **" + v + "** |")
  say()

  say("## ★これが 50通りの 読み方に どう 効くか")
  say()
  say("★★`tools/perm_matrix.py` は、★**ブラウザ 直**の 道を 試して います。")
  say()
  for k, v in verdicts.items():
    direct = [r for r in rows_by[k] if r[3] == "ブラウザ 直"]
    behind = [r for r in rows_by[k] if r[3] != "ブラウザ 直"]
    say("### " + k)
    say()
    if direct and behind:
      # ★★道が 混ざって います。★どちらか では ありません。
      say("★★道が **混ざって** います。★1つでは ありません。")
      say()
      say("- ★ブラウザ 直 …… " + str(len(direct)) + " か所")
      for r in direct:
        say("  - `%s:%s`　`%s`" % (r[0], r[1], r[2][:70].replace("|", "\\|")))
      say("  ★★この ぶんは、★50通りの 結果が そのまま 当てはまります。")
      say("- ★サーバ／裏口 …… " + str(len(behind)) + " か所")
      say("  ★★この ぶんは、★50通りの 結果が 当てはまりません。")
      say("  ★★裏口（service role）は、★許しも 決まりも 飛び越えます。")
      say("  ★★止めて いるのは 台帳では なく、★その 経路の コードだけ です。")
    elif direct:
      say("★画面も **ブラウザ 直**です。★50通りが 試したのと 同じ 道です。")
      say("★★だから 結果は、★その 道に ついては 本物です。")
      for r in direct:
        say("- `%s:%s`　`%s`" % (r[0], r[1], r[2][:70].replace("|", "\\|")))
    elif behind:
      say("★画面は **裏口／サーバ**を 通ります。★ブラウザ 直では ありません。")
      say("★★だから 50通りの 結果は、★画面の 姿を 表して いません。")
    else:
      say("★書く 道が ありません。")
    say()

  # ★★scheduled_at を 書き換える 行が あるか。★無ければ、
  #   ★★「日程を 直す」という 働き自体が ありません。
  resched = [r for r in grep(r"scheduled_at")
             if WRITE.search(r) and ".update(" in r]
  say("## ★日程を **あとから 直す** 働きが あるか")
  say()
  if resched:
    for r in resched:
      say("- `" + r.strip()[:160] + "`")
  else:
    say("★`scheduled_at` を `.update(` で 書き換えて いる 行は **ありません**。")
    say()
    say("★★つまり、★レッスンの 時刻を あとから 直す 働きは、★いま ありません。")
    say("　★★あるのは「作る」「消す」「出席を 付ける」の 3つ だけ です。")
    say("　★★期待表の「レッスンの 日程」は、★作る ことを 指して いると 読めます。")
  say()

  path = os.path.join(OUT, "2026-09-11-どの道を通って書いているか.md")
  with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-どの道を通って書いているか.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
