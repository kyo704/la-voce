#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★引き金が もう 済んで いる のに、★まだ つないで いない 画面を 数えます（★2026-09-26）。

★★★なぜ この 道具が 要るか ──
  ★`tools/not_wired_yet.json` は、★1枚 ずつ「いつ つなぐ」を 書いて いました。
  ★★けれど **済んだ かどうかを 誰も 数えて いません** でした。
    ★2026-09-25 に `MoreBundle` を つなぎました。
    ★★その 引き金を 書いて いた 11枚は、★1日 気づかれず 残って いました
      （★2026-09-26 の 棚卸しで 見つかりました）。
  ★★★だから 引き金の 文を **機械が 読める 形** に して、★毎回 数えます。

★★★引き金の 書き方（★これ 以外は 数えられません）──
  ★`when` …… ★何が 済んだら つなぐ か。★下の `見分け` の 鍵 の どれか。
  ★`why` …… ★人が 読む ため の 字。
  ★★★`when` の 無い 行は **落ちます**。★「いつか」は 引き金では ありません。

★★★この 道具が 見つけられる もの ──
  ★引き金が 済んで いるのに 呼ばれて いない 画面。
  ★引き金の 鍵を 知らない 行（★書き方の 間違い）。
  ★もう 呼ばれて いるのに 紙に 残って いる 行。
★★★この 道具が 見つけられない もの ──
  ★呼んで いるが **門で 閉じて いて 出ない** 画面（★それは `more-bundle` の 見張り）。
  ★引き金の 鍵に 書いて いない 種類の 条件。

★使い方  python3 tools/trigger_met.py
"""
import io, json, os, re, sys

蔵 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def 読(p): return io.open(os.path.join(蔵, p), encoding="utf-8", errors="ignore").read()

vt = 読("components/VocalTracker.jsx")

# ★★★引き金の 鍵 …… ★1つずつ「済んだ か」を **その場で 数えます**。
#   ★★覚えません。★紙に 書いた 数と くらべません。
見分け = {
  # ★束の 入口 7つ が「もっと」から 開くか
  "more_bundle_wired": lambda: "<MoreBundle" in vt and "isBundle(" in vt,
  # ★名簿の 行を 押す 道
  "roster_row_pressable": lambda: bool(re.search(r"OpsPeople[\s\S]{0,400}onPick", vt)),
  # ★「きょう」の 予定の 1件を 押す 道
  "today_event_pressable": lambda: "<Yotei" in vt,
  # ★ふりかえる から 本番 1件を 押す 道
  "review_honban_pressable": lambda: "<HonbanFurikaeri" in vt,
  # ★ノートの 一覧から 1枚を 押す 先が 決まった か
  "note_body_decided": lambda: "<NoteBody" in vt,
  # ★稽古の 1回（`koen_sessions`）を 作る 道
  "koen_session_exists": lambda: "koen_sessions" in vt,
  # ★レッスンの 日程を 組む 画面から コマを 押す 道
  "koma_pressable": lambda: "<KomaNoNakami" in vt,
  # ★自分の コマの 升目を 押す 道
  "my_koma_pressable": lambda: "<YoteiNoNakami" in vt,
  # ★公演の 運営に 行を 足した か
  "koen_area_row": lambda: "<KoenFees" in vt,
  # ★門下に 招く 道
  "monka_invite_row": lambda: "<AikotobaMiseru" in vt,
  # ★ノートの 曲の 中身から 押す 道
  "note_song_pressable": lambda: "<KyokuNaosu" in vt,
  # ★★★2026-09-26 に 足した 鍵 ── ★見本を たどって 分かった 親 です。
  #   ★「ページの設定」の 行を 押す 道
  "page_settings_row": lambda: "<Dasu" in vt,
  #   ★「なにを書く」の 中から
  "naniwokaku_inner": lambda: "<Kaku" in vt,
  #   ★「アプリから引用」を つないだ とき
  "appquote_wired": lambda: "<Shashin" in vt,
  #   ★「公演の運営」に 行を 足した とき
  "koen_ops_row": lambda: "<KoenHaifu" in vt or "<KinkyuRenrakusaki" in vt,
  # ★★★下の 2つは **こちらでは 直せません**。★見本の 側の 欠け です。
  #   ★`mockup_orphan` …… ★見本の 中でも どこからも 開かれて いない。
  #   ★`mockup_name_unknown` …… ★見本に 同じ 題が 見つからない。
  #   ★★どちらも「まだ」で 止めます ── ★勝手に 入口を 作りません
  #     （★台帳「見本に ある 仕掛けだけ を 使う」）。
  "mockup_orphan": lambda: False,
  "mockup_name_unknown": lambda: False,
  # ★★★2026-09-26（2度目）── ★見本を **動かして** たどった 結果 の 鍵。
  #   ★`kaminokata_wired` …… ★「紙の型」を 作って、★その 中の
  #     ★「できあがりを 見る」を つないだ とき。
  "kaminokata_wired": lambda: "<KamiTashikame" in vt,
  # ★★下の 2つは こちらでは 直せません。★見本の 側に 入口が ありません。
  #   ★★`tools/mihon_trace.js` で 親の 中を 1つずつ 数えた 結果 です
  #     （★字で さがしただけ では ありません）。
  "mihon_no_entry": lambda: False,
  "mihon_name_unknown": lambda: False,
  # ★★★`bgun_locked` …… ★2026-09-27・坂本さんの お決め。
  #   ★親が B群（★ポートフォリオ・ホームページ）です。
  #   ★★世に 出る まで つなぎません。★別の 入口も さがしません。
  #   ★★★これは 待ちでは なく **決め** です。★見張りは ずっと「まだ」で 通します。
  "bgun_locked": lambda: False
}

def main():
  紙 = json.loads(読("tools/not_wired_yet.json"))
  済み, 未, 悪, 余 = [], [], [], []
  for 名, v in 紙.items():
    if 名 == "_readme":
      continue
    呼 = ("<%s" % 名) in vt
    when = v.get("when") if isinstance(v, dict) else None
    if 呼:
      余.append(名)
      continue
    if not when:
      悪.append((名, "★`when`（引き金の 鍵）が ありません"))
      continue
    f = 見分け.get(when)
    if not f:
      悪.append((名, "★知らない 引き金の 鍵 …… %s" % when))
      continue
    (済み if f() else 未).append((名, when))

  print("TRIGGER_MET  ★紙の 行 …… %d" % (len(紙) - 1))
  print("\n■ ★引き金が 済んで いる のに、★まだ 呼んで いない（%d）" % len(済み))
  for 名, when in 済み:
    print("    %-20s ★引き金 …… %s" % (名, when))
  print("\n■ ★引き金が まだ（%d）" % len(未))
  for 名, when in 未:
    print("    %-20s ★引き金 …… %s" % (名, when))
  print("\n■ ★もう 呼んで いる ── ★紙から 外して ください（%d）" % len(余))
  for 名 in 余:
    print("    %s" % 名)
  print("\n■ ★書き方が 読めない 行（%d）" % len(悪))
  for 名, なぜ in 悪:
    print("    %-20s %s" % (名, なぜ))
  だめ = len(済み) + len(余) + len(悪)
  print("\nRESULT: %s" % ("OK" if だめ == 0 else "NG（%d 件）" % だめ))
  return 1 if だめ else 0

if __name__ == "__main__":
  sys.exit(main())
