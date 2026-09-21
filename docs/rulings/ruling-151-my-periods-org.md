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

---

## 実装したときの覚え（Code・2026-09-21）

この紙が届く前に、会話で受け取った同じ内容を
`ruling-151-koma-mine-org-id.md` として自分で書き起こし、実装しました。
原文が届いたので、書き起こしは消し、この紙を正とします。番号は同じ 151 です。

紙 `supabase/migration_my_periods_org_id.sql`（test と本番の両方に当てました）

裁定文に無い変更を1つしています（事後にご承認をいただきました）──
`unique (user_id, ord)` があり、2校目の「1限」を作れませんでした。
個人用と学校用の2本の部分一意索引に分けました。

- `my_periods_uniq_personal (user_id, ord) where org_id is null`
- `my_periods_uniq_org (user_id, org_id, ord) where org_id is not null`

2本に分けたのは、Postgres が null どうしを別の値と見るためです。1本だと
個人の「1限」をいくつでも作れてしまいます。

Q3（org_id を別の学校へ動かせない）は決まり（RLS）では書けません。決まりは
古い値と新しい値を見比べられないためです。引き金
`assert_my_periods_org_stable` で止めています。

VERIFY は Q1〜Q5 を試しの台帳で本人の鍵で実測しました（6/6・
`tools/ruling151_check.js`）。Q6 は本番に在籍1校の方が 0名で、移行で動く行が
1行も無いため、比べる対象がありません。

在籍2校以上の3名は台帳 08-11 に残しました。
