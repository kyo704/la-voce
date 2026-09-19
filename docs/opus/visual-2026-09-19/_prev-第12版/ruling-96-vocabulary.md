# RULING 96 — vocabulary & markets

```yaml
ruling: 96
date: 2026-09-19
reason: 声を使う職業（声優・アナウンサー）に売るには言葉が合わない
basis: 2026-09-19 調査
```

---

## 1. MARKET_SIZE

```yaml
voice_actors:
  aspirants: 約30万人        # 浪川大輔・岩田光央の証言。Wikipedia経由
  working: 約1万人
  living_on_it: 約300人
  note: 母数は音楽大学（学生1.6万人）の数十倍

schools:
  声優養成所: 56校以上
  声優専門学校: 38校
  年間学費: 20万〜150万円   # 俳協ボイス 22万円が最安部類
  implication: 学費を払える層。年3,600円は障壁にならない

music_universities:
  count: 35校（縮小中）
  students: 約1.6万人（2020年）
  comparison: 声優志望30万人 vs 音大生1.6万人 = 約19倍
```

---

## 2. TARGET_TIERS

```yaml
tier_1:                    # 言葉を変えるだけで売れる
  - 声優養成所（56校以上）
  - 声優専門学校（38校）
  - アナウンススクール
  - ナレーター養成
  what_works:
    - しらべる（声の分析）── 同じ問題を抱えている
    - 本番前の不安（MPA と同構造）
    - 記録・羊
  what_does_not:
    - マッチング（伴奏者が要らない）

tier_2:                    # 少し手が要る
  - ミュージカルスクール    # 歌う。曲目がそのまま使える
  - 合唱団・オペラ研修所
  - 大手音楽教室の支部（ヤマハ約2,300校）
  what_works: すべて（マッチング含む）

tier_3:                    # 別の資料が要る
  - 演劇・舞台の養成所
  - 企業のアナウンサー研修
  note: 今回の対象外
```

---

## 3. VOCABULARY_PROBLEM

```yaml
current_words:             # 音楽に固有。声優に通じない
  曲目: 音楽
  レパートリー: 音楽
  演奏会: 音楽
  伴奏者: 音楽
  門下: 音楽（師弟）
  本番: 共通
  稽古: 共通

why_not_rewrite:
  - 音楽大学向けには今の言葉が正しい
  - 書き換えると音楽側が壊れる
  - 出し分けが要る
```

---

## 4. VOCABULARY_SETS

```yaml
implementation: 用語の組を持ち、利用者の分野で切り替える

storage:
  profiles.field: 'music' | 'voice' | 'stage'
  default: 'music'
  set_at: 登録時に1問。あとから設定で変えられる
  question: "どんなお仕事ですか"
  options: [音楽（歌・楽器）, 声のお仕事（声優・ナレーター・アナウンサー）, 舞台]

sets:
  music:                   # 既定。いまの言葉
    piece: 曲目
    repertoire: レパートリー
    concert: 演奏会
    accompanist: 伴奏者
    monka: 門下
    lesson: レッスン
    practice: 稽古

  voice:
    piece: 作品
    repertoire: 持ち役
    concert: 収録・本番
    accompanist: null      # ★機能ごと出さない
    monka: クラス
    lesson: レッスン
    practice: 稽古

  stage:
    piece: 演目
    repertoire: 持ち役
    concert: 公演
    accompanist: null
    monka: クラス
    lesson: 稽古
    practice: 稽古
```

---

## 5. FEATURE_GATING_BY_FIELD

```yaml
# 言葉を変えるだけでなく、機能そのものを出し分ける

music:
  さがす: 出す
  レパートリー: 出す（曲名・作曲者）

voice:
  さがす: 出さない          # 伴奏者が要らない
  レパートリー: 出す（作品名・役名）
  reason: 持ち役の管理は声優にも要る

stage:
  さがす: 出さない
  レパートリー: 出す（演目・役名）

do_not:
  - 使えない機能を薄く出す（押せない札を作らない）
  - 「音楽の方はこちら」のような分岐画面
  reason: 裁定その73（教室機能の出し分け）と同じ形
```

---

## 6. WHAT_SELLS_TO_TIER_1

```yaml
core_pitch:
  - 声の調子と体調の記録
  - 本番前の不安（MPA）
  - 点数を出さない・比べない
  - 羊（継続）

evidence_to_use:
  - MPA 有病率 学生21〜50%、ある調査96%
    src: Fernholz et al. 2019 系統的レビュー
  - 音楽学生はプロより症状が強い
    src: Frontiers 2026, ドイツ全国調査 n=1392
  note: これは「音楽演奏不安」の研究だが、声優の収録前・
        アナウンサーの本番前と同じ構造。ただし声優を対象にした
        研究は確認できなかった。そう書くこと

price:
  しらべる 年4,800円
  よそおい 月580円
  Woolsong 年3,600円     # 公開ページ。オーディション資料に使える
  note: 養成所の学費が年20〜150万円。年4,800円は障壁にならない

school_sales:
  養成所向け: 月額は音大と別に決める（規模が違う）
  未決: 価格を決めていない
```

---

## 7. IMPLEMENTATION

```yaml
where: lib/vocab.js（新規）

api:
  getVocab(field): 用語の組を返す
  W(key): 現在の分野の言葉を返す（短縮形）

usage:
  before: '曲目は これから'
  after:  W('piece') + 'は これから'

scope:
  - 画面の文字すべて
  - 空の姿の文言
  - 注記
  - 通知

note: |
  これは「画面の文字を1か所に集める」工事と同じもの。
  欧州へ出るための下ごしらえと、国内で的を広げる下ごしらえが
  同じ作業になる（2026-09-10 評価 §6-9 と同じ結論）

order:
  1: lib/vocab.js と3つの組を作る
  2: profiles.field を足す（既定 'music'）
  3: 登録時の1問
  4: 画面の文字を W() 経由に置き換える（段階的でよい）
  5: 機能の出し分け（§5）
```

---

## 7b. MATCHING_VISIBILITY

```yaml
# 2026-09-19 追補。マッチングは登録者の総数が価値なので、目立たせる

do_not:
  - 別アプリに分ける
    reason: |
      Woolsong の利用者が流れるだけで増えない。
      マッチング専用は本番の前だけ＝数か月に1回しか開かない。消される
  - 5つ目のタブにする
    reason: 羊を押しのける。羊は継続を支える唯一の装置

where: きょう。ただし順序をつける
priority:
  1: 自分宛て（返事が届いた／応募が来た）    # いちばん強い
  2: 近くの新着（活動範囲が合うもの）
  3: 全体の新着
rule: 1があるときは2と3を出さない
reason: 同時に出すとどれも目立たない

if_zero: 何も出さない
ref: 裁定その73（0件なら節ごと出さない）

field_gating:
  voice / stage: 出さない（伴奏者が要らない）

empty_state:            # ネットワーク効果を持つ機能は最初がいちばん難しい
  text: |
    まだ 募集は ありません。
    最初の 1つを 出してみませんか。
  action: [募集を出す]
  note: |
    この学校の方だけがご覧になれます。
    出しても、すぐに応募が来るとはかぎりません。
    期限を決めておくと、そのまま残りつづけません。

how_to_grow_pool:
  wrong: 声優に広げる（伴奏者を探さない。母数に入らない）
  right: 器楽・合唱団・アマチュアに広げる
```

---

## 8. VERIFY

```yaml
Q1: field='voice' で「曲目」がどこにも出ないこと
Q2: field='voice' で「さがす」が出ないこと（もっとにも、きょうにも）
Q3: field を変えても、書いた記録が消えないこと
Q4: 既存の利用者が全員 'music' になること
Q5: W() が未定義のキーを呼んだとき、キー名がそのまま出ないこと
```

---

## 9. NOT_DECIDED

```yaml
- 養成所向けの価格（音大と別。規模が違う）
- 養成所向けの営業資料（いまは音大向けしかない）
- 声優を対象にした本番前不安の研究（確認できなかった）
- tier_3（演劇・企業研修）は対象外
```
