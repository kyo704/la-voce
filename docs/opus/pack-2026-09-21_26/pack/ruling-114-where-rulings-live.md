# RULING 114 — 裁定の置き場所

```yaml
ruling: 114
date: 2026-09-20
reason: CLAUDE.md を30行にするため、裁定113件の行き先を決める
basis: Fable「効率の良い仕事の方法」F5（CLAUDE.md は短く）
```

---

## 1. 3つの置き場所

```yaml
CLAUDE.md:
  何を: 変えない原則だけ。30行
  判定: ★「消したら間違えるか」
  ★裁定の本文は入れない

.claude/skills/:
  何を: ★機械が使うもの
  形: 実行できる道具・機械可読の規則
  例: 比較・検査・見張り・座標・トークン

docs/rulings/:
  何を: ★人が読むもの
  形: 設計の理由・経緯・却下した案
  ★@ で参照させる。常時読ませない
```

---

## 2. 分類（手元の12件）

```yaml
skills:
  ruling-71-sheep-room-coordinates:
    → .claude/skills/sheep-room/
    reason: 座標。機械が読む
  ruling-81-visual-design:
    → .claude/skills/visual-tokens/
    含む: 色のトークン・文字6段・SVG 15種・コントラスト規則
    ★§7（確かめ方）は道具そのもの
    ★§9（失敗4件）は docs へ
  ruling-112-env-and-diff:
    → .claude/skills/screen-compare/ ＋ hooks
    ★§1（環境）は hook に。§2（比較手順）は skill に

docs:
  ruling-73-classroom-gating:    教室機能の出し分け
  ruling-78-ops-layout:          運営のナビ・表（調べの出典つき）
  ruling-83-joining-school:      学校に入る道
  ruling-90-attendance-count:    出席の回数・授業の型
  ruling-94-matching-safety:     マッチングの安全（調査つき）
  ruling-95-pricing:             値段と広がり
  ruling-96-vocabulary:          ことばの出し分け
  ruling-110-refund-basis:       返金の根拠（法務）
  ruling-113-standards:          判定の標準

constitution:
  ★各裁定から1行ずつ抜いて CLAUDE.md に
  すでに反映済み（別紙 CLAUDE.md）
```

---

## 3. 手元に無い裁定（その1〜70・その97〜111）

```yaml
★私の手元にありません
★Code / Sonnet 側にあるはずです

分類の基準（これを使ってください）:

skills へ:
  - 座標・数値・トークン
  - 機械が判定できる規則
  - 検査の手順
  例: その75（TABLE_AT=933）／その103（文字サイズの寄せ方）

docs へ:
  - 設計の理由
  - 却下した案とその理由
  - 調査の出典
  例: その97（裁定84の取り消し）／その105（採点の設計）

CLAUDE.md へ:
  ★「消したら間違えるか」が yes のものだけ
  ★各裁定から1行。本文を入れない
  例: その93「RLS は列を守らない」→ select('*') を書かない

★捨てる:
  - 取り消した裁定（その84・その100の一部）
  - 一時的な判断（その日だけの作業順）
  ★★ただし ★取り消した記録は docs に残す
  reason: 次の人が同じ案を出したとき、理由が分かる
```

---

## 4. hooks に移すもの

```yaml
★CLAUDE.md に書いても守られないもの
ref: Fable F6「指示は助言的。hooks は決定的」

PreToolUse:
  本番のホスト名・project-ref を含む Bash/psql/supabase をブロック
  Playwright の baseURL に test が無ければ起動しない
  ref: 裁定その112 §1

PostToolUse:
  select('*') を ESLint で検出
  編集後に vm.Script で構文検査
  ref: 裁定その113 §5

Stop:
  画面タスクで compare 画像が更新されていなければ終われない
  ref: Fable MAPPING「完了しました と実態の食い違い」

★編集の途中で止めない（Fable F13）
```

---

## 5. 版の管理

```yaml
★これが「6文字 grep」の置き換えです

1つの版に含むもの:
  見本4本
  docs/rulings/ 全部
  .claude/skills/ 全部
  CLAUDE.md
  tokens.md

タグ: design-v7（実行ルートの版に合わせる）

依頼文に必ず書く:
  「design-v7 に基づく」

★正誤表で直さない。版を上げて配る
reason: 2026-09-17 に直した羊の部屋が 09-18 に戻った
        版が無かったため
```

---

## 6. VERIFY

```yaml
Q1: CLAUDE.md が30行以内であること
Q2: CLAUDE.md に裁定の本文が入っていないこと
Q3: skills の道具が、故意の1件を検出すること
Q4: hook が本番の操作をブロックすること
Q5: 依頼文に版タグが入っていること
```
