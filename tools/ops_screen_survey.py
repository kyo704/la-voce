#!/usr/bin/env python3
"""★見本の 1画面を、★字の 上で 数える（★突き合わせの 前の 下見）。

  ★★★絵で 比べる 前に、★何が ある 画面かを 数えます。
    ★★絵は 1画面 ずつ しか 見られません。
    ★★先に「どれが 大きい 仕事か」を 知って から 順を 決めます。

  ★★数だけ 出します。★見立ては 書きません。
    ★★見立ては、★絵を 見て から 書きます。

  ★使い方  python3 tools/ops_screen_survey.py P_setPost P_postDetail …
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html")


def 切り出す(s, 名):
  i = s.find("function %s(" % 名)
  if i < 0:
    return None
  # ★★次の `function ` の 手前 まで。★入れ子の function は 数えません。
  j = s.find("\nfunction ", i + 1)
  return s[i:(j if j > 0 else len(s))]


def 数える(本体):
  def 拾う(pat):
    return [m.group(1).strip() for m in re.finditer(pat, 本体)]
  return {
    "行数": len(本体.split("\n")),
    "小見出し": 拾う(r'class="h3"[^>]*>([^<]+)<'),
    "札": 拾う(r'class="btn[^"]*"[^>]*>([^<]{1,24})<'),
    "行": len(re.findall(r'class="li', 本体)),
    "箱": len(re.findall(r'class="card', 本体)),
    "入れる口": len(re.findall(r'class="inp', 本体)),
    "断り": 拾う(r'class="(?:note|warn|wl)"[^>]*>([^<]{1,60})'),
  }


if __name__ == "__main__":
  if not os.path.exists(MIHON):
    print("★止まりました ── 見本が ありません: %s" % MIHON)
    sys.exit(1)
  s = io.open(MIHON, encoding="utf-8").read()
  名たち = sys.argv[1:]
  if not 名たち:
    print(__doc__)
    sys.exit(0)
  抜け = [n for n in 名たち if 切り出す(s, n) is None]
  if 抜け:
    # ★★★1つでも 無ければ 止まります（★2026-09-16 の 決まり）。
    print("★止まりました ── 見本に ありません: %s" % "、".join(抜け))
    sys.exit(1)
  for n in 名たち:
    d = 数える(切り出す(s, n))
    print("── %s ──" % n)
    print("  行数 %d ／ 箱 %d ／ 行 %d ／ 入れる口 %d"
          % (d["行数"], d["箱"], d["行"], d["入れる口"]))
    print("  小見出し: %s" % ("、".join(d["小見出し"]) or "（ありません）"))
    print("  札: %s" % ("、".join(d["札"]) or "（ありません）"))
    for x in d["断り"]:
      print("  断り: %s" % x[:56])
