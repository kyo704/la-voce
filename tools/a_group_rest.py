#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★対応表に まだ 無い 見本の 画面を、★3つに 仕分けます。

    ★① 実装が ある らしい …… ★その 画面だけの 字が、★品の 中に あります
    ★② 見当たらない　　　 …… ★1つも ありません
    ★③ 確かめが 要る　　　 …… ★少しだけ 当たります

  ★★★「無い」と「探せて いない」を 分ける ため、★まず 目盛りを 合わせます ──
    ★すでに 対応表に ある 画面を 3枚 混ぜ、★①に 出る ことを 確かめます。
    ★出なければ 止まります。★探し方が 壊れて いる から です。

  ★使い方
    python3 tools/a_group_rest.py
"""
import io, json, os, re, sys, glob

根 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
見本 = sorted(glob.glob(os.path.join(根, "docs/design/pack-final/00-*.html")))


def 本文():
  out = {}
  for f in 見本: out[f] = io.open(f, encoding="utf-8").read()
  return out


def 節(名, 本):
  """★その 画面 **だけ** を 取り出します。

     ★★★2026-09-24 ── ★前は「次の `SC['` まで」で 切って いました。
       ★★見本には `SH['…']` や、★ただの `function …` も 並んで います。
       ★★★次の `SC['` が ずっと 先に ある とき、★節が **隣の 画面まで**
         ★伸びて いました。
       ★★だから「もっと深く」が `lib/cutSheet.js` に 14件 当たる、の ような
         ★出まかせが 出ました。★当たって いたのは 隣の 画面の 字 です。
     ★★いまは 中かっこを 数えて、★その 関数の 終わりで 切ります。
  """
  for f, t in 本.items():
    m = re.search(r"(?:SC|P)\['" + re.escape(名) + r"'\]\s*=", t)
    if not m: continue
    j = t.find("{", m.end())
    if j < 0: continue
    深, k, 字, 逃 = 0, j, "", False
    while k < len(t):
      c = t[k]
      if 逃: 逃 = False
      elif 字:
        if c == "\\": 逃 = True
        elif c == 字: 字 = ""
      elif c in "'\"`": 字 = c
      elif c == "{": 深 += 1
      elif c == "}":
        深 -= 1
        if 深 == 0: return 切る(t, m.start(), k + 1)
      k += 1
    return 切る(t, m.start(), len(t))
  return ""


def 切る(t, i, j):
  """★数え違えた ときの 止め。

     ★★見本の 中には、★正規表現や 文字列の 中の 中かっこが あります。
       ★★数え違えると、★節が 画面 何枚ぶんにも 伸びます。
     ★★★伸びた ものを 黙って 使うと、★「実装が ある」の 出まかせに なります。
       ★★だから、★次の 画面の 始まりでも 切ります。★どちらか 短い ほう です。
  """
  b = t[i:j]
  先 = [x for x in [b.find("SC['", 4), b.find("P['", 4), b.find("SH['", 4)] if x > 0]
  return b[:min(先)] if 先 else b


def 字(b):
  """★その 画面だけの、★長めの 日本語。★短い ものは 拾いません。"""
  out = set()
  for m in re.finditer(r">([^<>{}'\"]{8,44})<", b): out.add(m.group(1).strip())
  for m in re.finditer(r"'([一-龠ぁ-んァ-ヶ][^']{7,44})'", b): out.add(m.group(1).strip())
  良 = set()
  for x in out:
    か = re.sub(r"[^一-龠ぁ-んァ-ヶ]", "", x)
    if len(か) >= 6: 良.add(x)
  return 良


def 品():
  fs = []
  for p in ["components/*.jsx", "lib/*.js"]:
    fs += glob.glob(os.path.join(根, p))
  fs += glob.glob(os.path.join(根, "app/**/*.js"), recursive=True)
  fs = [f for f in fs if "/tests/" not in f and "/node_modules/" not in f]
  return {f: io.open(f, encoding="utf-8").read() for f in sorted(fs)}


def 当たり(w, 本):
  点 = {}
  for f, t in 本.items():
    n = sum(1 for x in w if x in t)
    if n: 点[f] = n
  return 点


def main():
  本 = 本文()
  中 = 品()
  conf = json.load(io.open(os.path.join(根, "tools/a_group_conf.json"), encoding="utf-8"))

  # ★★目盛り合わせ ── ★対応表に ある 画面は ①に 出る はず です。
  目 = [k for k in ["もっと", "時間割", "曲を足す"] if k in conf]
  悪 = []
  for k in 目:
    w = 字(節(k, 本))
    if not w or max(当たり(w, 中).values() or [0]) < 2: 悪.append(k)
  if 悪:
    print("★止まりました ── 目盛りが 合いません（%s が ①に 出ません）" % "／".join(悪))
    return 2
  print("★目盛り …… ○（%s が ①に 出ます）" % "／".join(目))

  名 = set()
  for t in 本.values():
    for m in re.finditer(r"(?:SC|P)\['([^']+)'\]\s*=", t): 名.add(m.group(1))
  残 = sorted(名 - set(conf))

  有, 無, 疑, 読めず = [], [], [], []
  for k in 残:
    b = 節(k, 本)
    if not b: 読めず.append(k); continue
    w = 字(b)
    if not w: 読めず.append(k); continue
    点 = 当たり(w, 中)
    if not 点: 無.append((k, len(w)))
    else:
      上 = sorted(点, key=lambda f: -点[f])[0]
      if 点[上] >= 2: 有.append((k, os.path.relpath(上, 根), 点[上], len(w)))
      else: 疑.append((k, os.path.relpath(上, 根), len(w)))

  print("\nA_GROUP_REST  ★対応表に 無い 画面 …… %d" % len(残))
  print("  ① 実装が ある らしい …… %d" % len(有))
  print("  ② 見当たらない …… %d" % len(無))
  print("  ③ 確かめが 要る …… %d" % len(疑))
  print("  ★字が 拾えない …… %d" % len(読めず))

  print("\n■ ① 実装が ある らしい")
  for k, f, n, t in sorted(有, key=lambda x: -x[2]):
    print("  %-14s %-34s %d/%d" % (k, f, n, t))
  print("\n■ ③ 確かめが 要る（★当たり 1つ だけ）")
  for k, f, t in 疑: print("  %-14s %-34s 0/%d" % (k, f, t))
  print("\n■ ② 見当たらない")
  for k, t in 無: print("  %-14s （見本の 字 %d）" % (k, t))
  if 読めず: print("\n■ ★字が 拾えない（★短い 画面）\n  " + "　".join(読めず))

  io.open(os.path.join(根, "docs/reports/_a_group_rest.json"), "w", encoding="utf-8").write(
    json.dumps({"有": 有, "無": [x[0] for x in 無], "疑": 疑, "読めず": 読めず},
               ensure_ascii=False, indent=1))
  print("\nRESULT: OK（★下書き です。★写すのは 1枚ずつ 見てから）")
  return 0


if __name__ == "__main__":
  sys.exit(main())
