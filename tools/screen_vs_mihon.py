#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★1つの 画面を、★見本と 突き合わせる（★どの 画面でも 使えます）。

  ★出どころ 2026-09-14。★A03・A01 で 同じ 道具を 3回ずつ 直しました。
    ★★毎回 同じ ところで つまずきました ──
      ★① 読む ファイルを 決め打ちし、★言葉の ある lib を 読み落とす
      ★② 見本を 関数の 中だけ 探し、★外に ある 仕掛け（foldNotes）を 落とす
      ★③ アプリ側を 丸ごと 探し、★**別の 画面**の 字を「ある」と 数える
    ★★だから、★1本に まとめます。★次の 画面から 直さずに 済みます。

  ★★使い方
      python3 tools/screen_vs_mihon.py <画面の 名前>

  ★★数え方は 3つ。
    ★① 見本の 字が、★**その 画面の ファイル**に あるか
    ★② 見本に 無い ものが、★その 画面に 出て いないか
    ★③ 足りない ものの 出どころ（★git）── ★遅れか、★わざとか
"""

import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
RAW = io.open(MI, encoding="utf-8").read()

# ★★画面ごとの 決め（★1か所）。
#   ★fn    … 見本の 関数の 名前
#   ★files … **その 画面を 作って いる** ファイル。★ほかは 入れません
#   ★words … 見本の 字（★1文字も 変えない もの）
#   ★extra … 見本に 無い ものの 手がかり
SCREENS = {
  # ★★2026-09-14、★読む ファイルを 直しました。
  #   ★`components/LineUpV2.jsx` は **ありません**。★私の 書き間違いです。
  #     ★★無い ファイルを 読み飛ばして いたので、★A04 の 数が 甘く 出ます。
  #   ★★A04 と A05 は、★**同じ 1つの 部品**の 中の 2つの 札 です
  #     （`components/LookBackV2.jsx:234` の seg ── narabe / sakanobo）。
  #   ★★さかのぼるの「前の3日」は `LookBackPanel.jsx` が 描きます
  #     （★`VocalTracker.jsx:18603` から）。★A05 の 一部 です。
  "A04": {
    "fn": "narabe",
    "files": ["components/LookBackV2.jsx", "components/LineUpChart.jsx",
              "lib/lineUp.js"],
    "words": [],
    "extra": [],
  },
  # ★★もっと（★2026-09-15・A群の 棚おろしの 続き）。
  #   ★★見本は `SC['もっと']` です。★`function` では ありません。
  #   ★★作って いるのは `components/VocalTracker.jsx` の
  #     `{activeTab === "more" && (` の 中（★:21797〜）だけ です。
  #     ★ほかの ファイルは 入れません（★A01 で 3度 まちがえた ところ）。
  "もっと": {
    "fn": "もっと",
    # ★★2026-09-15、★はじめ VocalTracker だけ にして、★8件を「足りない」と 数えました。
    #   ★★`lib/moreMenu.js` が 行の 決めを 持って います（★:21810 の 注記）。
    #   ★★A05 の `LookBackPanel.jsx` と、★まったく 同じ 見落とし です。
    #     ★★「無い ファイルを 入れる」は 止められる ように しました。
    #       ★「★在る ファイルを 落とす」は、★まだ 止められません。
    "files": ["components/VocalTracker.jsx", "lib/moreMenu.js"],
    "words": [],
    "extra": [],
  },
  "A05": {
    "fn": "sakanobo",
    "files": ["components/LookBackV2.jsx", "components/LookBackPanel.jsx",
              "lib/lookBack.js"],
    "words": [],
    "extra": [],
  },
}


def mihon_of(fn):
  """★見本の 1画面を 切り出します。

    ★★見本には **2つの 書き方**が あります（★2026-09-15 に 気づきました）。
      ★① `function narabe(){ … }`      ── A01〜A05 は これ
      ★② `SC['もっと']=function(){ … }` ── ★もっと・設定・プラン は これ
    ★★①だけを 見て いたので、★②の 画面は 端から 比べられません でした。
  """
  key = "function " + fn + "("
  if key in RAW:
    i = RAW.index(key)
    j = RAW.find("\nfunction ", i + 10)
    k = RAW.find("\nSC['", i + 10)
    ends = [x for x in (j, k) if x > 0]
    return RAW[i:min(ends)] if ends else RAW[i:]
  key = "SC['" + fn + "']=function()"
  if key in RAW:
    i = RAW.index(key)
    j = RAW.find("\nSC['", i + 10)
    k = RAW.find("\nSH['", i + 10)
    m = RAW.find("\nfunction ", i + 10)
    ends = [x for x in (j, k, m) if x > 0]
    return RAW[i:min(ends)] if ends else RAW[i:]
  raise KeyError("★見本に「" + fn + "」が ありません（function / SC[] の どちらでも）")


def read_all():
  """★components と lib を まるごと。★どこに 言葉が あるか 分からない ためです。"""
  out = {}
  for d in ("components", "lib"):
    base = os.path.join(ROOT, d)
    for root, dirs, fs in os.walk(base):
      dirs[:] = [x for x in dirs if x != "tests"]
      for f in sorted(fs):
        if f.endswith((".js", ".jsx")):
          rel = os.path.relpath(os.path.join(root, f), ROOT)
          out[rel] = io.open(os.path.join(root, f), encoding="utf-8").read()
  return out


def jp_strings(seg):
  """★見本の 中の、★人に 見える 日本語を 抜き出す。

    ★★手で 選ぶと、★自分の 造語を 混ぜます（★B02 で やりました）。
      ★だから 機械で 抜きます。
  """
  out = []
  for m in re.finditer(r"'([^']{4,60})'", seg):
    t = m.group(1)
    if not re.search(r'[ぁ-んァ-ヶ一-龥]', t):
      continue
    if re.search(r'[<>{}\\]|onclick|function|class=|style=', t):
      continue
    out.append(t)
  # ★★タグの 間の 字も 拾います。
  for m in re.finditer(r'>([^<>\'"]{3,60})<', seg):
    t = m.group(1).strip()
    if t and re.search(r'[ぁ-んァ-ヶ一-龥]', t) and "+" not in t:
      out.append(t)
  seen = []
  for t in out:
    if t not in seen:
      seen.append(t)
  return seen


def main():
  key = sys.argv[1] if len(sys.argv) > 1 else ""
  if key not in SCREENS:
    print("★画面の 名前: " + ", ".join(sorted(SCREENS)))
    sys.exit(1)
  spec = SCREENS[key]
  seg = mihon_of(spec["fn"])
  ALL = read_all()
  mine = "\n".join(ALL.get(f, "") for f in spec["files"])
  # ★★コメントを 外した もの。★③の 検算は こちらで 見ます。
  #   ★★「書いて ある」と「★画面に 出る」は 別 です。
  def _strip(t):
    t = re.sub(r"/\*[\s\S]*?\*/", "", t)
    t = re.sub(r"(?m)^\s*//.*$", "", t)
    t = re.sub(r"(?m)^\s*\*.*$", "", t)
    return t
  mine_code = "\n".join(_strip(ALL.get(f, "")) for f in spec["files"])
  missing_files = [f for f in spec["files"] if f not in ALL]

  words = spec["words"] or jp_strings(seg)
  print("★" + key + "　見本 `" + spec["fn"] + "()`")
  # ★★2026-09-14、★ここで **止める** ように しました。
  #   ★★前は「見あたらない」と 1行 出して、★そのまま 数えて いました。
  #     ★★`components/LineUpV2.jsx` は **存在しません**。★私の 書き間違いです。
  #     ★★黙って 飛ばされ、★在る 字まで「無い」と 数えられて いました。
  #     ★★その 数を「12件」として お伝えして しまいました。
  #   ★★数えを 出す 前に 止めます。★誤った 数を 出すより、★出さない ほうが よい。
  if missing_files:
    print("　★★★止めます ── ★読む ファイルが ありません:")
    for f in missing_files:
      print("　　・" + f)
    print("　★SCREENS の files を 直して ください。")
    print("　★★無い ファイルを 飛ばして 数えると、★在る 字まで「無い」に なります。")
    return 1
  print("　★見る ファイル: " + ", ".join(spec["files"]))
  print()
  print("① 見本の 字（★機械で 抜きました・" + str(len(words)) + "語）")
  miss = []
  for w in words:
    if w in mine:
      print("  ✓ " + w[:46])
    else:
      elsewhere = [k for k, v in ALL.items() if w in v]
      miss.append((w, elsewhere))
      print("  ✗ " + w[:46]
            + ("　（ほかの 画面には: " + elsewhere[0] + "）" if elsewhere else ""))
  print()
  print("  ★足りない: " + str(len(miss)) + " / " + str(len(words)))

  print("\n② 足りない ものの 出どころ（★git）")
  for w, _ in miss:
    r = subprocess.run(["git", "log", "--oneline", "-S", w, "--",
                        "components", "lib"], cwd=ROOT,
                       capture_output=True, text=True)
    n = len([x for x in r.stdout.split("\n") if x.strip()])
    print("  「" + w[:34] + "」… " + ("★一度も 書かれて いません"
                                     if n == 0 else str(n) + " 便が 触れて います"))

  # ------------------------------------------------------------------
  # ★③ ★抜き出しの 漏れ（★2026-09-14）
  #
  #   ★★坂本さん ──「見本の 該当箇所を すべて 拾えて いるか も 見直して」
  #   ★★実際に 落ちて いました ──
  #     「本番だけに すると、0件に なります。」
  #     ★見本では `'…<br>' + '本番だけに…'` と `+` で つないで います。
  #     ★★`jp_strings` は 引用符の 中を 1つずつ 見るので、
  #       ★つないだ 先の 塊を **別の 字**として 扱い、
  #       ★★`words` に 入れそこねて いました。
  #   ★★だから、★**拾い残しを 自分で 数えます**。
  #     ★見本の 中の 日本語を すべて 出し、★`words` が 覆って いない ものを 並べます。
  #     ★★「0件」と 出る ことが、★拾えた ことの 証しに なります。
  # ------------------------------------------------------------------
  print("\n③ ★見本から 拾い残した 字（★この 数え 自身の 検算）")
  flat = re.sub(r"<[^>]*>", "", seg)          # ★札を 外す
  flat = re.sub(r"\\['\"]", "", flat)          # ★逃がした 引用符
  runs = set()
  for m in re.finditer(r"[ぁ-んァ-ヶ一-龥][ぁ-んァ-ヶ一-龥０-９0-9、。「」・…％×〜ー 　]{3,}", flat):
    t = m.group(0).strip()
    if len(t) >= 5:
      runs.add(t)
  joined = "\n".join(words)
  lost = []
  # ★★2026-09-14、★ここを 1度 まちがえました。
  #   ★★はじめ「6文字でも 重なれば 拾えて いる」と しました。★ゆるすぎ ました。
  #   ★`本番だけに すると、0件に なります。文章を 添えません。…` の 塊は、
  #   ★うしろ半分が `words` に あった ので、★前半も「拾えた」に なりました。
  #   ★★だから、★**文ごと**に 見ます。★「。」で 切って、★1文ずつ 確かめます。
  for t in sorted(runs):
    for one in [x.strip() for x in t.split("。") if len(x.strip()) >= 5]:
      if one in joined:
        continue
      lost.append(one + "。")
  # ★★「。」で 切って いるので、★見本の 1文 とは 限りません。
  #   ★★だから、★これは「★見落としの **候補**」です。★そのまま 差分では ありません。
  #   ★★多めに 出します。★黙って 見落とす より、★見て 捨てる ほうが 安全です。
  #   ★★アプリに 在るかも 添えます。★在れば、★差分では ありません。
  if lost:
    print("　★★%d 件。★「。」で 切った 断片 なので、★見本の 1文 とは 限りません。" % len(lost))
    print("　★見て、★差分か どうかを 決めて ください。")
    for t in lost[:20]:
      body = t.rstrip("。")
      # ★★2026-09-15、★ここで つまずきました。
      #   ★「規約が この語で 書かれています。」が「★アプリに あります」と 出ました。
      #   ★★在ったのは **コメントの 中** でした（VocalTracker.jsx:21803）。
      #   ★★この 倉庫の 持病です ── 「禁じ語の 検査は、★コメントを 外してから」。
      #     ★`components/tests/_source.js` が、★同じ 罠で 2度 作られました。
      #   ★★だから、★コメントを 外した もので 見ます。
      here = "★アプリに あります" if body in mine_code else "★★アプリに ありません"
      print("　　・%s　── %s" % (t, here))
  else:
    print("　✓ ★拾い残しは ありません")

  print("\n★★この 数えが 見て いない こと")
  print("　★字が あるか だけ です。★色・大きさ・並びは 描いて 測ります。")
  print("　★★読む ファイルが 1つでも 無ければ、★数えずに 止まります（★2026-09-14）。")


sys.exit(main() or 0)
