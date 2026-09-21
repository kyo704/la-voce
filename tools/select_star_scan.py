#!/usr/bin/env python3
"""★`select('*')` と `select()` を 探します（★実行ルート 5-1・2026-09-22）。

  ★★探すのは 4つ の 形 です（★済みの目安 ① の とおり）──
    ① `.select('*')`        ② `.select("*")`
    ③ `.select()`（引数なし） ④ `.select('*', {...})`

  ★★★註と 字の 中は 見ません。★`tools/strip_common.py` を 通します。
    ★★わけ …… この 検べは **振る舞い** を 探して います（★STRIP: A）。
      ★★註に「`select('*')` を 書かない」と 書いて あるのを
        ★★見つけて しまうと、★直せない 行が 1つ 残り続けます。

  ★★★わざと 使って いる ところが あります。★下に 名ざしで 書きます。
    ★★名ざしの 一覧が 古く なる ことを、★道具の 側で 見張ります ──
      ★消えた ところが 一覧に 残って いたら、★止まります。

  ★使い方
    python3 tools/select_star_scan.py            ★探す
    python3 tools/select_star_scan.py --selftest ★道具を 較正する
"""
import glob, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from strip_common import strip_js

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★★わざと `*` を 使って いる ところ（★わけ と 外す 条件 つき）。
#   ★★「ぜんぶ お渡しする」道 です。★列を 名ざしに すると、
#     ★★足した 列が 黙って 漏れます。★漏れたら ご本人が 取り出せません。
WAZATO = {
  "app/api/org/invitation/lookup/route.js": {
    "わけ": "★管理の 客（service role）。★出すのは 学校の 名 だけ。"
            "★列を 名ざしに すると、★知らない 列で 要求ごと 落ちます（PGRST204）",
    "外す条件": "★`org_invitations` の 列が `lib/dbColumns.js` に 載った 日",
  },
  "components/VocalTracker.jsx": {
    "わけ": "★ご本人の 書き出し。★足した 列が 書き出しから 漏れない ため",
    "外す条件": "★`lib/exportData.js` が 列を 持つ ように なった 日",
  },
  "lib/accountDeletion.js": {
    "わけ": "★ご本人の 書き出し（退会の 前）。★上と 同じ わけ",
    "外す条件": "★上と 同じ 日",
  },
}

KATA = [
  ("'*'",     re.compile(r"""\.select\(\s*(['"`])\*\1""")),
  ("引数なし", re.compile(r"""\.select\(\s*\)""")),
]


def 見る(files):
  out = []
  for f in sorted(files):
    s = open(f, encoding="utf-8").read()
    c = strip_js(s)
    c = c.code if hasattr(c, "code") else c
    for 名, p in KATA:
      for m in p.finditer(c):
        out.append((os.path.relpath(f, ROOT), c[:m.start()].count("\n") + 1, 名))
  return out


def 集める():
  files = []
  for root in ("app", "lib", "components"):
    for ext in ("js", "jsx"):
      files += glob.glob(os.path.join(ROOT, root, "**", "*." + ext), recursive=True)
  return [f for f in files if "/tests/" not in f and "node_modules" not in f]


def selftest():
  """★較正 ── ★見つける はずの ものを 見つけ、★見つけない はずの ものを 見つけない。"""
  import tempfile
  ok = True
  見つける = [
    '.select("*")', ".select('*')", ".select(`*`)", ".select()", ".select( )",
    '.select("*", { count: "exact" })',
  ]
  見つけない = [
    '.select("id")', '.select(COLS)', '// .select("*") と 書かない',
    '/* .select() */', 'const s = ".select(\\"*\\")";',
  ]
  for i, 字 in enumerate(見つける):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fp:
      fp.write("const x = await sb.from('t')" + 字 + ";\n")
      名 = fp.name
    if not 見る([名]):
      print("SELFTEST FAIL: 見つける はずが 見つかりません ──", 字); ok = False
    os.unlink(名)
  for 字 in 見つけない:
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fp:
      fp.write(字 + "\n")
      名 = fp.name
    if 見る([名]):
      print("SELFTEST FAIL: 見つけない はずが 見つかります ──", 字); ok = False
    os.unlink(名)
  print("SELFTEST", "PASS" if ok else "FAIL")
  return 0 if ok else 2


def main():
  当たり = 見る(集める())
  わざと = [h for h in 当たり if h[0] in WAZATO]
  のこり = [h for h in 当たり if h[0] not in WAZATO]

  print("SELECT_STAR_SCAN")
  print("  見たファイル", len(集める()))
  print("  当たり", len(当たり), "（わざと", len(わざと), "／のこり", len(のこり), "）")
  for f, l, k in のこり:
    print("  NG  %s:%d  %s" % (f, l, k))
  for f, l, k in わざと:
    print("  わざと  %s:%d  %s  -- %s" % (f, l, k, WAZATO[f]["わけ"]))

  # ★★一覧が 古く なって いないか。★消えた ところが 残って いたら 止まります。
  いる = {h[0] for h in 当たり}
  死んだ = [k for k in WAZATO if k not in いる]
  for k in 死んだ:
    print("  NG  わざと の 一覧が 古い ──", k, "に もう ありません")

  print("RESULT:", "PASS" if not のこり and not 死んだ else "NG（%d件）" % (len(のこり) + len(死んだ)))
  return 0 if not のこり and not 死んだ else 1


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
