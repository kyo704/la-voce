# RULING 165 — 「審査員として組まれている」を表す表（束3 の前提）

```yaml
ruling: 165
date: 2026-09-21
version: design-v21
how: Opus が本番の構造を読み取りで確かめた
finding: ★本番に「審査員として組まれている」を表す表・列が無い
  evaluation_items（項目）・evaluation_scores（点）・evaluation_reviews（講評）・evaluation_judge_done（終えた印）はある
  org_events に審査員の列は無い。judge の名の付く表は judge_done だけ
  → 見本（行事 g.ju・採点の画面「＋ 審査員を 足す」）にある「審査員を組む」が、台帳に無い
  → 裁定163・164 W3 の穴は、条件を書くための表がそもそも無いことが原因
```

## 1. 決定：新しい表 `evaluation_judges`

```sql
create table public.evaluation_judges (
  org_id    uuid not null references public.organizations(id) on delete cascade,
  event_id  uuid not null references public.org_events(id)    on delete cascade,
  judge_id  uuid not null references auth.users(id)           on delete cascade,
  added_by  uuid references auth.users(id) on delete set null,
  added_at  timestamptz not null default now(),
  primary key (event_id, judge_id)
);
alter table public.evaluation_judges enable row level security;
revoke all on public.evaluation_judges from anon, authenticated;
grant select, insert, delete on public.evaluation_judges to authenticated;   -- update は無し（組み直しは消して足す）

-- 読む: 採点を扱う人（saiten）と、組まれた本人
create policy evaluation_judges_select on public.evaluation_judges for select to authenticated
  using (has_can(org_id, 'saiten') or judge_id = auth.uid());

-- 組む・外す: saiten を持つ人。組む相手はその学校の人、行事はその学校の行事
create policy evaluation_judges_insert on public.evaluation_judges for insert to authenticated
  with check (
    has_can(org_id, 'saiten')
    and added_by = auth.uid()
    and exists (select 1 from public.memberships m where m.org_id = evaluation_judges.org_id and m.user_id = evaluation_judges.judge_id)
    and exists (select 1 from public.org_events e where e.id = evaluation_judges.event_id and e.org_id = evaluation_judges.org_id)
  );
create policy evaluation_judges_delete on public.evaluation_judges for delete to authenticated
  using (has_can(org_id, 'saiten'));
```

## 2. 束3 で使う条件（3つの表で同じもの）

```sql
-- 共通の条件（「この回の審査員として組まれている自分」）
exists (select 1 from public.evaluation_judges j
        where j.event_id = <表>.event_id and j.org_id = <表>.org_id and j.judge_id = auth.uid())

-- evaluation_scores_write（ALL）
using      (judge_id = auth.uid())
with check (judge_id = auth.uid()
            and <共通の条件>
            and exists (select 1 from public.evaluation_items i where i.id = evaluation_scores.item_id and i.event_id = evaluation_scores.event_id)
            and exists (select 1 from public.enrollments s where s.org_id = evaluation_scores.org_id and s.student_id = evaluation_scores.student_id))

-- evaluation_reviews_write（ALL）
using      (judge_id = auth.uid())
with check (judge_id = auth.uid() and <共通の条件>
            and exists (select 1 from public.enrollments s where s.org_id = evaluation_reviews.org_id and s.student_id = evaluation_reviews.student_id))

-- evaluation_judge_done_own（ALL）
using      (judge_id = auth.uid())
with check (judge_id = auth.uid() and <共通の条件>)
-- ★主キー (event_id, judge_id) は本番に既にある（裁定164 §4 の訂正）。足さない
```

## 3. あわせて塞ぐもの（見つけた）

```yaml
確定の列: authenticated に evaluation_scores・reviews の INSERT(confirmed_at)・UPDATE(confirmed_at) がある
  → 審査員が insert のときに confirmed_at を入れれば、確定の手順（confirm_event_scores）を飛ばせる
  直し: revoke insert (confirmed_at), update (confirmed_at) on evaluation_scores, evaluation_reviews from authenticated;
    confirmed_at を入れるのは confirm_event_scores（security definer）だけ
```

## 4. 画面（見本は既にある）

```yaml
採点の画面の「＋ 審査員を 足す」→ evaluation_judges に insert（saiten を持つ人だけ押せる）
「あなたが 審査員の 試験」の帯 → evaluation_judges の自分の行から
★本番に組まれた行が0のうちは、束3 を当てると誰も点を入れられなくなる → 採点はまだ0行なので影響なし。画面の「審査員を 足す」を先に作る
```

## 5. VERIFY（実在の試しの利用者で）

```yaml
- saiten を持つ事務が、その学校の先生を審査員に組む → 通る／別の学校の人を組む → 拒否
- 組まれた先生が点を入れる → 通る／組まれていない担当中の先生 → 拒否
- 組まれていない先生が judge_done を入れる → 拒否 → その回の点が0行
- 同じ審査員の judge_done の2行目 → 主キーで拒否（既にある）
- 審査員が confirmed_at を入れて insert → 権限エラー
- 他の学校の event_id・item_id・student_id を混ぜた insert → 拒否
```
