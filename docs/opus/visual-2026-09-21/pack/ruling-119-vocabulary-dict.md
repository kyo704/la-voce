# RULING 119 — ことばの 出し分け（実装設計）

```yaml
ruling: 119
date: 2026-09-20
implements: 裁定その96（方針）
purpose: 辞書と判定ロジックを、実装できる形にする
```

---

## 1. 分野の分類

```yaml
fields:
  music:              # ★既定
    label: 音楽（歌・楽器）
    includes: 声楽 / 器楽 / 作曲 / 指揮 / 音楽教育
    ★声楽と器楽を分けない
    reason: |
      「曲目」「レパートリー」「本番」は声楽も器楽も同じ。
      分けても置き換わる語がない

  voice:
    label: 声の お仕事
    includes: 声優 / ナレーター / アナウンサー / 朗読
    ★「伴奏」の概念がない → さがすを出さない

  stage:
    label: 舞台
    includes: 俳優 / ミュージカル / 演劇
    ★歌う場合は music を選んでもらう

★3つで足ります
rejected:
  - 声楽と器楽を分ける（置き換わる語がない）
  - コールセンター・研修（個人向けでない）
  - 合唱団（music に含む）
```

---

## 2. 辞書（対応表）

```yaml
# ★見本での出現数を併記。多いものから直す

VOCAB:
  # ── 作品 ──────────────────────────
  piece:                      # 見本 17件
    music: 曲目
    voice: 作品
    stage: 演目
  repertoire:                 # 見本 32件
    music: レパートリー
    voice: 持ち役
    stage: 持ち役
  maker:                      # 作った人
    music: 作った人
    voice: 役
    stage: 役
  score:                      # 楽譜 4件
    music: 楽譜
    voice: 台本
    stage: 台本

  # ── 場 ────────────────────────────
  concert:                    # 演奏会 16件
    music: 演奏会
    voice: 収録・本番
    stage: 公演
  honban:                     # ★本番 106件
    music: 本番
    voice: 本番
    stage: 本番
    ★note: 3つとも同じ。置き換え不要
  keiko:                      # ★稽古 35件
    music: 稽古
    voice: 稽古
    stage: 稽古
    ★note: 3つとも同じ。置き換え不要
  lesson:
    music: レッスン
    voice: レッスン
    stage: 稽古

  # ── 人・組織 ──────────────────────
  monka:                      # ★門下 97件
    music: 門下
    voice: クラス
    stage: クラス
  accompanist:                # 伴奏 18件
    music: 伴奏者
    voice: null               # ★機能ごと出さない
    stage: null
  singer:                     # 歌い手 4件
    music: 歌い手
    voice: null
    stage: null

  # ── 試験 ──────────────────────────
  exam:                       # 実技試験 17件
    music: 実技試験
    voice: 実技試験
    stage: 実技試験
    ★note: 同じ
  contest:                    # コンクール 10件
    music: コンクール
    voice: オーディション
    stage: オーディション

  # ── 声に固有 ──────────────────────
  voice_type:                 # 声種 2件
    music: 声種
    voice: 声質
    stage: 声質
  range:                      # 音域 1件
    music: 音域
    voice: 音域
    stage: 音域

★置き換えが要るのは 9語
  piece / repertoire / maker / score / concert /
  monka / accompanist / singer / contest

★置き換えが要らない 5語
  honban / keiko / exam / range / lesson（stage のみ違う）
```

---

## 3. 判定ロジック

```yaml
storage:
  profiles.field: 'music' | 'voice' | 'stage'
  default: 'music'
  nullable: false

WHEN_TO_ASK: 登録時に1問

  「どんな お仕事ですか」
    ○ 音楽（歌・楽器）
    ○ 声の お仕事（声優・ナレーター・アナウンサー）
    ○ 舞台

  ★1問だけ。★あとから設定で変えられる

★既存の登録情報から判定できるか: ★できません
  理由:
    - 学校名からは分からない（音大にも声優コースがある）
    - 楽器の登録は任意
    - ★推測すると外れる。外れると全画面のことばが違う
  ★38人には、次に開いたときに1度だけ聞く

CHANGING:
  いつでも変えられる
  ★記録は1つも変わらない
  ★見え方だけが変わる
  ★聞き直さない（催促しない）
```

---

## 4. 機能の出し分け

```yaml
# ★ことばだけでなく、機能そのものを出し分ける

さがす（マッチング）:
  music: 出す
  voice: ★出さない
  stage: ★出さない
  reason: 伴奏者を探さない
  where: もっと ／ きょうの新着 ／ レパートリーからの導線

レパートリー:
  music: 出す（曲名・作曲者）
  voice: 出す（作品名・役名）
  stage: 出す（演目・役名）
  ★3つとも出す。ことばだけ変える

ポートフォリオ:
  ★3つとも出す
  ★録画は voice / stage でも要る（デモ音源・出演作）

しらべる（声の分析）:
  music: ★声楽のみ意味がある
  voice: ★意味がある
  stage: ★意味がある
  ★出し分けない。声を使う人が買う
  ref: 裁定その95（しらべるは声を使う人だけ）

do_not:
  - 使えない機能を薄く出す
  - 「音楽の方はこちら」の分岐画面
  ref: 裁定その73（持っていないものを出さない）
```

---

## 5. 実装

```yaml
file: lib/vocab.js

api:
  getVocab(field)   → 辞書を返す
  W(key)            → 現在の分野の語を返す
  hasSearch()       → さがすを出すか

usage:
  before: '曲目は これから'
  after:  W('piece') + 'は これから'

★置き換えない場所:
  - SC のキー（画面名）
  - push() の引数
  - grep で拾う印（「8文字」など）
  reason: 画面の配線が壊れる

★置き換える場所:
  - 見出し・本文・注記
  - 札のラベル
  - placeholder
  - 空の姿の文言

ORDER:                # ★出現数の多い順
  1: monka（97件）
  2: repertoire（32件）
  3: accompanist（18件）
  4: piece（17件）／ exam（17件）
  5: concert（16件）
  6: contest（10件）
  7: 残り
```

---

## 6. 辞書の増やし方

```yaml
WHO: Opus が決める。Code は足さない
reason: |
  ことばは製品の一部。
  「門下」を「クラス」にするのは、設計の判断

HOW:
  1: 新しい語が要ると分かったら、Opus に上げる
  2: Opus が3分野ぶんを決める
  3: 裁定その119 の §2 に追記
  4: ★版を上げる（design-v8 など）
  ref: 裁定その114 §5

★do_not:
  - Code が辞書に語を足す
  - null を勝手に埋める（機能ごと出さない判断は Opus）

FALLBACK:
  W() が未定義のキーを呼んだとき
  ★キー名をそのまま返さない
  ★★console に警告を出し、music の語を返す
  reason: 画面に 'piece' と出るのは事故
```

---

## 7. 英語版との関係

```yaml
★同じ工事です
ref: 裁定その95 §5（ポートフォリオの英語版）
ref: 2026-09-10 評価「画面の文字を1か所に集める」

VOCAB を作ると:
  → 画面の文字が1か所に集まる
  → ★英語版が作れるようになる
  → ★欧州の音楽院に出せる

★つまり:
  国内で的を広げる工事と、
  世界に出る工事が、★同じものです
```

---

## 8. VERIFY

```yaml
Q1: field='voice' で「曲目」がどこにも出ないこと
Q2: field='voice' で「さがす」が出ないこと（3箇所とも）
Q3: field を変えても、記録が1件も変わらないこと
Q4: 既存の38人が全員 'music' になること
Q5: W() が未定義のキーで警告を出すこと
Q6: SC のキーが置き換わっていないこと（画面が開くこと）
Q7: 登録時の1問が、1度だけ出ること
```
