#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★検査の 下ごしらえ（Python 側）── ★`lib/strip.js` と 同じ 決まり。

  ★★★なぜ 2つ あるか
    ★★見張りは JavaScript、★道具は Python です（★2026-09-11 の お決め）。
    ★★同じ 決まりを 2つの 言葉で 書きます。★形は 揃えます。

  ★★★決まり（★裁定135 ／ その137）
    ★① 落とすのは **註 だけ** です。★字（文字列）は 残します。
    ★② 位置を 変えません。★行と 桁を そのまま に します（★空白に 置き換え）。
    ★③ 正規表現リテラルは 読み飛ばします。★中身は 残します。
       ★★読み飛ばさないと、★文字の 組の 中の 引用符で 位置が ずれます
         （★2026-09-21・`VocalTracker.jsx:3805` で 註 700行 が 外れました）。

  ★★★行の 終わりの 註も 落とします。
    ★★`^\\s*//` だけ 見て いた ころ、★`const a = 1; // 12,800円` が
      ★残り、★「直書き」として 挙がりました。

  ★較正 …… `python3 tools/strip_common.py --selftest`
"""
import re
import sys

_語 = ("return", "typeof", "instanceof", "in", "of", "new", "delete",
       "void", "throw", "do", "else", "yield", "await", "case")


def _正規表現か(s, at):
  """★この `/` は 正規表現の 始まりか、★割り算か。"""
  j = at - 1
  while j >= 0 and s[j].isspace():
    j -= 1
  if j < 0:
    return True
  c = s[j]
  if c in ")]":
    return False
  if c.isalnum() or c in "_$":
    k = j
    while k >= 0 and (s[k].isalnum() or s[k] in "_$"):
      k -= 1
    return s[k + 1:j + 1] in _語
  return True


def strip_js(src):
  """★註を 空白に 置き換えます。★字と 正規表現は そのまま 残します。"""
  out = []
  i, prev, n = 0, 0, len(src)

  def 出す(end):
    if end > prev:
      out.append(src[prev:end])

  def 空白に(t):
    return "".join(c if c == "\n" else " " for c in t)

  while i < n:
    c = src[i]
    d = src[i + 1] if i + 1 < n else ""
    if c == "/" and d == "/":
      出す(i)
      j = src.find("\n", i)
      j = n if j < 0 else j
      out.append(空白に(src[i:j]))
      i = prev = j
      continue
    if c == "/" and d == "*":
      出す(i)
      j = src.find("*/", i + 2)
      j = n if j < 0 else j + 2
      out.append(空白に(src[i:j]))
      i = prev = j
      continue
    if c == "/" and d not in ("/", "*") and _正規表現か(src, i):
      j, 組 = i + 1, False
      while j < n:
        e = src[j]
        if e == "\\":
          j += 2
          continue
        if e == "\n":
          break
        if 組:
          if e == "]":
            組 = False
          j += 1
          continue
        if e == "[":
          組 = True
          j += 1
          continue
        if e == "/":
          j += 1
          break
        j += 1
      i = j
      continue
    if c in "\"'`":
      j = i + 1
      while j < n:
        if src[j] == "\\":
          j += 2
          continue
        if src[j] == c:
          j += 1
          break
        j += 1
      i = j
      continue
    i += 1
  出す(n)
  return "".join(out)


def selftest():
  """★較正 ── ★消える はず と、★残る はず の 両方。"""
  例 = [
    ("行の 註", "// おちる\nconst a = 1;", "おちる", False),
    ("行の 終わりの 註", 'const a = 1; // 12,800円\n', "12,800", False),
    ("かたまりの 註", "/* おちる */ const a = 1;", "おちる", False),
    ("字は 残す", 'const a = "のこる";', "のこる", True),
    ("字の 中の //", 'const u = "https://example.com";', "https://example.com", True),
    ("文字の組の 中の 引用符", 'x.replace(/[「」"’]/g, "");\n// おちる\n', "おちる", False),
    ("割り算", "const a = (b) / c; // おちる\nconst d = 2;", "おちる", False),
    ("割り算を 消さない", "const a = (b) / c;", "(b) / c", True),
    ("return の あと", 'function f(){ return /ab"c/.test(x); }\n// おちる\n', "おちる", False),
  ]
  ng = 0
  for 名, src, 語, 残る in 例:
    在る = 語 in strip_js(src)
    ok = 在る == 残る
    if not ok:
      ng += 1
    print("  %s %s …… %s（期待 %s）"
          % ("PASS" if ok else "FAIL", 名,
             "残った" if 在る else "消えた", "残る" if 残る else "消える"))
  # ★位置を 変えない こと。
  src = "// abc\nconst a = 1;\n"
  if len(strip_js(src).split("\n")) != len(src.split("\n")):
    print("  FAIL 行の 数が 変わった")
    ng += 1
  else:
    print("  PASS 行の 数が 変わらない")
  print("SELFTEST", "PASS" if ng == 0 else "FAIL")
  return 0 if ng == 0 else 2


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv else 0)
