#!/usr/bin/env python3
# ============================================================================
# ★「★」が、★画面に 出て いないか
#
#   ★出どころ [ACTION] Opus → Code（★2026-09-15・SEVERITY 2）
#     「★『★』is our document annotation. ★it should not ship」
#
#   ★★「★」は、★私たちが 紙の 中で 使う 印です。
#     ★★「ここが 大事」「ここに いきさつが ある」という 合図で、
#       ★読む人（★私たち）の ための ものです。
#     ★★利用者の 画面に 出る ものでは ありません。
#
#   ★★この 道具は、★コメントを 外した 本文の 中から、
#     ★**画面に 出る 字**だけを 拾います。
#     ★★コメントの 中の「★」は 数えません。★それは 正しい 使い方 です。
#
#   ★★検算（★2026-09-14 の 決め）──
#     ★私は はじめ `>…<` の 形だけで 探し、★取りこぼしました。
#     ★★行を またぐ 字や、★`{...}` の 隣の 字が 落ちます。
#     ★★だから 2通りで 数え、★数が 合うかを 見ます。
# ============================================================================

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★この 紙たちは、★画面に 出ません。★台帳・止めた もの の 覚え書きです。
SKIP = ("outboundRoutes.js", "pausedFeatures.js", "authUserReferences.js",
        "retiredWardrobe.js", "backupTables.js")


def strip_comments(t):
  """
  ★コメントを 外します。

    ★★2026-09-15、★行頭の `//` だけを 外して いました。
      ★★**行の 終わりに 付いた** コメントが 残り、
        ★`return null;  // ★分からないとき` を「画面の 字」と 数えました。
      ★★179件の うち、★ほとんどが これ でした。
    ★★`http://` を 壊さない よう、★前が `:` の ときは 外しません。
  """
  t = re.sub(r"\{/\*[\s\S]*?\*/\}", "", t)
  t = re.sub(r"/\*[\s\S]*?\*/", "", t)
  out = []
  for line in t.split("\n"):
    m = re.search(r"(?<!:)//", line)
    out.append(line[:m.start()] if m else line)
  return "\n".join(out)


def files():
  out = []
  for pat in ("lib/*.js", "components/*.jsx", "app/**/*.js", "app/**/*.jsx"):
    out += glob.glob(os.path.join(ROOT, pat), recursive=True)
  return sorted(p for p in out
                if "/tests/" not in p and not p.endswith(SKIP))


def main():
  fs = files()
  if not fs:
    print("★★読む 紙が 1枚も ありません。★数えません。★止まります。")
    return 1

  # ★① 引用符の 中の 字（★訳・定数・属性）
  quoted = []
  # ★② JSX の 地の 字（★タグと タグの あいだ）
  bare = []
  for p in fs:
    rel = os.path.relpath(p, ROOT)
    src = strip_comments(open(p, encoding="utf-8", errors="replace").read())
    for m in re.finditer(r'["\'`]([^"\'`\n]{3,}?★[^"\'`\n]*)["\'`]', src):
      v = m.group(1)
      if re.search(r"[ぁ-んァ-ヶ一-龠]", v):
        quoted.append((rel, src[:m.start()].count("\n") + 1, v))
    # ★★地の 字 ── 行ごとに 見ます。★タグでも 中かっこでも ない 行。
    for i, line in enumerate(src.split("\n"), 1):
      s = line.strip()
      if "★" not in s or s.startswith(("//", "*", "/*")):
        continue
      if re.match(r"^[^<>{}\"'`]*★[^<>{}\"'`]*$", s) and re.search(r"[ぁ-んァ-ヶ一-龠]", s):
        bare.append((rel, i, s))

  print("★「★」が 画面に 出て いないか")
  print("　★見た 紙: %d 枚（★コメントは 外して います）" % len(fs))
  print()
  print("① 引用符の 中（★訳・定数・属性）… %d 件" % len(quoted))
  for rel, ln, v in quoted:
    print("   %s:%d" % (rel, ln))
    print("      %s" % v[:88])
  print()
  # ★★記事の 本文は 分けます。
  #   ★★`lib/learnContent.js` は「学ぶ」の 記事 そのもの です。
  #     ★★書いたのは 私たちでは ありません。★著者の 字 です。
  #     ★★そこの「★」は、★著者が 強めた ところ かも しれません。
  #   ★★混ぜて 数えると、★直すべき 20件が、★117件の 中に 埋もれます。
  arts = [x for x in bare if x[0].endswith("learnContent.js")]
  rest = [x for x in bare if not x[0].endswith("learnContent.js")]
  print("② JSX の 地の 字（★タグの あいだ）… %d 件" % len(bare))
  print("   ★うち 記事の 本文（lib/learnContent.js）… %d 件" % len(arts))
  print("     ★★著者の 字 です。★強めた ところ かも しれません。★別の 話 です。")
  print("   ★うち それ以外（★画面の 字）… %d 件　★★ここが 直す ところ" % len(rest))
  print()
  for rel, ln, v in rest:
    print("   %s:%d" % (rel, ln))
    print("      %s" % v[:88])

  print()
  print("=" * 66)
  print("★この 数え 自身の 検算")
  print("　★2通りで 数えました ── ★引用符の 中と、★地の 字。")
  print("　★★はじめ `>…<` の 形だけで 探し、★取りこぼしました。")
  print("　　★行を またぐ 字と、★`{...}` の 隣の 字が 落ちます。")
  print("　★合計 %d 件。★うち 記事の 本文が %d 件。" % (len(quoted) + len(bare), len(arts)))
  print("　★★直す ところは %d 件です（★引用符 %d ＋ 画面の 字 %d）。"
        % (len(quoted) + len(rest), len(quoted), len(rest)))
  print()
  print("★★この 道具が 見て いない こと")
  print("　★組み立てて 作る 字は 見えません（★`\"あと\" + n + \"日\"` の 形）。")
  print("　★docs/ と supabase/ は 見て いません。★画面に 出ない から です。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
