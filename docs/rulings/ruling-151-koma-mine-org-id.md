# 裁定その151 — my_periods に org_id を足す

2026-09-21 ／ Opus ／ design-v10
きっかけ：裁定149 の条文 `has_can(org_id,'koma_mine')` が書けない。my_periods に org_id が無い

> 受け取った原文の見出しは「その150」でした。150 は `ruling-150-row-tap.md` が
> 使っています。原文の指示「台帳で空いている次の番号に振り直すこと」に従い、
> **151** としました。

```yaml
decision: option_2。ただし org_id は null を許す

reject_option_1:
  reason: |
    学校に属さない利用者が、自分のコマを書けなくなる。
    「自分のコマの時間」は個人の画面にもある機能。学校の札で個人の
    機能を止めるのは取り上げになる。
    また「どこか1校で koma_mine を持てば全部に書ける」は、A校の札で
    B校のコマを書ける形になり、裁定140（学校ごとに閉じる）と合わない

why_option_2:
  - コマの時刻は学校ごとに違う（A校は9:00、B校は9:10）。本来、学校ごとのもの
  - 複数校在籍（裁定140）と形が揃う

schema:
  my_periods.org_id: uuid null references organizations(id)
  null: 個人のコマ（学校に関係しない）
  not_null: その学校でのコマ

write:
  org_id_is_null: user_id = auth.uid()
  org_id_is_not_null: user_id = auth.uid() AND has_can(org_id,'koma_mine')
  both: USING と WITH CHECK の両方
  stable: org_id を後から別の学校に書き換えられないこと

read:
  get_teacher_periods: org_id = p_org_id の行だけ返す
  personal_rows: org_id is null は学校の側に1行も返さない
  reason: |
    列を足しただけで読み側を直さないと、事務（sched_all）が先生の
    個人のコマまで読める形が残る。同じ学校の先生のコマを事務が読む
    こと自体は正しい（裁定99 F1）。直すのは「学校の外のものまで
    読める」ところだけ

migration:
  one_org_with_koma_mine: org_id をその学校に
  zero_org: null のまま（個人）
  two_or_more_orgs: null のまま。一覧に出す。自動で決めない
  never: 推測で学校を決めない

verify:
  Q1: 学校に属さない人が、自分のコマ（org_id null）を書ける
  Q2: A校で koma_mine を持つ人が、B校のコマを書けない
  Q3: org_id を別の学校へ書き換えられない
  Q4: 事務が get_teacher_periods で、個人のコマ（null）を1行も読めない
  Q5: 事務が、同じ学校の先生のコマは読める（裁定99 F1 が壊れていない）
  Q6: 移行後、在籍1校の先生の画面が、移行前と同じコマを出す

env: test で先に流す
```
