#!/usr/bin/env python3
"""★骨組み くらべ（dom_compare）が、★どの 画面を 見て いないか を 数えます（★2026-09-26）。

  ★★★問い ── ★「198枚 の うち、★何枚が 道具の 対象に 入って いるか」。
    ★★数える もとは 2つ しか ありません ──
      ①`tools/dom_ops_map.json`（★運営の 画面 ／ `screens` と `skip`）
      ②`tools/dom_personal_map.json`（★個人の 画面）
    ★★一覧の もとは `docs/design/pack-final/見本と台帳の対応表_2026-09-24.md`。
      ★★A群・B群の 分けは `…/A群B群の画面名一覧_2026-09-24.md`。

  ★★★数が 合いません（★そのまま 書きます。★丸めません）──
    ★言われた 数 …… 198
    ★対応表の 題 …… 168 ／ ★対応表の 行 …… 数えて 出します
    ★A群B群の 一覧 …… 170（★A群 105 ＋ B群 65。★紙の 中に そう 書いて あります）
  ★★どれかを 選んで「198」と 書きません。★3つ とも 出して、★差を 並べます。

  ★★★足しません ── ★この 道具は 穴を **数える だけ** です。
    ★`dom_ops_map.json` に 画面を 足すのは 別の 仕事 です（★頼まれて いません）。

  ★★較正 ── ★もとの 紙が 1枚でも 無ければ 止まります（★棚卸しの 決め・2026-09-22）。
    ★★取り出しが 0件 でも 止まります。★「0件 でした」と 静かに 言いません。

  ★使い方  python3 tools/dom_coverage_audit.py
"""
import io, json, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
対応表 = "docs/design/pack-final/見本と台帳の対応表_2026-09-24.md"
群一覧 = "docs/design/pack-final/A群B群の画面名一覧_2026-09-24.md"
運営地図 = "tools/dom_ops_map.json"
個人地図 = "tools/dom_personal_map.json"
運営報告 = "docs/reports/2026-09-20-段3a-骨組みくらべ.md"
個人置場 = "docs/design/compare/personal"
出先 = "docs/reports/2026-09-26-dom_compare対象カバレッジ監査.md"


def 読む(相対):
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    print("★止まりました ── もとの 紙が ありません: %s" % 相対)
    sys.exit(2)
  return io.open(p, encoding="utf-8").read()


def 表を割る(中, 始=0, 終=None):
  """★`| a | b | c |` の 行だけ を 拾い、★見出しと 区切り線を 除きます。"""
  行ら = 中.split("\n")[始:終]
  出 = []
  for l in 行ら:
    if not l.startswith("|"):
      continue
    列 = [c.strip() for c in l.strip().strip("|").split("|")]
    if not 列 or not 列[0]:
      continue
    if set(列[0]) <= set("-: "):
      continue
    if 列[0] in ("画面",):
      continue
    出.append(列)
  return 出


def git日(相対):
  r = subprocess.run(["git", "log", "-1", "--format=%ad", "--date=short", "--", 相対],
                     cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  return (r.stdout or "").strip()


def 更新日(相対):
  """★git の 最後の commit の 日。★追跡されて いなければ 紙の 日付（★印を 付けます）。"""
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    return ""
  d = git日(相対)
  if d:
    return d
  t = datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
  return t + "（★未追跡・紙の 日付）"


# ── ★一 もとを 読みます ───────────────────────────────────────────────
本文 = 読む(対応表)
群本文 = 読む(群一覧)
運営 = json.loads(読む(運営地図))
個人 = json.loads(読む(個人地図))
運営報告本文 = 読む(運営報告)

一覧 = 表を割る(本文)
if not 一覧:
  print("★止まりました ── 対応表から 1行も 取れません（★取り出しが 壊れて います）")
  sys.exit(2)
画面 = [(r[0], r[1] if len(r) > 1 else "") for r in 一覧]

# ★A群・B群 ── ★節の 見出しで 割ります
a始 = 群本文.find("## A群")
b始 = 群本文.find("## B群 ──")
b終 = 群本文.find("## B群の 内わけ")
if min(a始, b始, b終) < 0:
  print("★止まりました ── A群B群の 節の 見出しが 見つかりません")
  sys.exit(2)
A群 = {r[0] for r in 表を割る(群本文[a始:b始])}
B群 = {r[0] for r in 表を割る(群本文[b始:b終])}
if not A群 or not B群:
  print("★止まりました ── A群／B群の どちらかが 0件 です")
  sys.exit(2)

運営対象 = {s["key"]: s for s in 運営["screens"]}
運営除外 = {s["key"]: s for s in 運営["skip"]}
個人対象 = {k: v for k, v in 個人.items() if not k.startswith("★")}

# ★★最後の 運営の 走りで、★どの 画面を 見たか（★報告の 表から 拾います）
運営走った = set()
一節 = 運営報告本文[運営報告本文.find("## ★一"):運営報告本文.find("## ★二")]
for r in 表を割る(一節):
  運営走った.add(r[0])
運営報告日 = 更新日(運営報告)


def 群(名):
  if 名 in A群 and 名 in B群:
    return "A群・B群 両方（★一覧の 重なり）"
  if 名 in A群:
    return "A群"
  if 名 in B群:
    return "B群"
  return "★一覧に 無い"


def 対象(名):
  if 名 in 個人対象:
    日 = 更新日(os.path.join(個人置場, "%s-実機.png" % 名))
    return ("yes（個人）", 日 or "★絵が ありません（走った あとが ない）")
  if 名 in 運営対象:
    if 名 in 運営走った:
      return ("yes（運営）", "%s（★報告の 日）" % 運営報告日)
    return ("yes（運営）", "★記録 なし（★最後の 走りでは 選ばれて いません）")
  if 名 in 運営除外:
    return ("no（道が 無い）", "★わけ …… " + 運営除外[名]["why"].split("。")[0][:44])
  return ("no", "")


# ── ★二 書きます ────────────────────────────────────────────────────
L = []
L.append("# ★骨組み くらべ（dom_compare）の 対象 カバレッジ")
L.append("")
L.append("★この 紙は `tools/dom_coverage_audit.py` が 書きました。★手で 足して いません。")
L.append("★数えた 日 …… %s" % datetime.date.today().isoformat())
L.append("")
L.append("## ★一 数が 合いません（★3つ 並べます）")
L.append("")
L.append("| どこ | 数 |")
L.append("|---|---|")
L.append("| ★頼まれた 数 | 198 |")
L.append("| %s の 題 | 168 |" % os.path.basename(対応表))
L.append("| %s の 行（★この 道具が 数えた） | %d |" % (os.path.basename(対応表), len(画面)))
L.append("| %s の 行（A群 %d ＋ B群 %d） | %d |"
         % (os.path.basename(群一覧), len(A群), len(B群), len(A群 | B群)))
L.append("")
L.append("★どれかを 選んで 198 と 書きません。★下の 表は **対応表の %d 行** で 作りました。" % len(画面))
L.append("")

数 = {"yes（個人）": 0, "yes（運営）": 0, "no（道が 無い）": 0, "no": 0}
L.append("## ★二 画面ごと")
L.append("")
L.append("| 画面名 | A群かB群か | dom_compare の 対象か | 最終実行日／わけ |")
L.append("|---|---|---|---|")
for 名, _見本 in 画面:
  可, 註 = 対象(名)
  数[可] += 1
  L.append("| %s | %s | %s | %s |" % (名, 群(名), 可, 註))
L.append("")
L.append("## ★三 まとめ")
L.append("")
L.append("| 区分 | 枚 |")
L.append("|---|---|")
for k in ("yes（個人）", "yes（運営）", "no（道が 無い）", "no"):
  L.append("| %s | %d |" % (k, 数[k]))
L.append("| ★合わせて | %d |" % len(画面))
L.append("")
L.append("★★道具が 持って いる 対象は ぜんぶで **%d 枚**（★運営 %d ＋ 個人 %d）。"
         % (len(運営対象) + len(個人対象), len(運営対象), len(個人対象)))
L.append("★★その うち %d 枚は 対応表に 名が あり、★%d 枚は ありません（★下の 四）。"
         % (数["yes（個人）"] + 数["yes（運営）"], len(運営対象) + len(個人対象) - 数["yes（個人）"] - 数["yes（運営）"]))
L.append("")
L.append("★対象に 入って いる のは **%d 枚**（★%.0f%%）。★入って いない のは **%d 枚**。"
         % (数["yes（個人）"] + 数["yes（運営）"],
            100.0 * (数["yes（個人）"] + 数["yes（運営）"]) / len(画面),
            数["no（道が 無い）"] + 数["no"]))
L.append("")

# ★★地図に あって 対応表に 無い 名（★取り出しの 穴を 自分で 見ます）
余り = [k for k in list(運営対象) + list(個人対象) + list(運営除外)
        if k not in {n for n, _ in 画面}]
L.append("## ★四 地図に あって 対応表に 無い 名（★取り出しの 確かめ）")
L.append("")
L.append("★★この %d 枚は 上の 表に 出て いません。★対応表に その 名が 無い ためです。" % len(余り))
L.append("★★落とすと『くらべて いる のに 数に 入らない』ことに なるので、★別に 並べます。")
L.append("")
if 余り:
  L.append("| 画面名 | A群かB群か | dom_compare の 対象か | 最終実行日／わけ |")
  L.append("|---|---|---|---|")
  for k in 余り:
    可, 註 = 対象(k)
    L.append("| %s | %s | %s | %s |" % (k, 群(k), 可, 註))
else:
  L.append("★ありません。")
L.append("")
L.append("## ★四の二 2つの 一覧の 差（★対応表 %d ／ A群B群 %d）" % (len(画面), len(A群 | B群)))
L.append("")
名ら = {n for n, _ in 画面}
無A = sorted((A群 | B群) - 名ら)
無B = sorted(名ら - (A群 | B群))
L.append("★A群B群の 一覧に あって 対応表に 無い …… %s" % ("／".join(無A) if 無A else "★ありません"))
L.append("")
L.append("★対応表に あって A群B群の 一覧に 無い …… %s" % ("／".join(無B) if 無B else "★ありません"))
L.append("")
L.append("## ★五 この 紙で 言えない こと")
L.append("")
L.append("- ★運営の 画面の **1枚ごとの** 最終実行日は 残って いません。★道具は 報告を 1本に")
L.append("  上書きします。★いま 読めるのは 最後の 走り（%s ／ %d 枚）だけ です。"
         % (運営報告日, len(運営走った)))
L.append("- ★個人の 画面の 日は 絵（`%s/<名>-実機.png`）の commit の 日 です。" % 個人置場)
L.append("  ★走らせても 絵が 変わらなければ、★日は 動きません。")
L.append("- ★`no` の 中には「見本に あって 作って いない」ものと「わざと ちがえて ある」ものが")
L.append("  混ざって います。★その 仕分けは `dom_ops_map.json` の `skip` にしか ありません。")
L.append("")

p = os.path.join(ROOT, 出先)
io.open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("REPORT: " + 出先)
print("★対応表 %d 行 ／ ★対象 %d 枚 ／ ★対象外 %d 枚 ／ ★地図の 余り %d"
      % (len(画面), 数["yes（個人）"] + 数["yes（運営）"], 数["no（道が 無い）"] + 数["no"], len(余り)))
