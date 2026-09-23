# RULING 127 — ポートフォリオの型

```yaml
ruling: 127
date: 2026-09-21
supersedes: 裁定その95 §5（ポートフォリオの質）を具体化
basis: 調査 2026-09-21（レイアウト類型・数値・実例）
related: その119（ことばの出し分け）／その126（ホームページ機能）
```

---

## 1. WHY_12_TYPES

```yaml
problem_found:
  ★2026-09-20 に Opus が8種を提案 → 坂本さんの評価「微妙」
  ★原因: 骨格を変えず、★色と書体だけ変えていた
  ★8つとも同じものに見えた

principle:
  ★型は 骨格ごと変える
  ★色と書体だけの差は「型」ではない

structure:
  型 = 骨格 × ヒーロー × 配色 × 書体
  ★利用者には ★完成した12種として見せる
  ★掛け算を選ばせない（選択肢が増えると決められない）
```

---

## 2. TYPES

```yaml
# 紙（A4・PDF）6種

T1_minimal:
  name: ミニマル・エディトリアル
  skeleton: シングルカラム
  font: 明朝（Noto Serif JP）
  color: 無彩色
  rule: ★3件しか書かない
  for: [指揮者, ライター, 格を示すとき, 欧州の音楽院]
  print: ◎  web: ◎
  not_for: 情報量が多い人

T2_grid:
  name: ギャラリー・グリッド
  skeleton: グリッド（2×2）
  for: [写真, イラスト, 舞台写真]
  requires: ★写真が4点以上、かつ粒度が揃っていること
  print: ○  web: ◎
  not_for: 写真が無い人（成立しない）

T3_split:
  name: スプリット・プロフィール
  skeleton: 分割画面（左38%固定 / 右）
  left: 宣材写真 ＋ 条件（声質・音域・方言）
  right: 実績
  for: [声優, 俳優, アナウンサー]
  print: ◎  web: ◎
  ★caution: ATS が読めない（2段組）。紙で出す前提

T4_timeline:
  name: タイムライン・キャリア
  skeleton: 縦の線 ＋ 点
  for: [経歴で語る人, 留学した人]
  print: ◎  web: ◎
  not_for: 件数が多い人（2枚目に溢れる）

T5_classic:
  name: クラシック・レジュメ
  skeleton: 単一段組
  for: [日本の音大出願, コンクール]
  print: ◎  web: △
  ★note: ATS が読める唯一の型。最も安全で、最も目立たない
  ★師事を「主に／公開講座」で分ける（東京藝大の指針）

T6_vertical:
  name: 和・縦書き
  skeleton: writing-mode: vertical-rl
  era: 元号
  for: [邦楽, 和物, 伝統芸能]
  print: ◎  web: ○
  not_for: 洋楽・海外

# Web 6種

T7_theater:
  name: フルスクリーン・シアター
  skeleton: 1画面 = 1件
  for: 1作で覚えてもらう人
  web: ◎  print: ✕
  ★requires: 絞れること。絞れないなら使わない

T8_appshell:
  name: App-shell・テック
  skeleton: 左固定サイドバー ＋ 右スクロール
  reference: Brittany Chiang（brittanychiang.com）
  font: 等幅（JetBrains Mono）をアクセントに
  color: ダーク
  for: [情報量が多い人, 海外向け]
  web: ◎  print: ✕
  mobile: 1列に畳む

T9_bento:
  name: bento・自己紹介1枚
  skeleton: 可変サイズのタイル格子
  for: [複数の顔を持つ人, SNSから来る人, 伴奏者を探す]
  web: ◎  print: ✕
  ★opportunity: Bento.me が 2026-02-13 に終了。需要の受け皿が空く
  not_for: 読む順序を指示したいとき

T10_voice:
  name: ボイス・サンプル
  skeleton: シングルカラム ＋ 音源リスト最上部
  rule: ★30秒 × 3本
  for: [声優, ナレーター, アナウンサー]
  web: ◎  print: ✕
  requires: 音源

T11_bold:
  name: ボールド・ポップ
  skeleton: 極太タイポ ＋ 写真グリッド
  color: 差し色1つ（高彩度）
  for: [俳優, ダンサー, 若手]
  web: ◎  print: △
  not_for: 格を示す場

T12_epk:
  name: EPK・プレスキット
  skeleton: 動画 ＋ 経歴 ＋ 音源 ＋ 素材DL
  for: [主催者に渡す, 事務所に渡す]
  web: ◎  print: △
  ★principle: 「使う側」が必要なものを、探さずに取れる
```

---

## 3. NUMBERS

```yaml
# ★型ごとに埋め込む。利用者に決めさせない

font_size:
  web_body: 16–18px
  print_body: 11pt（10pt未満 禁止）
  print_heading: 14–16pt
  print_name: 18–24pt
  source: Butterick's（印刷10–12pt / Web15–25px）／Material Design

line_height:
  ja: 1.7（許容 1.5–2.0）
  en: 1.4（許容 1.2–1.45）
  source: Butterick's（120–145%）／WCAG 1.4.12（150%以上）

line_length:
  ja: 35字前後（許容 30–50、モバイル20）
  en: 66字（許容 45–75）
  source: Bringhurst／Butterick's

a4_margin:
  四辺: 1インチ（25.4mm）
  最小: 0.5インチ（12.7mm）

letter_spacing_ja:
  body: 0–0.05em
  heading: 0.1–0.2em

works_count:
  default: 5
  range: 3–7
  ★under_3: 警告を出す（幅が疑われる）
  ★over_7: 6点目から折りたたむ
  source: |
    Fstoppers「10枚の傑出した写真は、50枚に凡庸を混ぜるより無限に良い。
    見る人は、目にした最も弱い1枚で全体を判断する」
```

---

## 4. FIELD_MAPPING

```yaml
# 分野で、出す欄が変わる（裁定その119）

music:
  fields: [曲目, レパートリー, 演奏会, 師事, 声種, 受賞, 共演者, ホール]
  default_type_print: T5（日本）／ T1（欧州）
  default_type_web: T12

voice:
  fields: [作品, 持ち役, 収録, 所属・養成所, 声質・音域, 方言, 言語]
  ★extra: 声のサンプル（30秒×3）
  default_type_print: T3
  default_type_web: T10

stage:
  fields: [演目, 持ち役, 公演, 所属, 身長・靴・髪, できること, 声域]
  ★extra: 宣材写真（必須）
  default_type_print: T3
  default_type_web: T11

★rule: 分野で出す欄が変わる。★型は利用者が選べる
```

---

## 5. COUNTRY

```yaml
japan:
  photo: 任意（履歴書慣習では必須だが、演奏家は別）
  birthdate: ★出さない
  shiji: ★「主に師事」「公開講座」を分ける
  pages: 1枚

overseas:
  photo: ★既定オフ（差別回避。米英豪加では減点）
  birthdate: ★出さない
  shiji: studied with / studied under
  pages: 1枚
  ★note: 演奏家の宣材写真は、どの国でも歓迎される（別枠）

★implementation: 言語を切り替えると、既定が変わる
```

---

## 6. WHAT_MAKES_IT_BAD

```yaml
# ★「微妙」の正体。調査で判明した3つ

1_絞れていない:
  ★最頻かつ最大のダメージ
  対策: 既定5点。6点目から折りたたむ。3点未満は警告

2_数値管理の欠如:
  余白・行間・行長が管理されていない
  対策: ★型ごとに数値を埋め込む。利用者に決めさせない

3_テンプレ標準設定の放置:
  テンプレ既定の書体・配色をそのまま使う
  対策: ★型ごとに書体と配色を確定させる（選ばせない）

other:
  - 一貫性の欠如（複数人の作品に見える）
  - 誤字・リンク切れ・低解像度・遅い読み込み
  - 画像: 長辺1500px以上、JPEG品質90%、sRGB
```

---

## 7. IMPLEMENTATION

```yaml
data_model:
  ★データは1つ。型は表示だけ
  portfolio_entries に kind を持ち、型ごとに出す kind を決める

  kind:
    education / teacher / award / performance /
    repertoire / recording / role / skill / physical

type_selection:
  where: 経歴 → 見た目を選ぶ
  show: ★12種をプレビューで並べる
  default: 分野から自動で1つ選ぶ（§4）
  ★利用者は変えられる

output:
  web: 公開ページ（public_slug）
  print: A4 PDF
  ★同じデータから両方出す

paid:
  free: アプリの中のポートフォリオ
  ★Woolsong 年3,600円: 公開ページ ／ 紙PDF ／ 英語 ／ 12種すべて
  ★無料は T5（クラシック）1種のみ
  ref: 裁定その95

order:
  1: データ構造（kind を持つ）
  2: T5（無料・既定）
  3: T1 / T3 / T12（分野ごとの既定）
  4: 残り8種
  5: PDF 出力
  6: 英語版
```

---

## 8. VERIFY

```yaml
Q1: 12種が、並べたとき別物に見えること（骨格が違う）
Q2: 同じデータから12種すべてが出ること
Q3: 型を変えても、書いたものが1件も変わらないこと
Q4: 作品3点未満で警告が出ること
Q5: 作品7点超で折りたたまれること
Q6: 印刷で本文が10pt未満にならないこと
Q7: A4で2枚目に溢れないこと（溢れたら警告）
Q8: 英語版で写真・生年月日が既定オフであること
Q9: 分野を変えると、出す欄が変わること
Q10: T3 / T7–T12 が「紙に向かない」と表示されること
```

---

## 9. SOURCES

```yaml
- Fstoppers「Your Photography Portfolio Is Only as Strong as Your Weakest Photo」
- Butterick's Practical Typography（point size / line length）
- Material Design 3（typography）
- WCAG 2.2 §1.4.12（text spacing）
- Nielsen Norman Group「F-Shaped Pattern」2006 / 2017
- Ladders Eye-Tracking Study 2018（7.4秒）
- brittanychiang.com（T8 の参照）
- Bento.me サンセット告知（2026-02-13 終了）
- CodeFronts（グリッドの適性）
- 東京藝大 音楽総合研究センター（師事の書き方）
```
