#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★本番と 試しの 関数の 中身を、★並べて 見ます（2026-09-23）。

  ★★`ledger_inventory twin` は「中身が違う」としか 言いません（★md5 で くらべます）。
    ★★★空白や `search_path` の 書き方だけ でも「違う」に なります。
    ★★だから、★**何が どう 違うか** を 見ないと 危うさが 測れません。
      ★2026-09-23、★`has_can` が 「違う」と 出ました。
      ★★中身を 並べたら、★本番は `has_can_user` を 呼ぶ 形、★試しは 同じ 式を 直に 書いた 形。
      ★★★`has_can_user` は 2つで **同じ** でした。★振る舞いは 同じ です。

  ★使い方
    python3 tools/twin_body_diff.py 関数の名 [関数の名 …]
"""
import difflib, re, subprocess, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def 本体(名, 試し):
  tpl = ("select substr(replace(pg_get_functiondef(p.oid), chr(10), '~'),{a},{b}) x "
         "from pg_proc p join pg_namespace n on n.oid=p.pronamespace "
         "where n.nspname='public' and p.proname='" + 名 + "'")
  buf = ""
  for i in range(0, 6000, 60):
    args = ["python3", os.path.join(ROOT, "tools/ask_ledger.py")]
    if 試し:
      args.append("--test")
    args.append(tpl.format(a=i + 1, b=60))
    out = subprocess.run(args, capture_output=True, text=True).stdout
    ls = out.split("\n")
    seg = ""
    for j, l in enumerate(ls):
      if l.strip() == "x" and j + 2 < len(ls):
        seg = ls[j + 2]
        break
    buf += seg
    if len(seg) < 60:
      break
  return buf.replace("~", "\n")


def 揃える(s):
  """★空白と `search_path` の 書き方は 落とします。★振る舞いでは ありません。"""
  s = re.sub(r"SET search_path TO [^\n]*", "SET search_path", s, flags=re.I)
  s = re.sub(r"\s+", " ", s)
  return s.strip()


def main():
  名 = sys.argv[1:]
  if not 名:
    print(__doc__)
    return 2
  for n in 名:
    h = 本体(n, False)
    t = 本体(n, True)
    同 = 揃える(h) == 揃える(t)
    print("=" * 70)
    print("★", n, "……", "★空白の ちがい だけ です" if 同 else "★★中身が ちがいます")
    if not 同:
      for l in difflib.unified_diff(h.split("\n"), t.split("\n"),
                                    "本番", "試し", lineterm="", n=1):
        print("  " + l[:120])
  return 0


if __name__ == "__main__":
  sys.exit(main())
