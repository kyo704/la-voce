# -*- coding: utf-8 -*-
"""★運営の 見本の 画面を 数え、★一覧に します（★2026-09-18・第2群の 下ごしらえ）。

  ★★見本 `docs/design/pack-final/00-動く見本-PC・iPad（運営）.html`。
  ★★画面は `function P_xxx(` の 形で 書かれて います（★`SC[]` では ありません）。

  ★★★立ち会い ── ★1つも 取れなければ 止まります。
    ★★「31画面」と 伺って いますが、★**数えて から** 言います。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html")

# ★★日本語の 名（★見本の 中の 見出し・札 から 読み取れた もの）。
#   ★★読み取れない ものは 空に します。★見当で 埋めません。
NAME = {
  "P_home": "ホーム（学長・副学長）", "P_homeS": "ホーム（事務）",
  "P_homeT": "ホーム（先生）", "P_meibo": "名簿", "P_maneku": "招く",
  "P_sonohito": "その方の 1枚", "P_nittei": "日程", "P_kumu": "日程を 組む",
  "P_okeru": "どこへ 動かしますか", "P_mada": "時間割が まだの方",
  "P_kasa": "重なり", "P_kasaT": "重なり（先生）", "P_kasaFix": "重なりを 直す",
  "P_shukketsu": "出欠", "P_gyoji": "行事", "P_gyojiEdit": "行事を 直す",
  "P_saiten": "採点", "P_tenIreru": "点を 入れる", "P_hyokaItem": "評価の 項目",
  "P_renraku": "連絡", "P_write": "連絡を 書く", "P_misou": "未送信",
  "P_kaita": "開いた 記録", "P_monka": "門下", "P_monkaHito": "門下の ひとり",
  "P_daihyo": "代表を 決める", "P_autoSet": "自動で 振り分ける ときの 条件",
  "P_settei": "設定", "P_setPost": "役職を 決める", "P_postDetail": "役職の 中身",
  "P_seikyuNa": "請求書の 宛名・送り先", "P_atesaki": "ご請求の 宛先",
  "P_ryoshu": "領収書を 出す", "P_pay": "支払い方法",
}

# ★★いまの 実装に、★当たる ものが あるか（★手で 確かめた もの）。
IMPL = {
  "P_home": "OpsHome", "P_homeS": "OpsHome", "P_homeT": "OpsHome",
  "P_meibo": "OpsRoster", "P_nittei": "OpsSchedule", "P_gyoji": "OpsEvents",
  "P_renraku": "OpsPosts…連絡", "P_settei": "OpsSettings",
  "P_setPost": "OpsPosts", "P_postDetail": "OpsPosts",
}


def main():
  if not os.path.exists(MIHON):
    sys.exit("★止まりました ── 見本が ありません: " + MIHON)
  src = io.open(MIHON, encoding="utf-8").read()
  keys = sorted(set(re.findall(r"^function (P_[A-Za-z_]+)\(", src, re.M)))
  if not keys:
    sys.exit("★止まりました ── 画面を 1つも 取れません でした。")

  # ★★名の 読み取りが 追いついて いるか（★立ち会い）。
  unnamed = [k for k in keys if k not in NAME]
  if unnamed:
    print("★★名を 書いて いない 画面が あります: " + ", ".join(unnamed))

  L = []
  w = L.append
  w("# ★運営の 見本 ── ★画面の 一覧と、★進める 順の 案")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/ops_screens_index.py`（2026-09-18）")
  w("")
  w("★見本 … `docs/design/pack-final/00-動く見本-PC・iPad（運営）.html`")
  w("")
  w("## ★数えました ── ★**%d 画面**です" % len(keys))
  w("")
  w("★★「31画面」と 伺って いました。★数えると **%d** でした。" % len(keys))
  w("★★`function P_xxx(` の 形で 書かれた ものを 数えて います。")
  w("★★`SC[]` では ありません（★個人の 見本とは 書き方が ちがいます）。")
  w("")
  w("## ★一覧")
  w("")
  w("| # | 見本の 関数 | 日本語 | いまの 実装 |")
  w("|---|---|---|---|")
  for i, k in enumerate(keys, 1):
    w("| %d | `%s` | %s | %s |" % (i, k, NAME.get(k, "★（未読み）"),
                                   IMPL.get(k, "★当たる ものを 見つけて いません")))
  w("")
  w("★★「いまの 実装」は、★私が 手で 当てた もの です。★★確かめて いません。")
  w("　★★1画面ずつ 見る ときに、★その 都度 確かめます。")

  body = "\n".join(L) + "\n"
  lines = body.split("\n")
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, [x for x in lines if x.strip()][-1])
  path = os.path.join(ROOT, "docs/reports/2026-09-18-運営の見本の画面一覧.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("画面 %d ／ 名を 書いた もの %d ／ 実装を 当てた もの %d"
        % (len(keys), len([k for k in keys if k in NAME]), len(IMPL)))


main()
