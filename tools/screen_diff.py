# -*- coding: utf-8 -*-
"""★見本の 1画面と、★実装を 突き合わせる（★裁定 その84 NEW_ORDER 2）

  ★★★1画面ずつ です（★2026-09-11 の お決め）。
    ★★確かめ → 報告 → 坂本さんの ご判断 → 直し → 次の 画面。

  ★★★3つに 分けます（★2026-09-16 の お決め）。★2つでは ありません。
    ★★① 見本に あり、★実装にも ある
    ★★② 見本に あり、★実装に ない（★これから 直す もの）
    ★★③ 見本に あり、★**作らないと 決めた** もの（★わけと 引き金が 要ります）

  ★★★止まる 決まり
    ★★見本・実装・仕分けの どれかが 無ければ 止まります。
    ★★見本の 中に、★仕分けに 書かれて いない 節が あれば 止まります
      （★取り出しの 穴を、★「差が 無い」と 読ませない ため）。

  ★★呼び方  python3 tools/screen_diff.py P_meibo
"""

import io, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs", "opus", "visual-2026-09-18", "pack",
                     "00-動く見本-PC・iPad（運営）.html")


def 止まる(わけ):
  print("★止まりました ── " + わけ)
  sys.exit(2)


def 見本の塊(名):
  if not os.path.exists(MIHON):
    止まる("見本が ありません: " + MIHON)
  s = io.open(MIHON, encoding="utf-8").read()
  名前 = re.findall(r"^function (P_[A-Za-z0-9_]+)\(", s, re.M)
  if 名 not in 名前:
    止まる("見本に その 画面が ありません: " + 名)
  場所 = {n: s.index("function %s(" % n) for n in 名前}
  i = 場所[名]
  つぎ = [p for p in 場所.values() if p > i]
  return s[i:min(つぎ)] if つぎ else s[i:]


def 節を数える(塊):
  """★見本の 塊の 中の「節」を 数えます。

    ★★節 ＝ ★題（h2）・小見出し（h3）・箱（card）・表（tblwrap）・
      ★札の 並び（pills）・押しどころ（btn）・但し書き（note）・添え字（sub）
    ★★★数える ため では なく、★**書き落としを 見つける ため** です。
  """
  印 = {
    "h2": len(re.findall(r"<h2", 塊)),
    "h3": len(re.findall(r'class="h3"', 塊)),
    "card": len(re.findall(r'class="card"', 塊)),
    "tblwrap": len(re.findall(r'class="tblwrap"', 塊)),
    "pills": len(re.findall(r'class="pills"', 塊)),
    "btn": len(re.findall(r'class="btn', 塊)),
    "note": len(re.findall(r'class="note"', 塊)),
    "sub": len(re.findall(r'class="sub"', 塊))
  }
  return {k: v for k, v in 印.items() if v > 0}


def 走る(名):
  仕分け先 = os.path.join(ROOT, "tools", "screen_diff", 名 + ".json")
  if not os.path.exists(仕分け先):
    止まる("仕分けが ありません: " + 仕分け先)
  仕分け = json.loads(io.open(仕分け先, encoding="utf-8").read())

  塊 = 見本の塊(名)
  数 = 節を数える(塊)

  # ★★実装の 本文を 集めます。★1つでも 無ければ 止まります。
  部品 = 仕分け.get("実装") or []
  本文 = ""
  for f in 部品:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
      止まる("実装が ありません: " + f)
    本文 += io.open(p, encoding="utf-8").read()
  if not 本文:
    止まる("実装が 1つも 書かれて いません")

  # -------------------------------------------------------------------------
  # ★節ごとに 見ます
  # -------------------------------------------------------------------------
  節 = 仕分け.get("節") or []
  if not 節:
    止まる("節が 1つも 書かれて いません")

  # ★★★書き落としの 見つけ方 ──
  #   ★★仕分けが 申告した「見本の 節の 数」と、★機械が 数えた 数を くらべます。
  申告 = 仕分け.get("見本の節の数") or {}
  違い = {k: (数.get(k, 0), 申告.get(k)) for k in set(list(数) + list(申告))
          if 数.get(k, 0) != 申告.get(k)}
  if 違い:
    止まる("見本の 節の 数が 合いません（機械, 申告）: " + json.dumps(違い, ensure_ascii=False))

  ある, ない, 作らない = [], [], []
  for n in 節:
    見出し = n.get("見本")
    if n.get("作らない"):
      if not n.get("わけ") or not n.get("引き金"):
        止まる("『作らない』に わけ か 引き金が ありません: " + str(見出し))
      作らない.append(n)
      continue
    印 = n.get("実装の印")
    if not 印:
      止まる("印が 書かれて いません: " + str(見出し))
    見つかった = all(x in 本文 for x in (印 if isinstance(印, list) else [印]))
    (ある if 見つかった else ない).append(n)

  # ★★道具の 較正 ── ★わざと 1件、★必ず 無い 印を 探して、★見つからない こと。
  較正 = "★★★このもじれつは、どのファイルにもありません★★★"
  if 較正 in 本文:
    止まる("較正が 壊れて います（わざとの 1件が 見つかって しまいました）")

  # -------------------------------------------------------------------------
  # ★覚え書き
  # -------------------------------------------------------------------------
  今日 = datetime.date.today().isoformat()
  題 = 仕分け.get("題") or 名
  出 = os.path.join(ROOT, "docs", "reports", "%s-見本くらべ-%s.md" % (今日, 題))

  行 = []
  行.append("# ★見本くらべ ── ★%s（`%s`）" % (題, 名))
  行.append("")
  行.append("★裁定 その84 NEW_ORDER 2 ／ ★%s ／ ★`tools/screen_diff.py %s` が 書きました。"
            % (今日, 名))
  行.append("")
  行.append("★実装 …… %s" % "／".join("`%s`" % f for f in 部品))
  行.append("")
  行.append("## ★数")
  行.append("")
  行.append("| | 節 |")
  行.append("|---|---|")
  行.append("| 見本の 節 | %d |" % len(節))
  行.append("| ★① 実装にも ある | %d |" % len(ある))
  行.append("| ★② 実装に ない | %d |" % len(ない))
  行.append("| ★③ 作らないと 決めた | %d |" % len(作らない))
  行.append("")
  行.append("★機械が 数えた 見本の 印 …… %s"
            % "／".join("%s %d" % (k, v) for k, v in sorted(数.items())))
  行.append("")

  def 表(見出し, 並び, 列):
    行.append("## %s（%d）" % (見出し, len(並び)))
    行.append("")
    if not 並び:
      行.append("★ありません。")
      行.append("")
      return
    行.append("| " + " | ".join(列) + " |")
    行.append("|" + "---|" * len(列))
    for n in 並び:
      行.append("| " + " | ".join(str(n.get(c, "")).replace("|", "／") for c in 列) + " |")
    行.append("")

  表("★② 実装に ない ── ★これから 直す もの", ない, ["見本", "見本の字", "どう ちがうか"])
  表("★③ 作らないと 決めた", 作らない, ["見本", "わけ", "引き金"])
  表("★① 実装にも ある", ある, ["見本", "どう ちがうか"])

  行.append("## ★見た目")
  行.append("")
  行.append("★この 道具は **字** を 見ます。★描かれた 姿を 見て いません。")
  行.append("★★`VISUAL: UNVERIFIED` です。★実機の 写真で お確かめ ください。")

  本文出 = "\n".join(行) + "\n"
  本文出 = 本文出.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
  本文出 = 本文出.replace("{丈}", str(len(本文出.splitlines())))
  io.open(出, "w", encoding="utf-8").write(本文出)
  print(出)
  print("見本の節 %d ／ ① %d ／ ② %d ／ ③ %d" % (len(節), len(ある), len(ない), len(作らない)))


if __name__ == "__main__":
  if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(0)
  走る(sys.argv[1])
