# RULING 151 — my_periods に org_id を足す（裁定149 の実装の障害）

```yaml
ruling: 151（150 は「押せる行」と重なったため振り直し）
date: 2026-09-21
from: Code（my_periods に org_id が無く、裁定149 の条文どおりに書けない）
note: 裁定149 の本文は別チャット。引用された条文から判断した
related: その99 F1（事務が先生を選んで組む）／その140（学校ごとに閉じる）
```

```yaml
DECISION: option_2（org_id を足す）。org_id は null を許す

reject_option_1:
  - 学校に属さない人が自分のコマを書けなくなる（個人の機能を学校の札で止める）
  - 1校の札で全部の学校のコマを書ける抜け道になる（裁定140 と合わない）

SCHEMA:
  my_periods.org_id uuid null
    null: 個人のコマ ／ not null: その学校でのコマ

WRITE:
  org_id is null:     user_id = auth.uid()
  org_id is not null: user_id = auth.uid() AND has_can(org_id,'koma_mine')
  USING と WITH CHECK の両方。org_id を別の学校へ書き換えられない

READ（同じ工事で直す）:
  get_teacher_periods(p_org_id): org_id = p_org_id の行だけ
  org_id is null は学校の側に返さない

MIGRATION（test で先に）:
  在籍1校で koma_mine あり → その学校の org_id
  在籍0校 → null
  在籍2校以上 → null のまま、件数と user_id を台帳08 に。自動で決めない

VERIFY:
  Q1: 学校に属さない人が自分のコマを書ける
  Q2: A校の札で B校のコマを書けない
  Q3: org_id を別の学校へ書き換えられない
  Q4: 事務が個人のコマ（null）を読めない
  Q5: 事務が同じ学校の先生のコマは読める
  Q6: 移行後、在籍1校の先生のコマが変わらない
```
