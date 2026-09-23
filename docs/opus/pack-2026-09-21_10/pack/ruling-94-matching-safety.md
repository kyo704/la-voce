# RULING 94 — matching-safety

```yaml
ruling: 94
date: 2026-09-18
supersedes: ruling-70 (matching)
basis: research 2026-09-18
status: APPROVED 2026-09-18 by 坂本（衝突1・衝突2とも採用）
```

---

## 1. THREAT_MODEL

```yaml
evidence:
  - src: 警察庁 令和6年確定値 2026-05-23
    SNS型ロマンス詐欺 初回接触: マッチングアプリ 1311件 34.3% (1位)
    被害時の連絡ツール: LINE 94.4%
    implication: アプリで接触→外部へ誘導が定型手口
  - src: Valentine et al. 2022, J Interpersonal Violence, DOI 10.1177/08862605221130390
    デートアプリ経由性暴力 274件。他の知人間性暴力より暴力的。絞頸 32.4%
  - src: US DOJ BJS, College-Aged Females 1995-2013
    性暴力被害者の警察通報率: 20%
    implication: 通報に依存する設計は機能しない
  - src: ProPublica/CJI 2021-05-27
    通報71件中34件が無反応。Hinge = 1時間60件処理
    欠陥: 被害者が先にブロックすると通報不能
  - src: Bloomberg 2020
    Bumble 女性ファースト設計に被害減少の証拠なし
    implication: 「女性から先に」型は採らない

target_profile:
  name: 芸大おじさん / 音大おじさん
  traits:
    - 実在する本人（偽名でない） → 本人確認で止まらない
    - 音大卒が事実の場合あり     → 経歴審査で止まらない
    - 40代以上                  → 年齢制限で止まらない
  only_effective_control: 入れる場所を所属で限る

structural_risk:
  - 1対1・長時間・密室（練習室）
  - 金銭が動く（伴奏料）
  - 力関係（依頼する側/受ける側、経験差）
  note: クラシック界のハラスメント構造と同型
```

---

## 2. DEFENSE_LAYERS

```yaml
L1_scope:    学校の中だけ
L2_template: 定型文のみ（自由文不可）
L3_cut:      いつでも切れる（理由不要）
L4_report:   通報1件で即停止
order: 通報は最後。L1-L3が主
rationale: 通報は相手を裁く行為で理由を要する。切るのは自分のことだけ
```

---

## 3. L1_SCOPE

```yaml
decision: 学校の中だけ。外に出さない
stages:
  1: 同じ学校の在籍者のみ   # ← current
  2: 卒業生まで（身元が追える）
  3: 誰でも（守り方確定後のみ）
minors:
  in_school: 18歳未満が存在しうる
  external:  18歳以上のみ。例外なし
  rule: 学校の中と外を絶対に混ぜない
do_not:
  - 本人確認だけで外部開放（加害者は実在する本人）
  - 年齢制限だけで外部開放（40代でも通る）
```

---

## 4. L2_TEMPLATE

```yaml
decision: 成立前は定型文のみ。自由文の入力欄を持たない
from_singer:
  - "{date}の本番、お願いできますか"
  - "{piece}は{title}です"
  - "お礼は{amount}円を考えています"
  - "楽譜はこちらで用意します"
from_pianist:
  - "お受けできます"
  - "{piece}をもう少し教えてください"
  - "お礼について相談させてください"    # sodan=true の募集にだけ出す
removed_2026_09_19:
  - "場所は{place}、{time}から{duration}です"
    reason: 日にち＋時間＋場所がそろうと「いつどこにいるか」が分かる
  - "その日は都合がつきません"
    reason: 応募画面は応募する人が開く場所。断るなら応募しない
  - "合わせを1回いただけますか"
    reason: 回数の交渉が始まる → 自由文が欲しくなる
after_match: 本人が判断して連絡先を交換（自由）
blocks:
  - 外部SNS/LINE誘導（ロマンス詐欺の第一歩）
  - グルーミング
  - 個人情報の聞き出し
  - 口説き
tradeoff:
  cost: 自由に書けたほうが便利
  reason: 便利さと安全が正面から対立。安全を採る
```

---

## 4b. SCHEDULE_CONDITION

```yaml
# 2026-09-18 追補

templates_reduced_to_2:
  - お受けできます
  - 曲目をもう少し教えてください
removed:
  - その日は都合がつきません    # 応募画面は応募する人が開く。断るなら応募しない
  - 合わせを1回いただけますか    # 回数の交渉が始まる → 自由文が欲しくなる
principle: 定型文は少ないほど安全。選択肢が増えると組み合わせで意味を作れる

posting_side:
  field: この日は
  options:
    all:  すべて来られる方
    any:  1日でも来られる方

applying_side:
  if_schedule_exists:
    all_mode: 合わない日があれば一覧で警告。開く前に分かる
    any_mode: 合わない日に印。選択は妨げない（動かせる予定かもしれない）
  if_schedule_empty:
    action: 何もしない
    reason: 空は「予定がない」ではなく「まだ書いていない」
    show: 全部の募集を出す。all_mode も含む
    do_not:
      - 「時間割を入れると都合が分かります」と促す   # 催促しない
      - all_mode の募集を隠す
    note: 学外・フリーの演奏家は時間割を書かない。書く理由がない

matching_is_local:
  where: 端末の中
  do_not: 予定をサーバへ送る
  ref: 裁定その57（層をまたぐ結合の禁止）

display_states:
  - 時間割あり・予定あり → 「ほかの予定があります」
  - 時間割あり・予定なし → 何も出さない
  - 時間割なし          → 何も出さない。止めない
  note: 後ろ2つは画面上は同じ。区別は内部判定のみ
```

---

## 4c. REPLY_ROUND_TRIP

```yaml
# 2026-09-18 追補。定型文を作ったが往復を設計していなかった

gap_found:
  - 応募者の詳細に「送られたことば」が無かった
  - 「曲目をもう少し教えてください」に答える場所が無かった
  note: やりとりが片道だった

poster_side:
  応募を選ぶ:
    show: 各応募者の送ったことば
    highlight: たずねられているものは --warn 色
  応募者の詳細:
    show: 送られたことば（カードで大きく）
    action_if_asking: [曲目を答える] ボタン

曲目を答える:
  source: 自分のレパートリー（複数選択）
  fallback_templates:
    - 曲目はこれから決めます
    - 当日までにお伝えします
  inline_add:
    trigger: 「＋ ここで 曲を 足す」
    sheet: 曲名 ＋ 作った人（任意）
    effect: レパートリーにも入る
    reason: 画面を出て戻る必要をなくす
  why_safe: |
    曲名はデータであって書いた文ではない。
    自由文の入力欄ではない。安全性は保たれる

applicant_side:
  応募した募集:
    show: たずねたことへの返事（曲目が届きました ──「冬の旅（全曲）」）
    no_reply_yet: 「たずねたことに、まだお返事はありません」
  notification: 送らない。開いたときに見える（既存方針）
```

---

## 4d. PLACEMENT

```yaml
# 2026-09-18 決定。裁定その70の「入口の置き場所 ── 未決」を確定

before: ノート → レパートリー → さがす
  problem:
    - 3階層
    - レパートリーは曲の管理であって人を探す場所ではない
    - マッチングは9画面。機能の規模と置き場所が釣り合わない

after: もっと → さがす
  rejected_a:
    place: ノートの直下（タブ5つ）
    reason: ノートの性格が薄まる
  rejected_b:
    place: 5つ目のタブ
    reason: ひつじを押しのける。羊は継続を支える唯一の装置。動かさない
  chosen_c:
    place: もっと の直下
    reasons:
      - 頻度が合う（きょう=毎日 / ノート=数日 / さがす=本番の前だけ）
      - もっと は既に道具箱（通っているところ・学ぶ・設定）
      - 5つのタブを動かさずに済む

supplement:
  where: きょう
  show: 新着があるときだけ1行「さがす ／ 新しい募集が N件」
  if_zero: 節ごと出さない
  ref: 裁定その73と同じ形
  reason: |
    もっと は歯車の中で探しにくい。
    本番が決まったときに見つかればよいが、伴奏者側は毎日見たい
```

---

## 4e. APPLICANT_DETAIL

```yaml
# 2026-09-19 追補。楽器と空きコマだけでは選べなかった

show:
  gakko: 学んだところ（○○音楽大学 ピアノ科）
  shiji: 師事
  sho: 受賞（0件なら節ごと出さない）
  rec: 録画（本人が選んだもの）
  rep: 持っている曲（公開している分だけ）
  photo: 写真（本人が選べる）
  done: この学校でN回（0件なら出さない）
  source: すべてポートフォリオにあるもの。応募時に見せるだけ

never_show:
  - 年齢・学年・入学年
  - 門下・担当の先生
  ref: 裁定その94 §7。若いと分かる情報を出さない

applicant_controls:      # 応募するときに選ぶ
  fields: [経歴, 録画, レパートリー, 写真]
  default: 写真のみ off
  reason: |
    写真は「誰か分かる安心」と「見た目で選ばれない」が対立する。
    本人が選ぶ。公開範囲と同じ形

done_count:
  show_if: 1回以上
  hide_if: 0回
  reason: |
    実績は信頼の材料だが、新しい人が不利になる。
    0件のときは何も出さないことで、不利にならない
  do_not: 実績の順に並べ替える（応募の順のまま）

list_view:               # 応募を選ぶ
  show: 名前 / 学んだところ / 送られたことば / この学校でN回
  order: 応募の順。実績の順にしない
  highlight: たずねられているものは --warn 色
```

---

## 4f. RECORDINGS_AND_PORTFOLIO_ACCESS

```yaml
# 2026-09-19 追補

recordings:
  form: YouTube等のURLのみ
  do_not:
    - 動画をアプリで保存する
    - アプリ内で再生する
  behavior: 押すと外部（YouTube）へ移動
  reason: |
    本人が既に公開しているものへのリンク。
    Woolsong が新しく晒すわけではない。
    保存しないので容量・費用・著作権の責任を負わない
  default_on_apply: on
  note: |
    「若いと分かる情報を出さない」（§7）との関係。
    写真は既定オフにしたが、録画は既定オン。
    理由は「既に公開されているもの」だから。
    本人が消せばリンクが切れるだけ

portfolio_access_from_matching:
  problem: |
    応募しようとして経歴が空だと気づいても、戻る道がない。
    さがす → 応募する → もっと → ノート → レパートリー → ポートフォリオ
    4階層戻ることになる

  place_1:
    where: さがす（一覧の上）
    show: あなたの経歴 ／ まだ書いていません or 整っています
    action: 押すと経歴の画面へ
    reason: 応募する前に自分の状態が分かる

  place_2:
    where: 応募する（お見せするもの）
    show: 空の項目だけ「まだ書いていません ［ここで書く］」
    action: 押すと経歴の画面へ。戻ると応募の続き
    do_not: 空でない項目に出さない

  form: 画面（板ではない）
  reason: |
    曲を足すのは1行なので板にした。
    経歴は長い（学んだところ・師事・賞・じぶんのことば）ので画面
```

---

## 4g. WHAT_A_POSTING_SHOWS

```yaml
# 2026-09-19 確定。募集に何を載せるか

show:
  date: 日にち（10月18日）
  kind: 内容（実技試験／コンクール／演奏会／録音）
  piece: 曲目
  fee:
    amount: 金額（数字だけ自由に打てる）
    unit: 単位（選ぶ。自由記述にしない）
      - 1回の本番
      - 1回の練習
      - 時給
      - まとめて（本番N回＋練習N回）
    sodan: 「相談に応じます」チェック1つ

never_show:
  - time: 時間（14:00〜）
  - venue: 本番の会場（千葉文化会館）
  - place: 合わせの場所（学校の中／外のスタジオ）

why: |
  日にち＋時間＋場所がそろうと「その人がいつどこにいるか」が分かる。
  裁定その94 §7 で「いつどこにいるかが分かるものを出さない」と
  書きながら、募集の画面で自分で破っていた（Opus の設計ミス）

when_to_tell: 成立の後。本人同士で決める。アプリは関わらない
do_not_add: 「相談して決める」という選択肢も置かない（全部成立後）

applicant_side:
  show: 来られる日（日にちだけ。時間を出さない）
  note: 時間が合うかは成立後に確かめる

negotiation:
  before_match: できない。定型文のみ
  entry: 「相談に応じます」のチェックで可否だけ示す
  after_match: 本人同士で自由に
  do_not: 定型文を増やして交渉させる
    reason: 組み合わせで意味を作ることになり、結局自由文が要る

sodan_template:
  text: "お礼について相談させてください"
  show_only_if: 募集に sodan=true があるとき
  reason: 無い募集に出すと、値切りの道具になる
```

---

## 5. L3_CUT

```yaml
actions:            # 3つとも1タップ。理由を問わない
  withdraw: 応募を取り下げる
  mute:     この人からの連絡を止める
  hide:     この人に自分を見せない
silent: true
  rule: 相手に通知しない。相手からは最初から居なかったように見える
  reason: 「切られた」と分かると別経路で接触してくる
  industry_standard: Instagram / GitHub 同様
after_match: 成立後も切れる。その本番の話は流れてよい
record:
  visible_to: 本人のみ（運営も見ない）
  reason: 「切った理由」を聞かれる不安を作らない
separation_from_report:
  do_not: 切った後に「通報しますか」と聞く
  reason: 切ることの敷居が上がる
  must:   切っても通報の口が残る（ProPublica指摘の欠陥回避）
```

---

## 6. L4_REPORT

```yaml
flow:
  1: 通報1件 → 即時サスペンド（自動）
  2: 坂本さんが確認
  3: 復帰 / 永久停止
why_immediate:
  fact: 2026-10-19 以降 開発者は欧州（時差8時間）
  review_first:  8時間 被害が継続
  suspend_first: 冤罪でも数日。被害は1日で起きる
why_not_3_strikes:          # 坂本さん提案の却下理由
  - 被害者は通報しない（20%）。1人が何十人に接触しても通報1-2件
  - 3回到達まで年単位
  - 1回目と2回目の間に被害が発生
why_not_instant_permanent:
  - 加害者が先に被害者を通報する逆用
  - 嫌がらせ通報
after_review:               # 3択。中間を作らない
  a: 誤解・行き違い → 復帰。記録に残す
  b: 度を越している → 永久停止
  c: 判断つかず     → 停止のまま。双方に聞く
  do_not: 期限付き停止（1か月後に戻ってくる）
protect_reporter:
  - 誰が通報したかを相手に伝えない
  - 通報したことでその相手から見えなくなる
  reason: これが無いと誰も通報しない
```

---

## 7. PROFILE_FIELDS

```yaml
show: [name(芸名可), instrument, regions, career, recordings]
hide:
  - address, phone, birthdate
  - 通っている教室・時間割
  - age, grade, enrollment_year    # 若いと分かる情報
regions:
  wrong: 住んでいる県（山梨は広い。通えるか不明）
  wrong: 市区町村（特定に近づく）
  right: よく演奏するところ（複数選択）
  reason: 演奏家は住む県と演奏する県が異なることが多い
```

---

## 8. REDUCE_ISOLATION

```yaml
add:
  - 合わせの場所を書く欄（公開の練習室を推奨）
  - 第三者が同席してよい、と明記
  - 予定を信頼できる人に知らせる
    ref: Tinder "Share My Date" 2024-04, Bumble 2025
money:
  platform_mediates: false
  reason: 決済を持つと責任を負う。別事業
  but: 「いくらで」の欄は必要（定型文に含む）。無いと成立後に揉める
```

---

## 9. CONFLICTS_WITH_PRINCIPLES

```yaml
conflict_1:
  principle: 判断を取り上げない
  violation: 何を書くかをアプリが決める
  severity: high
  opus_view: >
    「何を書くか」は判断ではなく手段。相手を選ぶ・断る・切るという
    判断は残っている。ただしこれは言い訳かもしれない
  decision: ADOPTED
  approved_by: 坂本
  approved_at: 2026-09-18
  status: resolved

conflict_2:
  principle: 人を介さない。問い合わせ窓口を設けない
  violation: 通報を坂本さんが見る
  severity: high
  opus_view: >
    通報は問い合わせではない。人の安全に関わる。ここだけは人が
    見るしかない。ただし決まりを1つ曲げることに変わりはない
  decision: ADOPTED
  approved_by: 坂本
  approved_at: 2026-09-18
  status: resolved

conflict_3:
  principle: 不安を煽らない
  violation: 「切れます」「通報できます」の説明
  severity: low
  resolution:
    wrong: "危険な人がいるかもしれません"
    right: "合わないと思ったら、いつでも切れます。理由は要りません"
  status: resolved

conflict_4:
  principle: 取り消されても損害が生じない形にする
  violation: マッチングを止める
  severity: low
  resolution: >
    止まるのはマッチングのみ。記録・ノート・レパートリー・ひつじ・
    アカウントは1つも消さない
  status: resolved
```

---

## 9b. PRINCIPLE_AMENDMENTS

```yaml
# 2026-09-18 坂本さん承認。以後この2件は例外として確定

amendment_1:
  principle: 判断を取り上げない
  exception: マッチングの成立前のやりとり
  scope: 送れることばを定型文に限る。自由記述の欄を持たない
  not_extended_to:
    - 他のどの画面にも広げない
    - 成立後のやりとりには適用しない（本人同士が自由に決める）
  reason: ロマンス詐欺・グルーミングの第一歩は外部連絡先への誘導

amendment_2:
  principle: 人を介さない。問い合わせ窓口を設けない
  exception: 通報
  scope: 通報の内容を坂本さん本人が確認する
  not_extended_to:
    - 退会・支払い・問い合わせ一般は従来どおり人手を介さない
    - 通報以外の連絡口を作らない
  reason: 安全に関わる判断を機械に任せない

record_note: |
  この2件は Woolsong が決まりを曲げた最初の例外。
  以後、同種の提案があったときは「マッチングで曲げたから」を
  理由にしない。個別に判断する
```

---

## 10. IMPLEMENTATION_ORDER

```yaml
1: ポートフォリオ（経歴・録画・公開範囲）
   reason: 経歴が無いと応募しても相手が判断できない。空の名刺交換になる
2: 募集を出す・応募する（定型文のみ）
3: 切る（3種。理由不要）
4: 通報（即時停止＋人による確認）
5: 成立後（連絡先交換・履歴）
```

---

## 11. VERIFY

```yaml
Q1: 切った相手から自分が1行も見えない
Q2: 切っても通報の口が残る
Q3: 定型文以外を送れない（APIを直接叩いても）
Q4: 通報1件で即時停止
Q5: 停止しても記録・ノート・ひつじが残る
Q6: 18歳未満が外向けに出ない
Q7: age / grade / enrollment_year がどこにも出ない
Q8: サスペンド中のユーザーが募集一覧に出ない
Q9: 通報者が被通報者から見えなくなる
```

---

## 12. LEGAL

```yaml
japan_dating_site_law:
  requires_all_4:
    1: 面識のない異性との交際希望者の情報を電子掲示板に掲載
    2: 公衆が閲覧可能
    3: 閲覧者同士が電子メール等で相互連絡可能
    4: 反復継続提供
  woolsong: 1と3を満たさない設計 → 非該当と解される
  caution: 確定的な行政解釈・判例は確認できず。リリース前に弁護士確認を推奨
platform_liability_japan:
  principle: 場の提供者。原則として利用者間トラブルの責任を負わない
  invalid: 「一切責任を負わない」の全部免責（消費者契約法）
  valid: 「当社の過失による損害は過去1か月の利用料相当額を上限」
```

---

## 13. SOURCES

```yaml
- 警察庁 令和6年確定値 2026-05-23
  https://www.npa.go.jp/bureau/criminal/souni/tokusyusagi/hurikomesagi_toukei2024.pdf
- Valentine, Miles, Hamblin & Gibbons (2022) J Interpersonal Violence
  DOI 10.1177/08862605221130390
- US DOJ BJS "Rape and Sexual Victimization Among College-Aged Females, 1995-2013"
- ProPublica/CJI "Addressing Rape in Four Minutes or Less" 2021-05-27
- The Washington Post 2018-07-26 (Midgette, McGlone)
- 猪谷千香『ギャラリーストーカー』
- 原田真帆 2026-02（音大おじさん問題の告発）
- 警察庁 出会い系サイト規制法
  https://www.npa.go.jp/policy_area/no_cp/deai/regulatory.html
```
