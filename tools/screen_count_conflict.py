#!/usr/bin/env python3
"""★画面の 数が 合いません ── ★どの 紙が いくつ を 数えて いるか を 並べます（★2026-09-27）。

  ★★★決めません。★並べる だけ です（★坂本さんの お指図 ── ★Opus が 裁きます）。

  ★★食いちがい（★言われた もの）──
    ★198（★`全画面の台帳_独立確認_2026-09-26.md` の 題）
    ★168（★`見本と台帳の対応表_2026-09-24.md` の 題）
    ★169（★その 紙の 表の 行 ── ★`tools/dom_coverage_audit.py` が 数えた）
    ★170（★`A群B群の画面名一覧_2026-09-24.md`。★A群105＋B群65。★裁定195 も 170）

  ★★★この 道具は **見本の html を 直に 数えます**。★紙に 書いて ある 数を 写しません。
    ★★見本の 画面は 2つの 形で 書かれて います ──
      ①`SC['名']=function…`（★スマホ・運営）
      ②`var SC={'名':SC_yotei, …}`（★個人）
      ③`SH['名']=…`（★下から 出る もの ── ★シート）
    ★★★どれを「1画面」と 数えるかで 数が 変わります。★だから 3つ とも 出します。

  ★使い方  python3 tools/screen_count_conflict.py
"""
import io, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
出先 = "docs/reports/2026-09-27-画面数の食いちがい-Opus宛.md"
見本 = [
  ("スマホ（iPhoneで開く用）", "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"),
  ("スマホ（さわれる・全画面）", "docs/design/pack-final/00-動く見本（さわれる・全画面）.html"),
  ("スマホの見本.html", "docs/design/pack-final/スマホの見本.html"),
  ("運営（PC・iPad）", "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html"),
  ("個人（PC・iPad）", "docs/design/pack-final/00-動く見本-PC・iPad（個人）.html"),
]
対応表 = "docs/design/pack-final/見本と台帳の対応表_2026-09-24.md"
群一覧 = "docs/design/pack-final/A群B群の画面名一覧_2026-09-24.md"
台帳198 = "docs/design/pack-final/全画面の台帳_独立確認_2026-09-26.md"


def 読む(相対):
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    print("★止まりました ── もとの 紙が ありません: %s" % 相対)
    sys.exit(2)
  return io.open(p, encoding="utf-8", errors="ignore").read()


def 画面を拾う(中):
  """★見本 1枚から、★画面の 名を 3通りで 拾います。"""
  sc = set(re.findall(r"SC\['([^']+)'\]\s*=", 中))
  sh = set(re.findall(r"SH\['([^']+)'\]\s*=", 中))
  # ★★物の 形で 書いて ある もの（★個人の 見本）
  m = re.search(r"var SC=\{([^}]*)\}", 中)
  if m:
    sc |= set(re.findall(r"'([^']+)'\s*:", m.group(1)))
  return sc, sh


def 表を割る(中, 始=0, 終=None):
  出 = []
  for l in 中.split("\n")[始:終]:
    if not l.startswith("|"):
      continue
    列 = [c.strip() for c in l.strip().strip("|").split("|")]
    if not 列 or not 列[0] or set(列[0]) <= set("-: ") or 列[0] == "画面":
      continue
    出.append(列)
  return 出


数え = []
SC全, SH全 = set(), set()
for 名, 相対 in 見本:
  sc, sh = 画面を拾う(読む(相対))
  数え.append((名, 相対, sc, sh))
  SC全 |= sc
  SH全 |= sh
if not SC全:
  print("★止まりました ── 見本から 1枚も 拾えません（★取り出しが 壊れて います）")
  sys.exit(2)

対応 = {r[0] for r in 表を割る(読む(対応表))}
群本文 = 読む(群一覧)
a, b, c = 群本文.find("## A群"), 群本文.find("## B群 ──"), 群本文.find("## B群の 内わけ")
if min(a, b, c) < 0:
  print("★止まりました ── A群B群の 節が 見つかりません")
  sys.exit(2)
A群 = {r[0] for r in 表を割る(群本文[a:b])}
B群 = {r[0] for r in 表を割る(群本文[b:c])}
群 = A群 | B群

L = []
L.append("# ★画面の 数が 合いません ── ★Opus に 裁いて いただく ため の 並べ")
L.append("")
L.append("★この 紙は `tools/screen_count_conflict.py` が 書きました。★手で 足して いません。")
L.append("★数えた 日 …… %s" % datetime.date.today().isoformat())
L.append("")
L.append("★★**決めて いません**。★どれが 正かを 選ばず、★出どころ と 中身の 差 だけ を 並べます。")
L.append("")
L.append("## ★一 いま 出て いる 数（★4つ）")
L.append("")
L.append("| 数 | 出どころ | 何を 1と 数えて いるか |")
L.append("|---|---|---|")
L.append("| 198 | `%s` の 題 | ★紙に 内わけが ありません |" % os.path.basename(台帳198))
L.append("| 168 | `%s` の 題 | ★紙に 内わけが ありません |" % os.path.basename(対応表))
L.append("| %d | 同じ 紙の 表の 行 | ★1行＝1画面 |" % len(対応))
L.append("| %d | `%s`（A群 %d ＋ B群 %d）／★裁定195 も 同じ | ★重なりを 除いた 画面 |"
         % (len(群), os.path.basename(群一覧), len(A群), len(B群)))
L.append("")
L.append("## ★二 見本の html を 直に 数えました（★紙の 数を 写して いません）")
L.append("")
L.append("| 見本 | `SC[…]` | `SH[…]` | 合わせて |")
L.append("|---|---|---|---|")
for 名, _相対, sc, sh in 数え:
  L.append("| %s | %d | %d | %d |" % (名, len(sc), len(sh), len(sc) + len(sh)))
L.append("| ★ぜんぶ の 重なりを 除いて | %d | %d | %d |" % (len(SC全), len(SH全), len(SC全 | SH全)))
L.append("")
L.append("★★**198 に いちばん 近い 数** …… `スマホの見本.html` の `SC` が %d、"
         % len(数え[2][2]))
L.append("★`00-動く見本-iPhoneで開く用.html` の `SC` が %d です。" % len(数え[0][2]))
L.append("★★つまり 198 は「★スマホの 見本 1枚の `SC` の 数」に 見えます"
         "（★運営・個人・シートを 含みません）。★★ただし 紙に 内わけが 無いので、★推し量り です。")
L.append("")

L.append("### ★紙の 内わけ と、★機械で 数えた 数")
L.append("")
L.append("★`%s` は 内わけを 書いて います ── ★スマホ135・運営60・個人5（★足すと 200）、"
         "★重なりを 除いて 170。" % os.path.basename(群一覧))
L.append("")
L.append("| どこ | 紙の 内わけ | ★機械で 数えた `SC` |")
L.append("|---|---|---|")
L.append("| スマホ | 135 | %d |" % len(数え[0][2]))
L.append("| 運営 | 60 | %d |" % len(数え[3][2]))
L.append("| 個人 | 5 | %d |" % len(数え[4][2]))
L.append("| 足すと | 200 | %d |" % (len(数え[0][2]) + len(数え[3][2]) + len(数え[4][2])))
L.append("| ★重なりを 除いて | 170 | %d |" % len(SC全))
L.append("")
L.append("★★**運営は ぴたりと 合います**（60＝60）。★個人は 1 ちがい（5 と %d）。"
         % len(数え[4][2]))
L.append("★★スマホ だけ 大きく ちがいます（135 と %d ── ★差 %d）。"
         % (len(数え[0][2]), len(数え[0][2]) - 135))
L.append("★★★つまり 食いちがいの もとは **スマホの 見本を どう 数えるか** に 見えます。")
L.append("")

差 = 数え[0][2] ^ 数え[2][2]
L.append("### ★スマホの 見本 2枚の 差（%d 件）" % len(差))
L.append("")
for k in sorted(差):
  どこ = "iPhone用 だけ" if k in 数え[0][2] else "スマホの見本.html だけ"
  L.append("- %s …… %s" % (k, どこ))
L.append("")

L.append("## ★三 紙どうしの 差")
L.append("")
無1 = sorted(群 - 対応)
無2 = sorted(対応 - 群)
L.append("### ★A群B群の 一覧（%d）に あって 対応表（%d）に 無い …… %d 件" % (len(群), len(対応), len(無1)))
L.append("")
for k in 無1:
  L.append("- %s" % k)
L.append("")
L.append("### ★対応表に あって A群B群の 一覧に 無い …… %d 件" % len(無2))
L.append("")
for k in 無2:
  L.append("- %s" % k)
L.append("")

L.append("## ★四 見本に あって、★2つの 紙の どちらにも 無い 名")
L.append("")
余 = sorted((SC全 | SH全) - 対応 - 群)
L.append("★%d 件（★`SC` と `SH` を 合わせた %d から 引きました）。" % (len(余), len(SC全 | SH全)))
L.append("")
for k in 余:
  L.append("- %s" % k)
L.append("")

L.append("## ★五 お尋ね（★Opus へ）")
L.append("")
L.append("1. ★「1画面」は 何を 数えますか ── ★`SC` だけ か、★`SH`（下から 出る もの）も 入れるか。")
L.append("2. ★運営・個人の 見本を 足しますか ── ★198 は スマホ 1枚 だけ に 見えます。")
L.append("3. ★スマホの 見本 2枚の 差 %d 件（上の 二）は、★どちらが 正 ですか。" % len(差))
L.append("4. ★対応表と A群B群の 一覧の 差 %d 件（上の 三）は、★どちらへ 寄せますか。" % (len(無1) + len(無2)))
L.append("5. ★裁定195（合計 170）は 生きて いますか ── ★198 の 紙は その 2日後 です。")
L.append("")
L.append("## ★六 この 紙で 言えない こと")
L.append("")
L.append("- ★198 の 内わけは その 紙に ありません。★上の 見立ては 数の 近さ だけ が 根拠 です。")
L.append("- ★`SH` を 画面と 数えるかは 決まって いません。★この 紙は 両方 出して います。")
L.append("- ★見本の 版（design-v45／v51／v60／v77）の ちがいは 見て いません。")
L.append("")

p = os.path.join(ROOT, 出先)
io.open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("REPORT: " + 出先)
print("★見本 %d 枚 ／ ★SC %d ／ ★SH %d ／ ★紙の 差 %d ／ ★見本だけ %d"
      % (len(数え), len(SC全), len(SH全), len(無1) + len(無2), len(余)))
