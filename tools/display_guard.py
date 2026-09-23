#!/usr/bin/env python3
"""★★★裁定で 決めた 表示が、★実装に 残って いるか（★裁定179 §3）。

  ★★なぜ 要るか ── ★2026-09-13、★くらべるの 図から 裁定の 表示が 消えました。
    ★`promise_diff` は 註の **文**を 見ます。★図・帯・凡例・色の 系統は 文では ありません。
    ★`ruling_mock_check` は 見本を 見ます。★**実装から 消えた こと**は 見ません。
    ★★★だから この 道具が 要ります。

  ★★見るのは `tools/display_registry.json` の 行 だけ です。
    ★★載せて いない 表示は 守れません。★裁定を 書く 日に 1行 足して ください。

  python3 tools/display_guard.py            ★見ます
  python3 tools/display_guard.py --selftest ★当たり合わせ（★わざと 崩して 見つかるか）
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
台 = os.path.join(ROOT, "tools", "display_registry.json")


def 註を落とす(s):
  """★註の 中の 字を 処理と 読まない ため（★台帳 08-10 と 同じ 決め）。"""
  s = re.sub(r"/\*[\s\S]*?\*/", " ", s)
  return "\n".join(re.sub(r"//.*$", "", 行) for 行 in s.split("\n"))


def 読む(場所):
  """★1つの ファイル、★または 1つの 置場の 下 ぜんぶ を 読みます。"""
  p = os.path.join(ROOT, 場所)
  出 = {}
  if os.path.isfile(p):
    出[場所] = io.open(p, encoding="utf-8").read()
    return 出
  if not os.path.isdir(p):
    return 出
  for 根, 枝, ファイル in os.walk(p):
    枝[:] = [x for x in 枝 if x not in ("node_modules", "tests")]
    for f in sorted(ファイル):
      if f.endswith((".js", ".jsx")):
        道 = os.path.relpath(os.path.join(根, f), ROOT)
        出[道] = io.open(os.path.join(根, f), encoding="utf-8").read()
  return 出


def 見る(行, 落とすか=True):
  """★その 行が 守られて いるか。★（守られて いる, 言い分）を 返します。"""
  文 = {}
  for 場所 in (行.get("where") or ["components", "lib", "app"]):
    文.update(読む(場所))
  if not 文:
    return False, "★探す ところが ありません（%s）" % (行.get("where"))
  中身 = {k: (註を落とす(v) if 落とすか else v) for k, v in 文.items()}
  # ★★★「出しては いけない」を **禁じて いる ところ** は 数えません（★2026-09-23）。
  #   ★★`lib/opsExport.js` の `FORBIDDEN_COLUMNS` は、
  #     ★体調の 列の 名を 並べて います。★それは **出さない ため** の 並び です。
  #   ★★★数えると、★禁じて いる ことを もって「禁を 破った」と 言う ことに なります。
  #     ★この 家で 4度 起きた 形 です（★お約束の 字・JSX の `}>`・註 …）。
  #   ★★ゆるめる ところは、★台帳の 行に 名指しで 書きます（`allow_in`）。
  #     ★★書いた ものだけ、★その 宣言の 中身を 外して から 探します。
  for 名 in (行.get("allow_in") or []):
    for k in list(中身):
      中身[k] = re.sub(
        r"(?:export\s+)?const\s+" + re.escape(名) + r"\s*=[\s\S]*?\]\s*\)?\s*;",
        " ", 中身[k])
  欲 = 行["must"] == "ある"
  無 = []
  有 = []
  for 印 in 行["markers"]:
    どこ = [k for k, v in 中身.items() if 印 in v]
    if どこ:
      有.append((印, どこ[0]))
    else:
      無.append(印)
  if 欲:
    if 無:
      return False, "★消えて います …… " + "／".join(無)
    return True, "★ぜんぶ あります（%d）" % len(有)
  if 有:
    return False, "★出て います …… " + "／".join("%s（%s）" % x for x in 有)
  return True, "★1つも ありません"


def main(引):
  d = json.load(io.open(台, encoding="utf-8"))
  行たち = d["rows"]
  落ち = []
  print("★★★裁定で 決めた 表示 ── %d 行" % len(行たち))
  for 行 in 行たち:
    ok, 言 = 見る(行)
    print("  %s 裁定%-4s %-22s %-34s %s"
          % ("ok  " if ok else "★NG", 行["ruling"], 行["screen"][:22], 行["shows"][:34], 言))
    if not ok:
      落ち.append(行)
  print()
  if 落ち:
    print("RESULT: NG ── ★裁定の 表示が %d 件 守られて いません" % len(落ち))
    for 行 in 落ち:
      print("   ★裁定%s ／ %s ／ %s" % (行["ruling"], 行["screen"], 行["shows"]))
    print("   ★★消した なら、★先に 裁定を 直して ください。★台帳の 行も 一緒に 直します。")
    return 1
  print("RESULT: OK ── ★%d 行 とも 守られて います" % len(行たち))
  print("   ★★ここに 載せて いない 表示は 守れません。★裁定を 書く 日に 1行 足して ください。")
  return 0


def selftest():
  """★★わざと 崩して、★見つかる ことを 確かめます。"""
  print("★★当たり合わせ")
  ok = True
  # ㋐ ある はずの 印を 1つ 足した 行 …… ★無い 印を 混ぜると 落ちる
  行 = {"ruling": "test", "screen": "ためし", "shows": "ためし",
        "markers": ["hadPerformanceOrLesson", "konna_namae_wa_nai"],
        "must": "ある", "where": ["components/LineUpChart.jsx"]}
  よ, 言 = 見る(行)
  print("   ㋐ 無い 印を 混ぜる → %s（%s）" % ("★見つけました" if not よ else "★★見のがし", 言))
  ok = ok and not よ
  # ㋑ ある 印だけ なら 通る
  行["markers"] = ["hadPerformanceOrLesson"]
  よ, 言 = 見る(行)
  print("   ㋑ ある 印だけ → %s（%s）" % ("★通りました" if よ else "★★落ちました", 言))
  ok = ok and よ
  # ㋒「ない」の 行 …… ★本当に ある ものを 挙げると 落ちる
  行 = {"ruling": "test", "screen": "ためし", "shows": "ためし",
        "markers": ["hadPerformanceOrLesson"], "must": "ない",
        "where": ["components/LineUpChart.jsx"]}
  よ, 言 = 見る(行)
  print("   ㋒「ない」に ある ものを 挙げる → %s" % ("★見つけました" if not よ else "★★見のがし"))
  ok = ok and not よ
  # ㋓ 註の 中の 字は 数えない
  行 = {"ruling": "test", "screen": "ためし", "shows": "ためし",
        "markers": ["見本の 数。★1つも 変えていません"], "must": "ない",
        "where": ["components/LineUpChart.jsx"]}
  よ, 言 = 見る(行)
  print("   ㋓ 註の 中の 字 → %s" % ("★数えません（正）" if よ else "★★数えて しまいました"))
  ok = ok and よ
  print("RESULT:", "OK" if ok else "NG")
  return 0 if ok else 1


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv[1:]))
