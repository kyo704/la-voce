-- ★sql/10・11 を 確かめる ための 試しの 行（★試しの 台帳だけ・2026-09-23）
--   ★★締切は きょうより 後 に します（★締切の 試験を 別に します）。

insert into public.lesson_rounds (id, org_id, teacher_id, name, period_from, period_to, due_on, status, created_by)
values ('44444444-4444-4444-8444-444444444441',
        '11111111-1111-4111-8111-111111111111', null,
        '★試しの 回（開いて います）', current_date, current_date + 60, current_date + 7, 'open',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f')
on conflict (id) do update set due_on = excluded.due_on, status = 'open';

-- ★締切が 過ぎた 回（★書けない ことを 確かめる ため）
insert into public.lesson_rounds (id, org_id, teacher_id, name, period_from, period_to, due_on, status, created_by)
values ('44444444-4444-4444-8444-444444444442',
        '11111111-1111-4111-8111-111111111111', null,
        '★試しの 回（締切が 過ぎて います）', current_date - 60, current_date, current_date - 1, 'open',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f')
on conflict (id) do update set due_on = current_date - 1, status = 'open';

-- ★ポートフォリオ（★問い合わせの 試験の ため）
--   ★★主キーは `user_id` です。★slug の 列の 名は `public_slug` です。
--     ★★2026-09-23、★`id` と `slug` で 書いて 落ちました。★台帳で 確かめました。
insert into public.portfolios (user_id, public_slug, visibility)
values ('eafa63c2-4592-4996-8c7c-18ecbec5a34f', 'tameshi-taro', 'public')
on conflict (user_id) do update set public_slug = excluded.public_slug, visibility = 'public';

-- ★公開して いない ほう（★理由を 返さない ことを 確かめる ため）
insert into public.portfolios (user_id, public_slug, visibility)
values ('6fdc5121-adab-4962-a202-6d7c340ea994', 'himitsu-hanako', 'self')
on conflict (user_id) do update set public_slug = excluded.public_slug, visibility = 'self';
