#!/usr/bin/env python3
"""★分析 ①③④ を 作る 前に、★いま 何が あって 何が 無いか を 数えます（★2026-09-26）。

  ★★もと ── `docs/opus/未決機能の設計書_第3版_2026-09-14.md` §2-1〜§2-6。
  ★★★この 紙は **下ごしらえ** です。★1行も 実装しません。

  ★★数える もの（★紙を 読んで、★その場で 数えます。★覚え書きを 写しません）──
    ①もとの 部品が ある か（★紙・行数）
    ②画面に つながって いる か（★`VocalTracker.jsx` が 読んで いるか）
    ③名ざしの 見張りが 実在する か（★註に 書いて あっても 無い ことが あります）
    ④しまい先（列・表）が ある か ── ★本番の 台帳を 見た 結果を 添えます

  ★★本番の 台帳の 数は、★この 道具からは 引けません（★合言葉を 持ちません）。
    ★★だから **測った 日・問い・答え** を そのまま 書きます。★推し量りません。

  ★使い方  python3 tools/analysis134_readiness.py
"""
import io, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
出先 = "docs/reports/2026-09-26-分析134実装準備メモ.md"
設計書 = "docs/opus/未決機能の設計書_第3版_2026-09-14.md"

# ★★見る 紙（★1枚でも 無ければ 止まります ── ★棚卸しの 決め）
紙ら = [設計書, "lib/analysisBoost.js", "lib/lagChoice.js", "lib/honbanFurikaeri.js",
        "lib/shirabeteiru.js", "components/CompareV2.jsx", "components/Shirabeteiru.jsx",
        "components/HonbanFurikaeri.jsx", "components/VocalTracker.jsx",
        "tools/not_wired_yet.json"]


def 読む(相対):
  p = os.path.join(ROOT, 相対)
  if not os.path.exists(p):
    print("★止まりました ── もとの 紙が ありません: %s" % 相対)
    sys.exit(2)
  return io.open(p, encoding="utf-8").read()


中 = {p: 読む(p) for p in 紙ら}
VT = 中["components/VocalTracker.jsx"]


def 行数(相対):
  return len(中[相対].split("\n"))


def 読み手(部品):
  """★その 部品を 読んで いる 紙（★`components/` と `app/` を ぜんぶ 見ます）。"""
  出 = []
  for 根, _d, 紙 in os.walk(ROOT):
    if "/node_modules" in 根 or "/.git" in 根 or "/tests" in 根:
      continue
    if not (根.endswith("/components") or "/app" in 根):
      continue
    for f in 紙:
      if not f.endswith((".js", ".jsx")) or f == 部品 + ".jsx":
        continue
      q = os.path.join(根, f)
      try:
        t = io.open(q, encoding="utf-8", errors="ignore").read()
      except OSError:
        continue
      if re.search(r'import %s from "@/components/%s"' % (部品, 部品), t):
        出.append(os.path.relpath(q, ROOT))
  return sorted(出)


def つながり(部品, 見た=None):
  """★`VocalTracker.jsx` から **たどり着ける** か（★直に 読まれて いなくても、
  ★読み手の 読み手を たどります。★`CompareV2` は `LookBackV2` の 中に あります）。"""
  見た = 見た or set()
  if 部品 in 見た:
    return (False, [])
  見た.add(部品)
  ら = 読み手(部品)
  if not ら:
    return (False, [])
  if any(f.endswith("VocalTracker.jsx") for f in ら):
    return (True, ら)
  for f in ら:
    親 = os.path.basename(f)[:-4] if f.endswith(".jsx") else None
    if 親 and つながり(親, 見た)[0]:
      return (True, ら)
  return (False, ら)


def 見張り(相対):
  """★その 紙が 名ざす 見張りが、★本当に 在るか。"""
  出 = []
  for m in re.finditer(r"components/tests/[a-z0-9-]+\.test\.js", 中[相対]):
    f = m.group(0)
    出.append((f, os.path.exists(os.path.join(ROOT, f))))
  return sorted(set(出))


# ★★本番の 台帳を 見た 結果（★2026-09-26 に 読み取り で 確かめました）。
台帳 = [
  ("public に compare/pair/shirabe/lag/analys の 名の 表", "0 表",
   "select table_name from information_schema.tables where table_schema='public' and (…ilike…)"),
  ("profiles の 77列に 組・時間差を しまう 列", "ありません（★`folded_groups` は 別物）",
   "select column_name from information_schema.columns where table_name='profiles' and (…ilike…)"),
  ("performances の 列", "10列（id・user_id・performed_on・kind・label・morning_words・"
   "repertoire_name・org_event_id・created_at・updated_at）",
   "select column_name from information_schema.columns where table_name='performances'"),
  ("performances の 行", "0 行（★利用者 0人）", "select count(*) from public.performances"),
  ("entries の 行", "125 行 ／ 利用者 18人 ／ 2026-08-12〜2026-09-25",
   "select count(*), count(distinct user_id), min(date), max(date) from public.entries"),
  ("entries.resonance_score が 入って いる 行", "83 行",
   "select count(*) from public.entries where resonance_score is not null"),
  ("entries.sleep_hours が 入って いる 行", "118 行",
   "select count(*) from public.entries where sleep_hours is not null"),
  ("眠り×響き が 10日 そろって いる 利用者", "2人",
   "select count(*) from (select user_id from public.entries where resonance_score is not null "
   "and sleep_hours is not null group by user_id having count(*) >= 10) x"),
]

機能 = [
  {
    "名": "① まだ 分からない ことを 見せる",
    "所": "ふりかえる → くらべる の 最上部 ／ ★無料（設計書 §2-1・§2-2）",
    "ある": [
      "`ProgressDots`（`components/VocalTracker.jsx:3570`）── ★「◯日分たまりました」の 1行。"
      "★進捗バーと「あと◯日」は 2026-09-11 に 消して あります（★裁定 §2-4）。",
      "`lib/analysisBoost.js`（%d行）── ★R1〜R6。★`VocalTracker.jsx:9938` が 呼び、"
      "★26062行あたりで 描いて います。" % 行数("lib/analysisBoost.js"),
      "`lib/displayGates.js`・`lib/analysisCardVisibility.js` ── ★門と 出し分け。",
    ],
    "無い": [
      "★設計書の 形は **組ごとの 行**（★「眠った時間 × 声の調子　10日のうち 7日」）です。"
      "★いまの `ProgressDots` は **カード 1枚の 中の 1行** で、★呼ぶ ところは 1か所 だけ です。",
      "★`components/CompareV2.jsx`（%d行）の 最上部に、★その 一覧を 出す ところが ありません"
      "（★「たまりました」は 497行の 1文 だけ ── ★出なかった日の 数 です）。" % 行数("components/CompareV2.jsx"),
      "★組ごとの 日数を 数える 関数が どこにも ありません。★門は `lib/displayGates.js` が"
      "1つ だけ 持つ 決め なので、★そこに 足す ことに なります。",
    ],
    "作る": [
      "①`lib/displayGates.js` に「この 組は 何日 たまったか」を 答える 関数を 1つ。"
      "★数える もとは `entries` だけ です。★列も 表も 足しません。",
      "②`components/CompareV2.jsx` の 最上部に 一覧。★②の 組（`Shirabeteiru`）から"
      "組の 一覧を 受け取る 道。",
      "③「◎7日 △4日」の ◎△ を 何で 分けるか を 先に 決める（★門の 10日 か、★別の 線か）。",
    ],
    "気をつける": [
      "★「あと◯日」を 書かない（★2026-09-11 に 消した もの です。★戻すと 同じ 裁定に 当たります）。",
      "★％・進捗バー・信号色は 1つも 出さない（★`CompareV2.jsx` の 頭の 註）。",
    ],
  },
  {
    "名": "③ 遅れて 効く もの（時間差）",
    "所": "くらべる → 組の 設定の 中 ／ ★有料（設計書 §2-4）",
    "ある": [
      "`lib/lagChoice.js`（%d行）── ★`LAGS` 4種・`defaultLagOf`・`judgingLagOf`・"
      "`testsPerItem`・`needsRecount`。★「表示は 4つ、判定は 1つ」の 決めは 入って います。"
      % 行数("lib/lagChoice.js"),
      "★読み手は 5つ ── `lib/compareView.js`／`lib/compareOrder.js`／`lib/shirabeteiru.js`／"
      "`components/CompareV2.jsx`／`components/VocalTracker.jsx`。",
      "`lib/shirabeteiru.js`（%d行）── ★無料1組（`FREE_PAIRS`）・`mayAddPair`。"
      "★画面（`components/Shirabeteiru.jsx`）は **つながって います**。" % 行数("lib/shirabeteiru.js"),
    ],
    "無い": [
      "★★**選んだ 時間差を しまう 先が ありません**。★`lib/shirabeteiru.js` の 註が"
      "そのまま 書いて います ──「時間差を しまう 列・表・関数は 1つも ありません。画面の 状態 だけ」。",
      "★本番の 台帳でも 確かめました（★下の 表）── ★それらしい 表 0・`profiles` に 列 なし。",
      "★だから 設計書 §2-2 の「★変えたら、そこから 数え直します」が **成り立ちません**。"
      "★いつ 変えたかを 覚えて いない ため です。",
      "★有料／無料の 出し分けの 印が ありません。★`lib/entitlements.js` の `FEATURES` に"
      "時間差の 名が ありません（★`analysis.range` は 期間の 話 で 別 です）。",
    ],
    "作る": [
      "①組と 時間差を しまう 表 を 1つ。★列は 少なく ── "
      "`user_id`／`life_key`／`voice_key`／`lag`／`decided_on`。"
      "★`decided_on` が「そこから 数え直す」の もと です。",
      "②その 表の 決まり（RLS）── ★`USING` と `WITH CHECK` の **両方**。★`USING(true)` を 書かない。",
      "③SQL は 紙に 書いて 坂本さんに 渡す（★この 蔵に 自動の 仕組みは ありません）。",
      "④有料の 線を `lib/entitlements.js` に 1行。★`mayViewSummary`／`paidGateApplies` を"
      "使い回さない（★あれは「壁を 出すか」の 問いで、★「読んで よいか」では ありません）。",
    ],
    "気をつける": [
      "★字（4種の 名）は `lib/lagChoice.js` が 1か所で 持ちます。★表にも 画面にも 写さない。",
      "★「2日後」と 書かない ── ★見本は「2日まえ」です（★裁定197・未来と 読めない 字）。",
    ],
  },
  {
    "名": "④ 本番の 前の 1週間",
    "所": "ふりかえる → 本番の ふりかえり ／ ★有料（設計書 §2-5）",
    "ある": [
      "`lib/honbanFurikaeri.js`（%d行）── ★`DAYS=7`・`isOwn`・`rowsOf`・`mayCompare`・"
      "`sleepWord`・`NOT_WRITTEN`。★約束 4行も ここに あります。" % 行数("lib/honbanFurikaeri.js"),
      "`components/HonbanFurikaeri.jsx`（%d行）── ★画面は できて います。"
      % 行数("components/HonbanFurikaeri.jsx"),
      "★台帳 `performances` は 本番に あります（★10列・`org_event_id` は 空でも よい）。",
      "★`entries.sleep_hours` は 118行 入って います（★7日 並べる もとは あります）。",
    ],
    "無い": [
      "★画面が **つながって いません**。★`VocalTracker.jsx` に `import HonbanFurikaeri` が"
      "ありません。★`tools/not_wired_yet.json` の 引き金 ──"
      "「ふりかえる から 本番 1件を 押す 道を 作った とき」。",
      "★★**本番の 行が 0 です**（★本番の 台帳・2026-09-26）。★書く ところは"
      "`VocalTracker.jsx:28677` の `insert` 1か所 だけ です。★つないでも 中身が 出ません。",
      "★名ざしの 見張り `components/tests/honban-furikaeri.test.js` が **在りません**"
      "（★`lib/honbanFurikaeri.js` の 註が 指して います）。"
      "★いま 触れて いるのは `components/tests/c-group-night.test.js` だけ です。",
      "★2回目からの「重ねる」相手を どう 選ぶかが 決まって いません"
      "（★`mayCompare` は 可否を 返す だけ です）。",
    ],
    "作る": [
      "①ふりかえる → 本番 1件 → この 画面 の 道。",
      "②本番を 登録する 入口を 先に 確かめる（★0行 の まま 出すと、★空の 画面に なります）。",
      "③`org_event_id is null` の 絞りを **問い合わせの 側** に 置く"
      "（★`isOwn` は 画面で 弾くだけ です。★列ごと 取って きません）。",
      "④名ざしの 見張りを 1本 書く（★約束 4行 ── ★判定しない／2回目から／前日と当日は出さない／"
      "学校の 行事から 引かない）。",
    ],
    "気をつける": [
      "★`org_events` から 日付を 引かない（★層を またぐ 結合 ── 設計書 §1-3）。",
      "★書いて いない 日は 0 に しない。★「書いていません」と 出す（★`NOT_WRITTEN`）。",
    ],
  },
]

L = []
L.append("# ★分析 ①③④ ── ★作る 前の 下ごしらえ")
L.append("")
L.append("★この 紙は `tools/analysis134_readiness.py` が 書きました。★手で 足して いません。")
L.append("★数えた 日 …… %s" % datetime.date.today().isoformat())
L.append("★もと …… `%s` §2-1〜§2-6" % 設計書)
L.append("")
L.append("★★**1行も 実装して いません**。★下ごしらえ だけ です。")
L.append("")
L.append("## ★〇 先に ひとこと ── ②は もう つながって います")
L.append("")
L.append("★設計書は ①②③④ の 順を 決めて います。★②「自分で 問いを 立てる」は"
         "`components/Shirabeteiru.jsx` が **つながって います**（★`VocalTracker.jsx:28600`）。")
L.append("★だから ①③④ の 話に なります。★③は ②の 中の 設定 です。")
L.append("")

for f in 機能:
  L.append("## %s" % f["名"])
  L.append("")
  L.append("★置き場所 …… %s" % f["所"])
  L.append("")
  for 題, 鍵 in (("★いま ある もの", "ある"), ("★足りない もの", "無い"),
                 ("★main が 作る もの", "作る"), ("★気を つける こと", "気をつける")):
    L.append("### %s" % 題)
    L.append("")
    for x in f[鍵]:
      L.append("- %s" % x)
    L.append("")

L.append("## ★台帳を 見た 結果（★2026-09-26・読み取り のみ）")
L.append("")
L.append("| 見た もの | 答え |")
L.append("|---|---|")
for 題, 答, _q in 台帳:
  L.append("| %s | %s |" % (題, 答))
L.append("")
L.append("★問い（★同じ ものを もう 一度 引ける よう、★そのまま 置きます）")
L.append("")
L.append("```sql")
for _題, _答, q in 台帳:
  L.append(q + ";")
L.append("```")
L.append("")

L.append("## ★紙と 見張りの 対応（★註に 名が あって、★実在するか）")
L.append("")
L.append("| もとの 紙 | 名ざしの 見張り | 在るか |")
L.append("|---|---|---|")
for 相対 in ("lib/analysisBoost.js", "lib/lagChoice.js", "lib/honbanFurikaeri.js", "lib/shirabeteiru.js"):
  ら = 見張り(相対)
  if not ら:
    L.append("| `%s` | ★名ざし なし | — |" % 相対)
  for f_, ある in ら:
    L.append("| `%s` | `%s` | %s |" % (相対, f_, "○" if ある else "★無い"))
L.append("")

L.append("## ★画面が つながって いるか（★`VocalTracker.jsx` から たどれるか）")
L.append("")
L.append("★★直に 読まれて いなくても、★読み手の 読み手を たどります"
         "（★`CompareV2` は `LookBackV2` の 中に あります）。")
L.append("")
L.append("| 部品 | たどれるか | 読み手 |")
L.append("|---|---|---|")
for 部品 in ("Shirabeteiru", "HonbanFurikaeri", "CompareV2", "LookBackV2"):
  つ, ら = つながり(部品)
  L.append("| `components/%s.jsx` | %s | %s |"
           % (部品, "○" if つ else "★いいえ", "／".join("`%s`" % x for x in ら) or "★ありません"))
L.append("")

L.append("## ★この 紙で 言えない こと")
L.append("")
L.append("- ★台帳の 数は 2026-09-26 の もの です。★次に 読む ときは もう 一度 引いて ください。")
L.append("- ★設計書 §2-8 の 3つ（★どれが 2値か／`deltaST` を 選択項目に するか／列名の 直し）は"
         "まだ 決まって いません。★ここで 決めて いません。")
L.append("- ★門（n≥10・|g|≥0.50・0.50+0.12×(k−1)）の 数は `lib/displayGates.js` が 持ちます。"
         "★この 紙に 写しません（★写すと 2か所に なります）。")
L.append("")

p = os.path.join(ROOT, 出先)
io.open(p, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("REPORT: " + 出先)
print("★機能 %d ／ ★見た 紙 %d ／ ★台帳の 問い %d" % (len(機能), len(紙ら), len(台帳)))
