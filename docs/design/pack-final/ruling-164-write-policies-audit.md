# RULING 164 — 書き込みのポリシーの監査（org_id を持つ表すべて）

```yaml
ruling: 164
date: 2026-09-21
version: design-v21
how: Opus が本番を読み取りだけで。org_id を持つ表の INSERT・UPDATE・DELETE・ALL のポリシー全部を、
  ①ポリシーの条件 ②authenticated の列ごとの権限 ③BEFORE の引き金 の3つを重ねて確かめた（裁定162 §8 の教訓）
いま実害: 3件とも本番の行は少ない（applications 0行・org_messages 4行・evaluation_judge_done 0行）。学校の販売の前に塞ぐ
```

## 1. 見つけたもの（3件・すべて3つの確認を重ねて本物）

```yaml
W1_応募者が自分で「選ばれた」にできる（applications）:
  ポリシー: applications_update_own（UPDATE）── USING/WITH CHECK が (auth.uid() = applicant_user_id) だけ
  権限: authenticated に UPDATE(status) がある。status の CHECK は sent／chosen／withdrawn
  引き金: 無い
  問題: 応募した本人が status を 'chosen' に書き換えられる。get_match は status='chosen' を見て成立を判断する
    → 募集した人が選んでいないのに「成立」になり、成立後にだけ見える情報（さがすの成立後の画面）が開く
  直し: 応募者が変えられる status は 'withdrawn'（取り下げ）だけにする
    with check ((auth.uid() = applicant_user_id) and status in ('sent','withdrawn'))
    'chosen' にするのは choose_applicant（security definer）だけ
  確かめ: 試しの応募者が自分の応募を chosen に update → 拒否／withdrawn → 通る／募集した人が choose_applicant → chosen

W2_送った連絡を、あとから別の学校・別の宛先・別の日付に書き換えられる（org_messages）:
  ポリシー: org_messages_withdraw（UPDATE）── USING/WITH CHECK が (auth.uid() = author_id) だけ
  権限: authenticated に UPDATE(author_id, body, created_at, id, org_id, target_*, teacher_id, title, withdrawn_at) ── ほぼ全列
  引き金: 無い
  問題:
    - org_id を書き換えると、insert のときの確かめ（org_messages_insert：その学校の人か・その門下の先生か）を通らずに、
      自分の属さない学校・門下へ連絡を移せる
    - 送ったあとの本文・宛先・日付（created_at）を黙って書き換えられる（「いつ・何を送ったか」が信用できなくなる）
  名前のとおりの用途: 取り下げ（withdrawn_at を入れる）だけ
  直し:
    revoke update on org_messages from authenticated;
    grant update (withdrawn_at) on org_messages to authenticated;
    ポリシーの with check に (withdrawn_at is not null) を足す（取り下げの取り消しをさせない）
  確かめ: 作者が org_id・body・created_at を update → 権限エラー／withdrawn_at を入れる → 通る

W3_審査員でない先生が「審査を終えた」印を付けて、その回の点を全部見られる（evaluation_judge_done）:
  ポリシー: evaluation_judge_done_own（ALL）── (judge_id = auth.uid()) だけ
  権限: authenticated に INSERT(done_at, event_id, judge_id, org_id)
  引き金: 無い。一意の制約も無い
  問題: evaluation_scores・evaluation_reviews の select は「その回の judge_done に自分がいて、その学校で担当中の先生」なら全部見える。
    担当中の先生なら、審査員でなくても judge_done を自分で1行入れるだけで、その回の全員の点と講評を読める
    → 裁定50「審査員相互は既定オン・締切前は不可」「審査員でない人は見ない」を台帳で迂回できる
  直し: judge_done を入れられるのは、その回の審査員として組まれている人だけ（組み合わせの表で確かめる。裁定163 と同じ表を使う）。
    (event_id, judge_id) に一意の制約
  確かめ: 担当中だが審査員でない先生が judge_done を insert → 拒否 → その回の点が0行

関係: 裁定163（evaluation_scores・reviews の書き込みに割り当ての確かめが無い）と同じ原因。「審査員として組まれている」を表す表・列を
  1つ決め、scores・reviews・judge_done の3つの with check で同じ条件を使う
```

## 2. 確かめて問題が無かったもの

```yaml
- lessons: 学生が update できるのは student_notice・student_notice_at だけ（列の権限で絞られている）
- org_message_drafts: 下書きは作者だけ。送るのは send_message_draft（中で権限を確かめる）
- memberships: role_management の枝は can_grant_post が無いが、post_id は列の権限で update できない（安全）
- postings・applications の insert・org_events・org_places・org_periods・roster_drafts・lesson_presets・org_divisions・
  org_invitations・org_billing・enrollments・assignments・my_periods: has_can か所属で絞られている
- org_message_reads（既読）: 本人の名で何にでも既読を付けられるが、害は小さい（既読の数が狂う程度）。次に触るときに所属の確かめを足す
- 重なり: org_events に同じ条件の write のポリシーが2本（write_admin と needs_can_gyoji）。害は無い。片方を消して整理してよい
```

## 3. 型（繰り返さないために）

```yaml
- 「本人の行なら何でも update できる」ポリシー（auth.uid() = 作者）と、列の全部への UPDATE 権限の組み合わせが、3件とも共通
- 直し方の型: ①列の UPDATE 権限を、その操作に要る列だけに絞る ②with check に「変えてよい値」を書く ③状態を進める操作（選ぶ・確定）は security definer の関数だけ
- tools/ledger_inventory に「本人条件だけの UPDATE ポリシー × 全列の UPDATE 権限」を探す項目を足す（次の版）
```
