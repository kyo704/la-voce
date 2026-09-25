# ★自分のコマ ── ★台帳を 見てから 書きました
★2026-09-25。

## ★★はじめの 見立ては まちがって いました

★★`lib/opsKumu.js:11` に、こう 書いて あります ──「学校の コマは まだ ありません」。
　★これを 読んで「学校の 基本の 表は 無い」と 一度 書きかけました。

★★★台帳を 引いたら、★ありました ──
```
  org_periods        ★ある（id, org_id, ord, name, start_min, end_min …）★0行
  my_periods         ★ある ★22行
  timetable_share    ★ある（user_id, org_id, shares）
  timetable_nudges   ★ある（org_id, student_id, sent_by, sent_at）
  user_notices       ★ある
```
★★書いた 文が 台帳では ありません。★引いてから 書きます。

## ★確かめた こと（★本番の 台帳・★2026-09-25）

### ★① 事務は 見られるか
```
  get_teacher_periods(p_org_id, p_teacher_id)   SECURITY DEFINER
    返す もの   id, ord, name, start_min, end_min   ★中身（my_timetable）に 触らない
    通す 人     p_teacher_id = auth.uid()  または  has_can(p_org_id, 'sched_all')
    しぼり      p.org_id = p_org_id  かつ  memberships に その 人が いる
```
★★★これは 読む 道 だけ です。★書く 道は `my_periods` の update／delete の
　★決まり だけ で、★どちらも `auth.uid() = user_id` です。
　★★つまり **事務は 見られて、直せない** ── ★見本の 言う とおり です。

★★★ただし、★いまは 見えても いません ──
```
  my_periods 22行 ／ org_id なし 22行 ／ org_id あり 0行
```
★★`get_teacher_periods` は `p.org_id = p_org_id` で しぼります。
　★`org_id` が 無い 行は、★どの 学校からも **1行も** 出ません。
　★そして `components/MyTimetable.jsx` は `org_id` を 1度も 見て いません。

★★★だから「事務の 側は 見るだけ です」は **書きません**。
　★ほんとうに なる 日が 来ますが、★いまは ちがいます。
　★★出して いない ものを 出して いる ように 読まれます。

### ★② 学校の 基本を 変えた ときの 知らせ

★★`org_periods` は **0行** です。★変わる もとが ありません。
　★`timetable_nudges` は 事務が 生徒に「出して ください」と 押す 表 で（`sent_by`／`sent_at`）、
　★学校の 基本が 変わった ことを 伝える ものでは ありません。
　★★だから「1回だけ 知らせが 来ます」も 書きません。

## ★書いた もの ── ★2行 だけ
```
  lib/myTimetable.js  NO_ORG_LINES
    どこにも 属さない コマです。
    いまは どの 学校からも 見えません。
  components/MyTimetable.jsx  ★題の すぐ 下に 出します
```
★★この 2行は、★いま ほんとうの こと です。★台帳が そう なって います。

## ★数
```
  自分のコマ  25件 → 0件（①ある 5 ／ ②ない 0 ／ ③わざと 23 ／ ④中身 11）
  ★わざと 23件 は `tools/excluded_by_design.json` に、
    ★引き金と 台帳の 証拠を 添えて 置きました
```
★★引き金 ── ★かけもち（学校ごとの コマ）を 作る と 決まった 日。
　★`org_periods` に 行が 入り、★`MyTimetable` が `org_id` を 見る ように なった とき。

## ★`price_check.py` 修正版（★zip 7）
```
  出どころ  woolsong-2026-09-21_7.zip  3,191,971バイト  受領 09-25 09:24
  展開先    docs/opus/pack-2026-09-21_46/
  写した    tools/price_check.py  ／  tools/prices.json
  見本      2枚 とも 同じ（★zip 6 で すでに 入って います）
```

★★直った ところ ──
```
  ① PACK を 自分で 探す（_find_pack）
       tools/ の 親に 見本が あれば そこ（★束の 形）
       無ければ 下を 歩いて 探し、★`final` を 含む 道を 優先
       飛ばす もの  pack[-_]\d ／ /旧版/ ／ /_old- ／ /reports?/ ／ /docs/opus/
  ② 見ない ものを 増やした（prices.json の `_scan_exclude`）
       docs/opus/** ／ **/pack-*/** ／ **/pack_*/** ／ **/旧版/**
       **/ledgers/** ／ **/_archive/**
  ③ 確定文書も 同じ 場所から 探す
```

★★走らせました ──
```
  python3 tools/price_check.py                        RESULT: MATCH（食い違い 0件）
  python3 tools/price_check.py --impl lib/orgRoster.js RESULT: MATCH（食い違い 0件）
    ③実装: checked
    営業資料v5: UNKNOWN（画像のため）
```
★★前は 405件 でした。★0件 に なりました。

★★目盛り合わせ ── ★字の 上で 確かめず、★わざと 壊しました ──
```
  生きて いる 見本を 16,600 → 14,200 に する
    DIFF 00-動く見本（さわれる・全画面）.html | BUNDLE_TOTAL | 14,200 → ★16,600 が 正
    RESULT: MISMATCH（1件）
  戻す → RESULT: MATCH（食い違い 0件）
```
★★過去の 束（`pack-2026-09-21_44`）は 14,200 の まま です。★触って いません。

## ★まだ 見て いない こと

★★見た目は 確かめて いません。★`自分のコマ` の 2行が どう 見えるかは 未確認 です。