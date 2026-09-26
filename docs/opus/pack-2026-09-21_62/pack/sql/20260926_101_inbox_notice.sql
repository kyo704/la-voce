-- 20260926_101 受信箱の 知らせ（★裁定209 D）
-- ★★1日1通・★本文なし
-- ★★「何件 届いています」も 出しません
--   ★理由: ★数を 出すと ★★多い日・少ない日が 気に なります
--         ★★うちは ★数を 強調しません
-- ★100 のあと

alter table public.portfolios add column if not exists inbox_notice boolean not null default true;
alter table public.portfolios add column if not exists inbox_noticed_on date;
-- ★★既定は on（★届いた ことは 知らせます）
--   ★理由: ★知らないまま 90日で 消えるのは ★★不親切 です
--   ★止めるのは ★ご本人が 選べます

-- ★★きょう 知らせる 人（★1日1通）
create or replace function public.inbox_notice_due()
returns table(owner_user_id uuid, to_email text)
language sql stable security definer set search_path to 'public' as $$
  select p.user_id, coalesce(p.contact_email, u.email)
    from public.portfolios p
    join auth.users u on u.id = p.user_id
   where p.inbox_notice
     and (p.inbox_noticed_on is null
          or p.inbox_noticed_on < (now() at time zone 'Asia/Tokyo')::date)
     and exists (select 1 from public.page_inquiries q
                  where q.owner_user_id = p.user_id
                    and q.read_at is null and not q.spam
                    and q.created_at > coalesce(p.inbox_noticed_on, 'epoch')::timestamptz);
$$;
revoke all on function public.inbox_notice_due() from public, anon, authenticated;
-- ★★誰にも 渡しません（★サーバの 仕事 です）

create or replace function public.mark_inbox_noticed(p_user uuid)
returns void language sql security definer set search_path to 'public' as $$
  update public.portfolios set inbox_noticed_on = (now() at time zone 'Asia/Tokyo')::date
   where user_id = p_user;
$$;
revoke all on function public.mark_inbox_noticed(uuid) from public, anon, authenticated;

-- ★★送る 文（★画面・メールの 決まり）:
--   件名「Woolsong ── お問い合わせが 届いています」
--   本文「あなたの ページに、お問い合わせが 届いています。
--        アプリの『届いたもの』から ご覧ください。
--        ★この お知らせは 1日に 1通までです。
--        ★止めるときは 設定から。」
--   ★★書かない もの:
--     ✕ ★件数（「3件 届いています」）
--     ✕ ★送り主の 名前・本文（★メールに 中身を 入れない）
--     ✕ ★「早めに ご返信を」（★催促）
--   ★理由: ★★メールは ★人の 手元に 残ります。★中身を 流しません

-- 確かめ（試しの環境で）
-- ★未読が あれば 1回 出る／★同じ日に 2回目は 出ない
-- ★★読んだら 出ない／★迷惑は 数えない
-- ★止めていれば 出ない
