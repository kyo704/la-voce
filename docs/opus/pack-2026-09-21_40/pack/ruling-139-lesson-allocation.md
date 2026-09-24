# RULING 139 — レッスン割（年度初め）を 1日で

```yaml
ruling: 139
date: 2026-09-21
implements: 裁定その138 R1
builds_on: 既存の「日程を組む」（P_kumu）／get_student_free_slots（裁定その98）
deadline: 2027-02 に動いていること（3月のレッスン割に使ってもらう）
```

---

## 1. GOAL

```yaml
sentence: 年度初めのレッスン割が、1日で終わる
today: |
  学生にメールや紙で希望を聞く → Excel に写す → 突き合わせる → 配る
  数日かかる
after: |
  学生がアプリで希望を出す → 先生が地図を見て置く → 確定 → 全員のカレンダーへ
  1日
```

---

## 2. FLOW（5段）

```yaml
1_始める:            # 事務 または 先生
  who: sched_all（事務）／ sched_mine（先生・自分の門下だけ）
  sets: 名前（2027年度 前期）／ 期間 ／ しめきり ／ 対象の門下
  effect: 対象の学生の「きょう」に1行出る

2_希望を出す:        # 学生
  where: きょう → レッスンの 希望を 出す
  input: コマごとに ◎ 行ける ／ △ できれば ／ × 無理
  auto: 時間割の授業のコマは、はじめから ×（変えられない）
  also: だめな日（NG日）を足せる
  rule:
    - 理由は聞かない
    - しめきりまで何度でも直せる
    - 授業名は先生に伝わらない（× とだけ伝わる。裁定その98 と同じ2値の考え）

3_地図を見る:        # 先生・事務
  shows: コマごとに「◎ N人 △ N人」。◎が多いほど濃い
  color: ★1色の濃さだけ。信号色を使わない
  click: そのコマで ◎・△ の学生の名前 → そのまま置ける

4_置く:
  where: 地図から直接 ／ 既存の「日程を組む」
  checks: 先生の重なり ／ 学生の重なり ／ 置けていない方

5_確定して配る:
  confirm: 1度だけたずねる（askShow）
  effect:
    - 学生の「きょう」と「日程」に出る
    - ICS で全員のカレンダーへ（1人1つの住所）
    - 確定後に動かしたら、カレンダーにも自動で反映
  notify: ★お知らせは送らない（裁定その87）。開いたときに見える
```

---

## 3. WHO_SEES_WHAT

```yaml
学生の希望（◎△×）:
  見られる: 担当の先生 ／ 日程の札（sched_all）を持つ方
  見られない: ほかの学生 ／ ほかの先生 ／ 学長（札が無ければ）
  not_health: 希望は健康の記録ではない。学務の層

授業名:
  先生に見えるもの: × だけ
  見えないもの: 何の授業か

まだの方:
  見えるもの: 名前と人数
  do_not: こちらから催促しない（裁定その87・「催促しない」）
  instead: 先生が直接声をかける ／ 時間割から置く（置ける枠）
```

---

## 4. DATA

```yaml
lesson_rounds:
  id / org_id / teacher_id(null=学校全体) / name / period_from / period_to
  / due_on / status('open'|'confirmed') / confirmed_at / created_by

lesson_prefs:
  round_id / user_id / slot_key / level(2=◎ 1=△ 0=×) / updated_at
  unique(round_id, user_id, slot_key)

lesson_ng_dates:
  round_id / user_id / ng_on(date)

RLS:
  lesson_prefs / lesson_ng_dates:
    学生: 自分の行だけ select / insert / update / delete
    先生: 担当の学生の行だけ select（assignments.ended_at is null）
    事務: has_can(org_id,'sched_all') で select
    ★USING と WITH CHECK の両方
  lesson_rounds:
    select: 対象の学生・先生・sched_all
    insert/update: sched_all ／ 先生は自分の門下の round だけ

ics:
  1人1つの住所（推測できない token）
  ★住所を消して作り直せる（漏れたとき）
  中身: 確定したレッスンだけ。場所は教室の場所欄（裁定その89）

auto_x:
  時間割の授業コマ → level=0 を自動で入れる
  ★授業名は lesson_prefs に入れない
```

---

## 5. SCREENS

```yaml
運営（PC・iPad）:
  レッスン割         全体のようす・3つの段（地図／置く／確定）
  希望の地図         コマ×曜日の濃さ。押すと名前 → 置く
  希望がまだの方     名前だけ。催促しない
  レッスン割を確定   置いた数・置けていない方・確定・ICS

個人（スマホ）:
  レッスンの希望     コマ×曜日を押して ◎→△→×。NG日。送る
  entry: きょうに1行（期間中・未送信のときだけ）
```

---

## 6. DO_NOT

```yaml
- 希望の理由を聞く
- まだの方に催促を送る
- 希望を「点数」や「順位」で並べる（◎の多い学生から順に、など）
- 部屋の予約をする（場所は記入だけ。裁定その138 DO_NOT）
- 授業名を先生に見せる
- 自動で全員を配置する（★人が置く。自動の候補を出すのは後の話）
```

---

## 7. VERIFY

```yaml
Q1: 学生が、ほかの学生の希望を1行も引けないこと
Q2: 先生が、担当でない学生の希望を1行も引けないこと
Q3: 時間割の授業コマが × になり、授業名がどこにも出ないこと
Q4: しめきり後も、確定前なら直せること
Q5: 確定すると ICS に出ること
Q6: 確定後に動かすと ICS も変わること
Q7: まだの方へ、何も送られないこと
Q8: 地図に信号色が無いこと（1色の濃さだけ）
Q9: 30人の門下で、希望→確定までを1日で終えられること（パイロットで測る）
```
