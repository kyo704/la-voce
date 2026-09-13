#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★「A または B」の 決まりを、★1本ずつ 見る
#
#   ★出どころ Opus の 裁定（その19・2026-09-11）
#     ★★「一つの 力に、★一つの 鍵。★OR で つなぐと、
#       ★★B が A の 裏口に なる」
#     ★★学部長の 件が それでした ── ★`post OR master` の `master` が、
#       ★`post` の 裏口に なって いました。
#
#   ★★決め打ちで 答えを 書きません。
#     ★★鍵の 定義（lib/opsPerms.js の TEMPLATE_POSTS）から 数えます ──
#       ★「B を 持ち、★A を 持たない 役職」が 実在する か。
#       ★★居れば、★その 役職は B を 通って A の 力に 届きます。
#       ★★居なければ、★いま の ところ 裏口に なって いません。
#     ★★「なって いない」は「なら ない」では ありません。
#       ★★役職の 中身が 変われば、★明日 なります。★そこも 書きます。
#
#   ★★裁定は 私が しません。★並べる だけ です。
#
#   使い方  python3 tools/or_rules.py
# ============================================================================

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")


def read_expected():
  p = os.path.join(ROOT, "docs", "opus", "期待表-権限の総当たり（9月11日）.json")
  with open(p, encoding="utf-8") as f:
    return json.load(f)


def read_posts():
  """★役職と その 鍵を、★lib/opsPerms.js から 読みます。"""
  p = os.path.join(ROOT, "lib", "opsPerms.js")
  with open(p, encoding="utf-8") as f:
    s = f.read()
  blk = s[s.index("TEMPLATE_POSTS = Object.freeze(["):]
  blk = blk[:blk.index("]);") + 3]
  out = []
  for name, perms in re.findall(r'\{ name: "(.+?)", perms: \[(.*?)\] \}', blk):
    keys = [k.strip().strip('"') for k in perms.split(",") if k.strip()]
    out.append((name, set(keys)))
  return out


def school_wide():
  """
  ★学校ぜんぶに かかる 鍵（★§7-4）。

    ★★`lib/opsPerms.js` の `PERMS` の `schoolWide: true` から 読みます。
    ★★2026-09-13、★はじめ `SCHOOL_WIDE` という 名の 一覧を 探して いて、
      ★★そんな ものは 無く、★空の まま 通して いました。
      ★★空だと「★学校ぜんぶに かかる 鍵は ありません」と 出ます ──
        ★★**調べずに「無い」と 言う** 形でした。
    ★★見つからない ときは、★黙って 空に せず 止めます。
  """
  p = os.path.join(ROOT, "lib", "opsPerms.js")
  with open(p, encoding="utf-8") as f:
    src = f.read()
  rows = re.findall(r'\{ key: "([a-z_]+)".*?schoolWide: (true|false)', src)
  if not rows:
    raise SystemExit("★PERMS を 読めません でした。★止めます。")
  return {k for k, v in rows if v == "true"}


def split_or(src):
  """★`A OR B` を 割ります。★かっこの 中は 割りません。"""
  parts, depth, cur = [], 0, ""
  i = 0
  while i < len(src):
    c = src[i]
    if c == "(":
      depth += 1
    elif c == ")":
      depth -= 1
    if depth == 0 and src[i:i + 4] == " OR ":
      parts.append(cur.strip())
      cur = ""
      i += 4
      continue
    cur += c
    i += 1
  parts.append(cur.strip())
  return [p for p in parts if p]


def keys_of(expr):
  """★式の 中に 出て くる 鍵の 名前。"""
  return set(re.findall(r"[a-z_]+", expr))


def main():
  exp = read_expected()
  posts = read_posts()
  wide = school_wide()

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★「A または B」の 決まり ── ★1本ずつ")
  say()
  say("★この 紙は tools/or_rules.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★裁定は して いません。★並べた だけ です。")
  say("　★★どれを 締めるかは、★坂本さんと Opus の お決めです。")
  say()
  say("## ★どう 数えたか")
  say()
  say("★★決め打ちの 答えを 持って いません。")
  say("　★★役職の 中身（`lib/opsPerms.js` の `TEMPLATE_POSTS`）から 数えます ──")
  say("　★★**「B を 持ち、★A を 持たない 役職」が 実在する か。**")
  say()
  say("　★居れば　　… ★その 役職は、★B を 通って A の 力に 届きます。★裏口です。")
  say("　★居なければ… ★いまの ところ 裏口に なって いません。")
  say("　　★★ただし「なら ない」では ありません。")
  say("　　★★役職の 中身が 変われば、★明日 なります。")
  say()

  found = []
  for what, src in exp["規則"].items():
    if what == "既定":
      continue
    parts = split_or(src)
    if len(parts) < 2:
      continue
    found.append((what, src, parts))

  say("## ★見つかった OR の 決まり　%d 本" % len(found))
  say()

  for what, src, parts in found:
    say("### %s" % what)
    say()
    say("```")
    say(src)
    say("```")
    say()
    # ★★どちらの 向きが 気に なるかは、★その 列が 何を 指すかで 決まります。
    #   ★★だから「裏口」と 決めつけません。★数だけ 出します。
    #   ★★2026-09-13、★はじめ 両向きとも「裏口」と 書いて いました。
    #     ★★`sched_all` が `sched_mine` の 裏口、というのは 当たり前です
    #       （★広い ほうが 狭い ほうを 含むだけ）。★言っても 意味が ありません。
    #     ★★気に なるのは、★**狭い 鍵で 広い 力に 届く**ときです。
    say("| 見る 向き | B を 持ち A を 持たない 役職 | B の 広さ |")
    say("|---|---|---|")
    for i, a in enumerate(parts):
      for j, b in enumerate(parts):
        if i == j:
          continue
        ka, kb = keys_of(a), keys_of(b)
        who = [n for n, ks in posts if kb <= ks and not (ka & ks)]
        wideb = "★学校ぜんぶ" if (kb & wide) else "★その方 自身だけ"
        say("| `%s` ← `%s` | %s | %s |"
            % (a, b, "、".join(who) if who else "（居ません）", wideb))
    say()
    # ★★狭い 鍵で 広い 力に 届く 向きだけを、★お尋ねとして 立てます。
    asks = []
    for i, a in enumerate(parts):
      for j, b in enumerate(parts):
        if i == j:
          continue
        ka, kb = keys_of(a), keys_of(b)
        who = [n for n, ks in posts if kb <= ks and not (ka & ks)]
        if who and (ka & wide) and not (kb & wide):
          asks.append((a, b, who))
    if asks:
      say("★★**お尋ね**")
      say()
      for a, b, who in asks:
        say("- `%s` は その方 自身だけ の 鍵です。" % b)
        say("  ★それで `%s`（★学校ぜんぶ）の 力に 届いて よい でしょうか。" % a)
        say("  ★届く 役職　%s" % "、".join(who))
      say()
    else:
      say("★★狭い 鍵で 学校ぜんぶの 力に 届く 向きは、★ありません でした。")
      say("　★★この 決まりの 2つは、★どちらも 同じ 広さ です。")
      say()

    # ★★学校ぜんぶに かかる 鍵が 混ざって いるか
    allk = keys_of(src)
    w = sorted(allk & wide)
    say("★この 決まりに 出て くる 鍵の 広さ")
    say()
    for k in sorted(allk):
      say("- `%s`　%s" % (k, "★学校ぜんぶ" if k in wide else "★その方 自身だけ"))
    say()
    if w:
      say("★★学校ぜんぶに かかる 鍵が 入って います　`%s`" % ", ".join(w))
      say("　★★§7-4「持って いない ものは 渡せない」は、")
      say("　★★**その 鍵の 中でしか** 働きません。")
      say("　★★OR で よその 鍵から 届くと、★その 見張りを 回り込みます。")
    else:
      say("★★学校ぜんぶに かかる 鍵は、★この 決まりには 入って いません。")
      say("　★★（★`lib/opsPerms.js` の `PERMS` の `schoolWide` から 数えました。")
      say("　★★ 学校ぜんぶに かかる 鍵は 全部で %d 個 あります。）" % len(wide))
    say()

  say("## ★直った ばかりの もの（★見くらべの ため）")
  say()
  say("★★`役職と 所属` は、★2026-09-11 まで `post OR master` でした。")
  say("　★★`master` を 持ち `post` を 持たない 役職 ── ★学部長・学科長。")
  say("　★★いまは `post` だけ です（★修正の記録 No.005）。")
  say("　★★上の 表の 読み方は、★これと 同じ です。")
  say()
  say("## ★この 紙が 見て いない こと")
  say()
  say("★★見て いるのは **期待表の 決まり** です。★実装の 決まりでは ありません。")
  say("　★★実装が 期待表と 合って いる ことは、")
  say("　★`components/tests/perm-matrix-expected.test.js` が 見ます。")
  say()
  say("★★役職は いまの 10です。★学校が 自分で 作った 役職は 見て いません。")
  say("　★★`add` と `perm` で、★学校は 好きな 組み合わせを 作れます。")
  say("　★★その ときも 同じ 問いが 立ちます。")

  p = os.path.join(OUT, "2026-09-11-permission-or-rules.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★docs/reports/2026-09-11-permission-or-rules.md（全%d行）" % len(lines))
  print("★OR の 決まり %d 本" % len(found))
  for what, src, parts in found:
    print("  %s　%s" % (what, src))
  return 0


if __name__ == "__main__":
  sys.exit(main())
