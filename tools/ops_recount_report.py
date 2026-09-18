#!/usr/bin/env python3
"""★数え直しの 紙を 作る（★2026-09-18・Opus 裁定）。

  ★★`tools/ops_recount.js` が 出した 数 **だけ** から 作ります。
    ★★手で 書き足しません（★2026-09-13 の 決まり）。

  ★使い方  python3 tools/ops_recount_report.py 設定 ご請求
"""
import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def 読む(tab, st2):
  p = os.path.join(ROOT, "docs/design/compare/ops", "recount-%s-%s.json" % (tab, st2))
  if not os.path.exists(p):
    print("★止まりました ── 数が ありません: %s" % p)
    print("　★先に  node tools/ops_recount.js %s %s 学長" % (tab, st2))
    sys.exit(1)
  return json.load(io.open(p, encoding="utf-8"))


def 表(見, 実):
  行 = []
  行.append("| 測るもの | 見本 | 実装 | ちがい |")
  行.append("|---|---:|---:|---|")
  for 名, k in (("高さ（px）", "高さ"), ("箱の数", "箱"), ("行の数", "行")):
    a, b = 見[k], 実[k]
    行.append("| %s | %s | %s | %s |" % (
      名, a, b, "同じ" if a == b else ("実装が %+d" % (b - a))))
  for 名, k in (("小見出しの数", "小見出し"), ("押せるものの数", "押せるもの")):
    a, b = len(見[k]), len(実[k])
    行.append("| %s | %s | %s | %s |" % (
      名, a, b, "同じ" if a == b else ("実装が %+d" % (b - a))))
  return "\n".join(行)


def 差(見, 実, k, 題):
  a, b = list(見[k]), list(実[k])
  無い = [x for x in a if x not in b]
  多い = [x for x in b if x not in a]
  出 = ["### %s" % 題, ""]
  出.append("★見本に あって 実装に 無い ── %d" % len(無い))
  出 += (["　・%s" % x for x in 無い] if 無い else ["　（ありません）"])
  出.append("")
  出.append("★実装に あって 見本に 無い ── %d" % len(多い))
  出 += (["　・%s" % x for x in 多い] if 多い else ["　（ありません）"])
  出.append("")
  return "\n".join(出)


if __name__ == "__main__":
  tab = sys.argv[1] if len(sys.argv) > 1 else "設定"
  st2 = sys.argv[2] if len(sys.argv) > 2 else "ご請求"
  d = 読む(tab, st2)
  見, 実 = d["見本"], d["実装"]

  本 = []
  本.append("# ★%s・%s ── ★数え直し（★1枚で 比べない）" % (tab, st2))
  本.append("")
  本.append("★この 行は あとで 差し替えます")
  本.append("")
  本.append("★決まり（★2026-09-18・Opus）── ★①高さを 測る ②上・中・下 の 3枚 ③節を 数える")
  本.append("")
  本.append("★数は `tools/ops_recount.js` が 出しました。★この 紙は その 数 **だけ** から 作って います。")
  本.append("")
  本.append("## 一 ★数")
  本.append("")
  本.append(表(見, 実))
  本.append("")
  本.append("★見本は、★器の 中で %d px 巻いて いました（★見える %d ／ ぜんぶ %d）。"
            % (見["ぜんぶ"] - 見["見える"], 見["見える"], 見["ぜんぶ"]))
  本.append("　★★1枚 撮る と、★上の %d px しか 写りません。" % 見["見える"])
  本.append("")
  本.append("## 二 ★節（小見出し）")
  本.append("")
  本.append(差(見, 実, "小見出し", "小見出し"))
  本.append("## 三 ★押せる もの")
  本.append("")
  本.append(差(見, 実, "押せるもの", "押せる もの"))
  本.append("## 四 ★絵（上・中・下）")
  本.append("")
  for 側, 名 in (("見本", "mihon"), ("実装", "jikki")):
    for 所 in ("上", "中", "下"):
      本.append("　★%s %s … `docs/design/compare/ops/%s-%s-%s-%s.png`"
                % (側, 所, 名, tab, st2, 所))
  本.append("")
  本.append("## 五 ★まだ 何も 直して いません")

  L = 本
  最後 = [x for x in L if x.strip()][-1]
  L[2] = "全%d行 / 末尾は「%s」" % (len(L), 最後)
  道 = os.path.join(ROOT, "docs/reports", "2026-09-18-%s-%s-数え直し.md" % (tab, st2))
  io.open(道, "w", encoding="utf-8").write("\n".join(L) + "\n")
  print("★紙を 作りました: %s" % os.path.relpath(道, ROOT))
  print(L[2])
