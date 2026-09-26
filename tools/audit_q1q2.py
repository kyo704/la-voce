#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★Q1（分析①〜④の 定め）と Q2（先送りの 棚卸し）を 出します（★2026-09-26・Sonnet の ご依頼）。

★★★見つけられる もの ──
  ★`tools/not_wired_yet.json` の 中で、★書いて ある 引き金が **もう 済んで いる** もの。
  ★見本「もっと深く」の 題が `lib/learnContent.js` に あるか。
  ★裁定の 中の 2027年・先送りの 行。
★★★見つけられない もの ──
  ★名を 変えて 作られた もの。★裁定の 外（会話だけ）で 決まった もの。
  ★★だから DECISION_STATE は「見当たらない」と 書きます。「無い」とは 書きません。
"""
import io, json, os, re, glob

蔵 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def 読(p): return io.open(os.path.join(蔵, p), encoding="utf-8", errors="ignore").read()

出 = []
def y(*行): 出.extend(行)

# ── Q1
設計 = "docs/opus/未決機能の設計書_第3版_2026-09-14.md"
本 = 読(設計)
表 = re.findall(r"^\| (①|②|③|④) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$", 本, re.M)
vt = 読("components/VocalTracker.jsx")
状態 = {
  "①": ("一部実装", "★`◯日分 たまりました` は あります（★`components/VocalTracker.jsx`）。"
        "★見本の「10日の うち ◎7日 △4日」の 2つ 並べは 入れて いません（★註に そう 書いて あります）。"),
  "②": ("実装", "★`components/Shirabeteiru.jsx` ／ `lib/shirabeteiru.js`。"
        "★2026-09-26 に 見本と ①0 ②0。★無料 1組 を 守って います。"),
  "③": ("一部実装", "★`lib/compareView.js` の `buildCompare` が 時間差を 受け取ります。"
        "★`components/CompareV2.jsx` が 渡して います。"
        "★★けれど しらべている ことの 選びは **しまう 列が 無く**、"
        "★画面を 出ると 消えます ── ★分析の 側に 届きません。"),
  "④": ("未接続", "★`components/HonbanFurikaeri.jsx` ／ `lib/honbanFurikaeri.js` は あります。"
        "★`components/VocalTracker.jsx` から 1度も 呼んで いません。")
}
y("Q1_分析①〜④の定義:", "  SOURCE: %s（§2-1）" % 設計, "  ITEMS:")
for 番, なに, 置, 銭 in 表:
  st, なぜ = 状態.get(番, ("UNKNOWN", "UNKNOWN"))
  y("    - NO: \"%s\"" % 番,
    "      NAME: \"%s\"" % なに.strip(),
    "      PLACE: \"%s\"" % 置.strip(),
    "      MONEY: \"%s\"" % 銭.strip(),
    "      STATUS: \"%s\"" % st,
    "      EVIDENCE: \"%s\"" % なぜ)
y("")

# ── Q2 ㋑ ★決めが 宙に 浮いて いる もの
y("Q2_決定が見当たらないもの:")
nw = json.loads(読("tools/not_wired_yet.json"))
済 = [k for k, v in nw.items()
      if k != "_readme" and "MoreBundle" in (v if isinstance(v, str) else json.dumps(v))]
y("  - NAME: \"束の 入口 7つ から 先の %d枚（%s）\"" % (len(済), "・".join(済)),
  "    STATUS: \"一部実装（★画面は 出来て いる。★どこからも 呼ばれて いない）\"",
  "    LAST_MENTIONED: \"tools/not_wired_yet.json（2026-09-25）\"",
  "    DECISION_STATE: \"決定が見当たらない\"",
  "    REASON_IF_KNOWN: \"★書いて ある 引き金は『MoreBundle を つないだ とき』。"
  "★MoreBundle は 2026-09-25 に つなぎました ── ★引き金は もう 済んで います。"
  "★それでも 11枚は 呼ばれて いません。★引き金が 済んだ ことを 誰も 数えて いません\"")

for 名, st, 最後, わけ in [
  ("分析④ 本番の前の1週間（HonbanFurikaeri）", "未接続",
   "tools/not_wired_yet.json（2026-09-25）／未決機能の設計書 第3版（2026-09-14）§2-5",
   "★引き金は『ふりかえる から 本番 1件を 押す 道を 作った とき』。★その 道が ありません"),
  ("分析③ の 時間差を 覚える ところ", "一部実装",
   "未決機能の設計書 第3版（2026-09-14）§2-4",
   "★`lib/shirabeteiru.js` に『しまう 列が ありません』と 書いて あります。"
   "★★有料の 選び（翌日・2日後・3日後）を 覚える 先が 決まって いません"),
  ("ノートの 本文（NoteBody）", "未接続",
   "tools/not_wired_yet.json（2026-09-25）",
   "★『いまの ノートの 画面と、★どちらを 出すかを 決めて いません』と 書いて あります"),
  ("団体の 募集", "未実装",
   "実行ルート統合版 第12版（2026-09-22）の 未決機能の 行",
   "★`lib/` `components/` `app/` に その 名の 紙が 1つも ありません。"
   "★裁定の 中にも 決めが 見当たりません"),
  ("学ぶ15本（★見本「もっと深く」の 題）", "未実装",
   "実行ルート統合版 第12版（2026-09-22）／見本 SC['もっと深く']（2026-09-26）",
   "★見本の 題 14本（★ベルカント発声法の 全体像・声区と パッサッジョ・appoggio・母音修正・"
   "singer's formant・歌手のための 体幹・姿勢ワーク・呼吸筋トレーニング・栄養・加湿・睡眠・"
   "vocal dose・喉頭外筋の 緊張と MCT・逆流の 長期管理・アジリタ・用語集）は "
   "`lib/learnContent.js`（★88本）に 1本も ありません"),
  ("関数の 返し方を 3つに 寄せる（裁定184）", "未実装",
   "実行ルート統合版 第16・17・18版（2026-09-26）の「先の拡張」",
   "★その 行 自身が『時期は 決めていません』と 書いて います"),
  ("学校の 無料の 期間（裁定154・155）", "仕様のみ",
   "ruling-155-pricing-final.md（★確定文書 9/13 への 註）",
   "★『販売開始が 2027年4月に 延びた あと 確かめ直されて いません』と 裁定 自身が 書いて います"),
]:
  y("  - NAME: \"%s\"" % 名, "    STATUS: \"%s\"" % st,
    "    LAST_MENTIONED: \"%s\"" % 最後,
    "    DECISION_STATE: \"決定が見当たらない\"",
    "    REASON_IF_KNOWN: \"%s\"" % わけ)
y("")

# ── Q2 ㋐ ★はっきり 先送りの 裁定が ある もの
y("Q2_明示的に延期の裁定があるもの:")
for 名, st, 最後, わけ in [
  ("公演（productions）P1", "未実装", "ruling-141 ／ ruling-152（2026-09-23頃）",
   "★P1 は 2027-07〜（★裁定152 が 裁定141・148 の 食い違いを 直して います）"),
  ("乗り番表・出番表（ガラ・発表会・フェス）", "未実装", "ruling-148 ／ ruling-152",
   "★2027-10（★裁定152 で 訂正）"),
  ("ホームページ（portfolio）PHASE_1 / PHASE_2", "一部実装", "ruling-128-homepage.md",
   "★PHASE_1 2027-01〜03 ／ PHASE_2 2027-04〜06"),
  ("公演の 進行表・本番当日の 画面・CSV 読込・PDF", "未実装", "ruling-145-fill-gaps.md",
   "★2027-10〜（P2）"),
  ("15〜17歳の ②を 選ぶ 画面", "未実装", "ruling-147-children-in-productions.md",
   "★『作らない（注記の まま）。★実装は 2027-07〜。★要る ときに 作る』"),
  ("学校向けの 販売", "一部実装", "ruling-156-school-free-period.md",
   "★2027年4月。★パイロット1校は 2027年2月に レッスン割を 使う"),
  ("未決機能（採点・伴奏マッチング・ポートフォリオ・分析の拡張・生徒向け教室シェル）",
   "一部実装", "実行ルート統合版 第9・10・12版（2026-09-21〜22）",
   "★『2027年1〜3月に』と 書いて あります"),
]:
  y("  - NAME: \"%s\"" % 名, "    STATUS: \"%s\"" % st,
    "    LAST_MENTIONED: \"%s\"" % 最後,
    "    DECISION_STATE: \"明示的に延期の裁定がある\"",
    "    REASON_IF_KNOWN: \"%s\"" % わけ)
y("")
y("TOOL_CAN_FIND: \"引き金が 済んだ 未接続の 画面 ／ 見本の 題と 学ぶの 紙の 差 ／ 裁定の 2027年の 行\"")
y("TOOL_CANNOT_FIND: \"名を 変えて 作られた もの ／ 会話だけで 決まった もの ／ 紙を 持たない 機能\"")
print("\n".join(出))
