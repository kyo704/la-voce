# -*- coding: utf-8 -*-
"""★検査 その4 ── ★同じ形の 穴を さがす（★2026-09-19／20・お決め D84）

  ★★★この 蔵で 1度 起きた 誤りは、★同じ 形で もう1度 起きます。
    ★★だから「直した 形」を 1つずつ 書き留め、★全体に 当てます。
    ★★★1か所 直して 終わりに しません。★同じ 形を ぜんぶ 数えます。

  ★★★形は 下の `形` に 書きます。★1つずつ ──
    ★名 ／ 何を さがすか ／ どこを 見るか ／ なぜ 危ないか
    ★★当たり（★必ず 当たる 字）と 外れ（★当たっては いけない 字）を 付けます。
    ★★★較正の 無い 形は 足しません。★黙って 0件を 出す 道具に しません。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

形 = [
  {
    "名": "0行を 成功に する（`.update` / `.delete` に `.select()` が 無い）",
    # ★★★台帳への 書き だけ を 見ます（★2026-09-20）。
    #   ★★`crypto.createHmac(...).update(body)` まで 拾って いました。
    #   ★★★`.from("表")` から 始まる ところ だけ を 見ます。
    #   ★★そのあと 240字 の うちに `.select(` が あれば よし と します。
    "さがす": r'\.from\(["\']([a-z_]+)["\']\)[\s\S]{0,120}?\.(update|delete)\(',
    "あとに要る": r"\.select\(",
    "どこ": ["components", "lib", "app"],
    "わけ": "PostgREST は 0行でも 成功を 返します。★消えて いないのに「消しました」と 出ます。",
    "誤りでない例": "消えたか どうかを 見なくて よい 書き（★見た 印・並びの 保存 など）。"
                    "★1つずつ 見て ください。",
    "まとめて": True,
    "当たり": '.from("t").delete().eq("id", x)',
    "外れ": '.from("t").delete().eq("id", x).select("id")'
  },
  {
    "名": "禁じ字を 覚え書きごと さがして いる 見張り",
    "さがす": r"readRaw\([^)]*\)[\s\S]{0,120}?(禁じ|出さない|書かない|含まない)",
    "どこ": ["components/tests"],
    "わけ": "覚え書きに 書いた「〜を 出さない」で、★自分の 説明に 落ちます。"
            "★`readCode`（覚え書きを 外した 字）で 見る こと。",
    "当たり": 'const x = readRaw("a"); // 禁じ',
    "外れ": 'const x = readCode("a");'
  },
  {
    "名": "測った 数を 覚えて いる 見張り",
    "さがす": r"(assert(?:Equal)?|eq)\([^,]*\.length,\s*\d{2,}",
    "どこ": ["components/tests"],
    "わけ": "数は 動きます。★正しい 直しで 落ちる 見張りは、★直すのを 止めます。",
    "誤りでない例": "決めた 数（★職業 11個・合言葉 12文字 など）。"
                    "★あれは 測った 数では なく、★決めた 数 です。",
    "当たり": "assertEqual(rows.length, 33, '…')",
    "外れ": "assertEqual(rows.length, 0, '…')"
  },
  {
    "名": "門の 外れに 倒れる 比べ（`!== \"Bearer undefined\"` の 形）",
    "さがす": r'!==\s*[`"\']Bearer \$\{?[A-Za-z_]',
    "どこ": ["app"],
    "わけ": "合言葉が 無い とき、★`Bearer undefined` を 送る 相手に 通ります。"
            "★無い ときは 503 で 止める こと。",
    # ★★★先に 503 で 止めて いれば、★誤りでは ありません（★2026-09-20）。
    #   ★★5本 とも 止めて いました。★道具が 鳴って いた だけ です。
    "ファイルに無ければ": r"status:\s*503",
    "当たり": 'if (auth !== `Bearer ${process.env.CRON_SECRET}`)',
    "外れ": 'if (!process.env.CRON_SECRET) return new Response("", { status: 503 });'
  },
  {
    "名": "`select(\"*\")` を 画面の 門の 後ろに 置く",
    "さがす": r'\.select\("\*"\)',
    "どこ": ["components", "app"],
    "わけ": "決まり（RLS）は 行を 守ります。★列は 隠せません。"
            "★画面に 出さなくても、★通信には 乗ります。",
    "誤りでない例": "ご本人の 行 だけ を 引く ところ（★自分の 記録）。"
                    "★よその 方の 行を 引く ところ だけ が 危ういです。",
    "当たり": '.select("*")',
    "外れ": '.select("id, name")'
  },
  {
    "名": "読めなかった ときに 空を 入れる",
    "さがす": r"error\s*\?\s*\[\]\s*:",
    "どこ": ["components", "lib"],
    "わけ": "「無い」と「読めて いない」が 同じ 顔に なります。"
            "★空の 一覧を 出し、★『ありません』と 嘘を つきます。",
    "誤りでない例": "添えものの 一覧（★時限・読んだ 印 など）で、"
                    "★空でも 嘘に ならない ところ。",
    "当たり": "setRows(error ? [] : data)",
    "外れ": "setRows(error ? null : data)"
  }
]


def 本を集める(どこら):
  出 = {}
  for d in どこら:
    base = os.path.join(ROOT, d)
    if not os.path.isdir(base):
      continue
    for b, _, files in os.walk(base):
      if "node_modules" in b:
        continue
      for f in files:
        if f.endswith((".js", ".jsx")):
          p = os.path.join(b, f)
          出[os.path.relpath(p, ROOT)] = io.open(p, encoding="utf-8").read()
  return 出


def main():
  結 = []
  for か in 形:
    r = re.compile(か["さがす"])
    # ★★★較正 ── ★当たりを 当て、★外れを 当てない こと。
    要 = か.get("あとに要る")

    def 当たるか(字):
      m = r.search(字)
      if not m:
        return False
      # ★★「要る もの」が あとに 続けば、★当たりでは ありません。
      if 要 and re.search(要, 字[m.end():m.end() + 240]):
        return False
      return True

    if not 当たるか(か["当たり"]):
      raise SystemExit("★止まりました ── 当たりを 当てられません: " + か["名"])
    if 当たるか(か["外れ"]):
      raise SystemExit("★止まりました ── 外れまで 当てて います: " + か["名"])

    当 = []
    for み, 本 in sorted(本を集める(か["どこ"]).items()):
      if か.get("まとめて"):
        # ★★★1行ずつ 見ると、★次の 行の `.select(` が 見えません（★2026-09-20）。
        #   ★★`.update(…)` と `.select(…)` は、★行を またいで 書きます。
        #   ★★★96件 出ました。★ほとんどが 誤り でした。★ファイルごと 見ます。
        for m in r.finditer(本):
          行 = 本[:m.start()].count("\n") + 1
          字 = 本.split("\n")[行 - 1].strip()
          if 字.startswith("//") or 字.startswith("*"):
            continue
          # ★★そのあと 240字 に「要る もの」が あれば、★よし と します。
          要 = か.get("あとに要る")
          if 要 and re.search(要, 本[m.end():m.end() + 240]):
            continue
          当.append("%s:%d %s" % (み, 行, 字[:70]))
      else:
        # ★★★その ファイルに「安全な 形」が 在れば、★飛ばします。
        無ければ = か.get("ファイルに無ければ")
        if 無ければ and re.search(無ければ, 本):
          continue
        for i, l in enumerate(本.split("\n")):
          s = l.strip()
          if s.startswith("//") or s.startswith("*") or s.startswith("/*"):
            continue
          if r.search(l):
            当.append("%s:%d %s" % (み, i + 1, s[:70]))
    結.append((か, 当))

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-検査4-同じ形の穴.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as g:
    g.write("# ★検査 その4 ── ★同じ形の 穴\n\n")
    g.write("★%s ／ ★`tools/insp_same_shape.py` が 書きました。\n\n" % 今日)
    g.write("★★★1度 起きた 誤りを、★形として 書き留め、★全体に 当てます。\n")
    g.write("★★どの 形にも 較正（当たり・外れ）が 付いて います。\n\n")
    g.write("| 形 | 見つかった 数 |\n|---|---|\n")
    for か, 当 in 結:
      g.write("| %s | %d |\n" % (か["名"], len(当)))
    for か, 当 in 結:
      g.write("\n## ★%s\n\n" % か["名"])
      g.write("★わけ …… %s\n\n" % か["わけ"])
      if か.get("誤りでない例"):
        g.write("★★同じ 形でも 誤りで ない もの …… %s\n\n" % か["誤りでない例"])
      if not 当:
        g.write("★ありません。\n")
      for x in 当[:60]:
        g.write("- `%s`\n" % x)
      if len(当) > 60:
        g.write("- …… ほか %d件\n" % (len(当) - 60))
    g.write("\n## ★この 検査が 見て いない こと\n\n")
    g.write("★★字の 形を 見て います。★通るか どうかは 見て いません。\n")
    g.write("★★★見つかった もの が すべて 誤り では ありません。★1つずつ 見て ください。\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  for か, 当 in 結:
    print("  %-46s %d" % (か["名"][:46], len(当)))


if __name__ == "__main__":
  main()
