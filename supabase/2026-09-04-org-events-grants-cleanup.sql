-- ============================================================================
-- 予定が取り下げられなかった件の直しと、権限の取りこぼし（2026-09-04）
--
--   ★本番の権限一覧で分かったこと
--     org_events の列ごとの UPDATE（authenticated）：
--       end_time, event_date, kind, start_time, target_group, title, withdrawn_at
--     ★入っていない：updated_at, previous_date, org_id, id, created_*
--
--   ★画面は、入っていない列を書こうとしていました。
--     取り下げ   … withdrawn_at ＋ ★updated_at
--     日付の変更 … event_date ＋ ★previous_date ＋ ★updated_at
--     ★1つでも権限の無い列が混ざると、文ごと 42501 で落ちます。
--     ★だから取り下げも日付の変更も、どちらも通りません。
--
--   ★リポジトリと本番が食い違っていました
--     migration_identity_columns_immutable.sql:57 は
--       grant update (event_date, previous_date, withdrawn_at, updated_at)
--     と書いてあります。★本番の列は違います。
--     ★本番に手で当てた分が、リポジトリに写されていません。
--     ★このファイルが、これからの写しです。
--
--   ★何度実行しても、同じ結果になります。
--   ★service_role からは、何も剥がしません。運営が手で直せなくなるためです。
--   ★予定の中身（org_events の行）には、一切触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録（★あとで見比べられるように、先に控えます）
-- ---------------------------------------------------------------------------
select table_name as "表", grantee as "相手", privilege_type as "権限",
       coalesce(column_name, '（表ぜんぶ）') as "列"
  from information_schema.table_privileges
 where table_schema = 'public'
   and table_name in ('org_events','teacher_student_links','assignments','lessons')
   and grantee in ('anon','authenticated')
union all
select table_name, grantee, privilege_type, column_name
  from information_schema.column_privileges
 where table_schema = 'public'
   and table_name in ('org_events','teacher_student_links','assignments','lessons')
   and grantee in ('anon','authenticated')
 order by 1, 2, 3, 4;

-- ---------------------------------------------------------------------------
-- ① 帳簿の列は、サーバが入れます
--
--   ★updated_at と previous_date は、画面に書かせません。
--     ・updated_at    … いつ変わったかの記録です。書く側に決めさせません。
--     ・previous_date … ★元の日付です。「どこから動いたか」は
--                       ★古い行に書いてあります。渡してもらう必要がありません。
--   ★列の権限は、UPDATE 文が名指しした列だけを見ます。
--     ★BEFORE トリガーが入れる列は、権限の検査を通りません。
--     だから、権限を与えないまま、サーバ側で入れられます。
-- ---------------------------------------------------------------------------

create or replace function public.org_events_set_bookkeeping()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- ★日付が動いたときだけ、元の日付を控えます。
  if new.event_date is distinct from old.event_date then
    new.previous_date := old.event_date;
  else
    -- ★動いていないときは、前の値をそのまま残します。
    --   ★書き換えさせません。控えは、控えたときのままであるべきです。
    new.previous_date := old.previous_date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_org_events_bookkeeping on public.org_events;
create trigger trg_org_events_bookkeeping
  before update on public.org_events
  for each row execute function public.org_events_set_bookkeeping();

-- ---------------------------------------------------------------------------
-- ② anon から、4つの表の権限をすべて剥がします
--
--   ★2026-09-04 の作業は authenticated だけを見ていて、
--     ★anon を1行も書いていませんでした。取りこぼしです。
--   ★anon は、ログインしていない人です。この4つの表に用がありません。
-- ---------------------------------------------------------------------------
revoke all on public.org_events            from anon;
revoke all on public.teacher_student_links from anon;
revoke all on public.assignments           from anon;
revoke all on public.lessons               from anon;

-- ---------------------------------------------------------------------------
-- ③ authenticated から、要らない権限を剥がします
--
--   ★TRUNCATE … ★RLS が効きません。1文で表が空になります。
--                 ★これがいちばん重い取りこぼしです。
--   ★TRIGGER  … その表にトリガーを作れます。
--   ★REFERENCES … その表を指す外部キーを作れます。
--                  ★行があるかどうかを、外から確かめる道具になります。
--   ★どれもアプリは使いません。
-- ---------------------------------------------------------------------------
revoke truncate, trigger, references on public.org_events            from authenticated;
revoke truncate, trigger, references on public.teacher_student_links from authenticated;
revoke truncate, trigger, references on public.assignments           from authenticated;
revoke truncate, trigger, references on public.lessons               from authenticated;

-- ---------------------------------------------------------------------------
-- ④ DELETE
--
--   ★org_events … 剥がします。取り下げを UPDATE にした理由は
--                  「行を消さないため」でした。消す道が別に開いていては、
--                  ★その決めごとが守られていません。
--   ★teacher_student_links … 剥がします。解除は status を revoked に
--                  するだけで、行は残す設計です（同じ理由）。
--   ★assignments … 剥がします。担当を外すのは ended_at を入れるだけです。
--   ★lessons … ★剥がしません。画面から消しています
--               （VocalTracker.jsx:9836 handleDeleteLesson）。
--               ★剥がすと、レッスンを消せなくなります。
-- ---------------------------------------------------------------------------
revoke delete on public.org_events            from authenticated;
revoke delete on public.teacher_student_links from authenticated;
revoke delete on public.assignments           from authenticated;
-- ★lessons の delete は、わざと残します。上の理由です。

-- ---------------------------------------------------------------------------
-- ⑤ org_events の列ごとの UPDATE を、あるべき形に言い直します
--
--   ★本番にあって、画面が使っていない列（end_time, start_time,
--     kind, target_group, title）は、★そのまま残します。
--     ★いま消すと、この直しが効いたのかどうかが分からなくなります。
--     ★掃除は、別の日に、別の判断で。
--   ★updated_at と previous_date は★足しません。①のトリガーが入れます。
-- ---------------------------------------------------------------------------
-- （②③④のあとに、列ごとの grant が残っていることを確かめます）
select column_name as "書ける列（authenticated）"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'org_events'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
 order by 1;
-- ★event_date と withdrawn_at が並んでいること。
-- ★updated_at と previous_date は★無いこと（トリガーが入れるため）。

-- ---------------------------------------------------------------------------
-- ⑥ 確かめ
-- ---------------------------------------------------------------------------

-- ⑥-1 ★anon に、4つの表の権限が1つも残っていないこと（0行）
select table_name as "★anon にまだ残っている権限", privilege_type
  from information_schema.table_privileges
 where table_schema = 'public' and grantee = 'anon'
   and table_name in ('org_events','teacher_student_links','assignments','lessons')
union all
select table_name, privilege_type
  from information_schema.column_privileges
 where table_schema = 'public' and grantee = 'anon'
   and table_name in ('org_events','teacher_student_links','assignments','lessons');

-- ⑥-2 ★TRUNCATE が1つも残っていないこと（0行）
select table_name as "★TRUNCATE がまだ残っている表", grantee
  from information_schema.table_privileges
 where table_schema = 'public' and privilege_type = 'TRUNCATE'
   and grantee in ('anon','authenticated')
   and table_name in ('org_events','teacher_student_links','assignments','lessons');

-- ⑥-3 DELETE は lessons だけであること（1行だけ返ること）
select table_name as "DELETE が残っている表", grantee
  from information_schema.table_privileges
 where table_schema = 'public' and privilege_type = 'DELETE'
   and grantee in ('anon','authenticated')
   and table_name in ('org_events','teacher_student_links','assignments','lessons');

-- ⑥-4 トリガーが付いていること（1行）
select tgname as "トリガー名"
  from pg_trigger
 where tgrelid = 'public.org_events'::regclass and not tgisinternal;

-- ============================================================================
-- ★このあとにやること（★このSQLだけでは直りません）
--
--   ★順番を守ってください。
--     1) このSQLを当てる（トリガーが updated_at を入れるようになります）
--     2) そのあとで、画面から updated_at と previous_date を外す
--
--   ★逆にすると、1)と2)のあいだ、updated_at が更新されません。
--   ★この順なら、あいだの時間も正しく動きます。
--     （画面はまだ 42501 で落ちますが、それは★いまと同じ状態です。
--       ★悪くはなりません。）
--
--   ★2026-09-04 追記：assert_* は、本番にあります。
--     trg_*_identity_immutable の4つとも、有効であることを確認ずみです。
--     ★このファイルに「まだ無い」と書いていたのは、私の記録が古いままでした。
--       (e)③ で無かったのは、その時点の話です。★そのあと当たっていました。
--     ★確認の結果には、いつ確認したかが付いています。
--       ★それを落とすと、古い結果が「いまの事実」として歩き出します。
-- ============================================================================
