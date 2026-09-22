-- ★公演の 試しの 行（★試しの 台帳だけ・2026-09-23）
--   ★★local2 が 主催・運営（can_manage）。★子どもは local2 が 保護者 です。

insert into public.koen (id, org_id, owner_user_id, title, kind, venue, opens_on, status, tier_people)
values ('66666666-6666-4666-8666-666666666661',
        '11111111-1111-4111-8111-111111111111',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f',
        '★試しの 公演', 'opera', '★試しの ホール', current_date + 30, 'open', 15)
on conflict (id) do update set status = 'open';

insert into public.koen_members (id, koen_id, user_id, name_at, part, can_manage, joined_at)
values ('66666666-6666-4666-8666-666666666671',
        '66666666-6666-4666-8666-666666666661',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', '★くらべ用 たろう', 'staff', true, now())
on conflict (id) do update set can_manage = true, left_at = null;

insert into public.koen_kids (id, koen_id, guardian_user_id, nickname)
values ('66666666-6666-4666-8666-666666666681',
        '66666666-6666-4666-8666-666666666661',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', '★ためしの子')
on conflict (id) do update set left_at = null;

-- ★きょうの 集合（★`todays_call` の 枝の ため）
insert into public.koen_sessions (id, koen_id, kind, starts_at)
values ('66666666-6666-4666-8666-666666666691',
        '66666666-6666-4666-8666-666666666661', 'call',
        ((now() at time zone 'Asia/Tokyo')::date + time '10:00') at time zone 'Asia/Tokyo')
on conflict (id) do update set starts_at = excluded.starts_at, canceled_at = null;
