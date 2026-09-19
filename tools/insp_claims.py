# -*- coding: utf-8 -*-
"""★検査 その2 ── ★売り文句との 突き合わせ（★2026-09-19・お決め D84）

  ★★★「言って いる こと」と「実装」が ずれて いないかを 数えます。
    ★★言って いる ことの 出どころ ──
      ①`docs/ledgers/07-利用者に示している約束.md`（★利用者に 見えて いる 約束）
      ②`docs/opus/Woolsong_安全管理の書類（…）.md`（★大学に 渡す 紙）

  ★★★見るのは 3つ です。
    ①約束が 指して いる 場所（`ファイル:行`）が、★いまも 在るか
    ②その 行が、★ファイルの 丈を 超えて いないか（★動いた しるし）
    ③紙の 中の ☐（まだ 埋めて いない もの）が いくつ あるか

  ★★★行の 番号は 動きます。★動いた ことを「誤り」と しません。
    ★★「動いた かも しれません」と 出すだけ です。★消す 判断は 人が します。

  ★★較正 ── ★在る ファイルと、★無い ファイルの 両方で 試します。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
約束紙 = os.path.join(ROOT, "docs", "ledgers", "07-利用者に示している約束.md")
安全紙 = os.path.join(ROOT, "docs", "opus",
                      "Woolsong_安全管理の書類（1〜7・2026年9月10日）.md")


def 読む(みち):
  return io.open(みち, encoding="utf-8").read()


def 丈(相対):
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    return None
  return len(読む(p).split("\n"))


def main():
  本 = 読む(約束紙)

  # ★★較正 ── ★在る ものと 無い もの。
  assert 丈("components/VocalTracker.jsx"), "★在る ファイルを 読めません"
  assert 丈("components/アリマセン.jsx") is None, "★無い ファイルを 在ると 言って います"

  # ★① 約束を 切り出す。
  約束 = []
  今 = None
  for l in 本.split("\n"):
    m = re.match(r"^## \d+\. (.+)$", l)
    if m:
      if 今:
        約束.append(今)
      今 = {"題": m.group(1), "場所": [], "状態": ""}
      continue
    if 今 is None:
      continue
    if "いまの状態" in l and not 今["状態"]:
      今["状態"] = l.split("いまの状態", 1)[1].strip()
    for r in re.finditer(r"([\w./-]+\.(?:jsx?|sql|md)):(\d+)", l):
      今["場所"].append((r.group(1), int(r.group(2))))
  if 今:
    約束.append(今)

  assert len(約束) >= 10, "★約束を 読めて いません: %d" % len(約束)

  # ★② 場所を 確かめる。
  無い, 外れ, 良い = [], [], 0
  for a in 約束:
    for f, n in a["場所"]:
      候補 = [f, os.path.join("components", f), os.path.join("lib", f),
              os.path.join("app", f), os.path.join("supabase", f),
              os.path.join("docs", f)]
      み = next((c for c in 候補 if 丈(c) is not None), None)
      if み is None:
        無い.append((a["題"], f, n))
        continue
      if n > 丈(み):
        外れ.append((a["題"], み, n, 丈(み)))
      else:
        良い += 1

  # ★③ 紙の ☐ を 数える。
  安全 = 読む(安全紙) if os.path.exists(安全紙) else ""
  四角 = len(re.findall("☐", 安全))

  # ★★★守れて いない と 自分で 書いて いる 約束。
  未 = [a for a in 約束 if "守れていない" in a["状態"].replace(" ", "")
        or "ありません" in a["状態"] or "未" in a["状態"]]

  # ★★★④ 証拠の 突き合わせ（★宣言は `tools/claims.json`）。
  #   ★★宣言の 無い 約束は「★宣言が ありません」と 出します。★黙って 通しません。
  import json
  宣言みち = os.path.join(ROOT, "tools", "claims.json")
  宣言 = json.loads(読む(宣言みち))
  証 = {x["題"]: x for x in 宣言["約束"]}
  合, 否, 未宣言 = [], [], []
  for a in 約束:
    短 = a["題"].split("（")[0].strip()
    x = 証.get(短)
    if not x:
      未宣言.append(短)
      continue
    悪 = []
    for e in x.get("あり", []):
      み = os.path.join(ROOT, e["どこ"])
      if not os.path.exists(み) or e["字"] not in 読む(み):
        悪.append("「%s」が %s に ありません" % (e["字"], e["どこ"]))
    for e in x.get("なし", []):
      み = os.path.join(ROOT, e["どこ"])
      if os.path.exists(み) and e["字"] in 読む(み):
        悪.append("「%s」が %s に 在ります" % (e["字"], e["どこ"]))
    (否 if 悪 else 合).append((短, 悪, x.get("わけ", "")))

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-検査2-売り文句との突き合わせ.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as f:
    f.write("# ★検査 その2 ── ★売り文句との 突き合わせ\n\n")
    f.write("★%s ／ ★`tools/insp_claims.py` が 書きました。\n\n" % 今日)
    f.write("★約束 **%d** ／ 指して いる 場所 **%d** ／ "
            "在った **%d** ／ 無い **%d** ／ 行が 外れて いる **%d**\n\n"
            % (len(約束), sum(len(a["場所"]) for a in 約束), 良い, len(無い), len(外れ)))

    f.write("## ★① 指して いる 場所が 無い\n\n")
    if not 無い:
      f.write("★ありません。\n")
    for 題, f2, n in 無い:
      f.write("- %s …… `%s:%d`\n" % (題, f2, n))

    f.write("\n## ★② 行が ファイルの 丈を 超えて いる（★動いた しるし）\n\n")
    if not 外れ:
      f.write("★ありません。\n")
    for 題, f2, n, l in 外れ:
      f.write("- %s …… `%s:%d`（いまの 丈 %d）\n" % (題, f2, n, l))

    f.write("\n## ★③ 自分で「守れて いない」と 書いて いる 約束\n\n")
    if not 未:
      f.write("★ありません。\n")
    for a in 未:
      f.write("- %s …… %s\n" % (a["題"], a["状態"][:60]))

    f.write("\n## ★④ 大学に 渡す 紙の ☐（まだ 埋めて いない）\n\n")
    f.write("★**%d**個。★埋まるまで、★その 行は 約束に できません。\n" % 四角)

    f.write("\n## ★⑤ 証拠の 突き合わせ\n\n")
    f.write("★合って いる **%d** ／ 食い違い **%d** ／ 宣言が 無い **%d**\n\n"
            % (len(合), len(否), len(未宣言)))
    for 短, 悪, わけ in 否:
      f.write("- ★%s …… %s（%s）\n" % (短, "／".join(悪), わけ))
    if 未宣言:
      f.write("\n★宣言が 無い 約束（★証拠を 書いて ください）\n\n")
      for 短 in 未宣言:
        f.write("- %s\n" % 短)

    f.write("\n## ★この 検査が 見て いない こと\n\n")
    f.write("★★行の 中身までは 見て いません。★丈だけ を 見て います。\n")
    f.write("★★★「在る」は「その 約束が 守られて いる」では ありません。\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  print("約束 %d ／ 場所 在った %d ／ 無い %d ／ 外れ %d ／ 守れていない %d ／ ☐ %d"
        % (len(約束), 良い, len(無い), len(外れ), len(未), 四角))
  print("証拠 …… 合って いる %d ／ 食い違い %d ／ 宣言が 無い %d"
        % (len(合), len(否), len(未宣言)))


if __name__ == "__main__":
  main()
