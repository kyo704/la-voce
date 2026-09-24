-- 20260923_17 ★退会が止まる11か所を直す（裁定168 ★1 の続き・緊急）
-- 症状: 「この人が消えたら この欄を空にする（SET NULL）」と決めた列が、「空にできない（NOT NULL）」のままだった。
--       空にしようとした瞬間に矛盾し、★退会そのものが失敗する。
--       いま退会できるのは、下のどこにも名前が無い人だけ（連絡を書いた先生・レッスンを作った人・招待を送った人・点を入れた審査員は退会できない）
-- 規約9条「いつでも退会できます」が守れていない状態。★データは1件も動かさない（NOT NULL を外すだけ）
-- 2026-09-23 に本番で確認した11か所（Opus）

alter table public.evaluation_reviews alter column judge_id        drop not null;
alter table public.evaluation_scores  alter column judge_id        drop not null;
alter table public.lessons            alter column created_by      drop not null;
alter table public.monka_read_log     alter column target_monka_id drop not null;
alter table public.monka_read_log     alter column viewer_user_id  drop not null;
alter table public.org_invitations    alter column invited_by      drop not null;
alter table public.org_messages       alter column author_id       drop not null;
alter table public.post_change_log    alter column changed_by      drop not null;
alter table public.post_change_log    alter column target_user_id  drop not null;
alter table public.roster_drafts      alter column imported_by     drop not null;
alter table public.score_log          alter column editor_user_id  drop not null;

-- ★名前が消えても誰の行か分かるように、そのときの名前を写す列（無ければ足す）
alter table public.evaluation_scores  add column if not exists judge_name_at  text;
alter table public.evaluation_reviews add column if not exists judge_name_at  text;
alter table public.org_messages       add column if not exists author_name_at text;
alter table public.score_log          add column if not exists editor_name_at text;
alter table public.post_change_log    add column if not exists target_name_at text;
alter table public.post_change_log    add column if not exists changed_name_at text;
alter table public.monka_read_log     add column if not exists target_name_at text;   -- viewer は name_at が既にある

-- いまある行に、名前を入れておく（人がまだ残っているうちに）
update public.evaluation_scores  t set judge_name_at   = p.display_name from public.profiles p where p.id = t.judge_id        and t.judge_name_at   is null;
update public.evaluation_reviews t set judge_name_at   = p.display_name from public.profiles p where p.id = t.judge_id        and t.judge_name_at   is null;
update public.org_messages       t set author_name_at  = p.display_name from public.profiles p where p.id = t.author_id       and t.author_name_at  is null;
update public.score_log          t set editor_name_at  = p.display_name from public.profiles p where p.id = t.editor_user_id  and t.editor_name_at  is null;
update public.post_change_log    t set target_name_at  = p.display_name from public.profiles p where p.id = t.target_user_id  and t.target_name_at  is null;
update public.post_change_log    t set changed_name_at = p.display_name from public.profiles p where p.id = t.changed_by      and t.changed_name_at is null;
update public.monka_read_log     t set target_name_at  = p.display_name from public.profiles p where p.id = t.target_monka_id and t.target_name_at  is null;

-- これから増える行にも、書くときに名前を写す
create or replace function public.stamp_user_name()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_table_name = 'evaluation_scores' or tg_table_name = 'evaluation_reviews' then
    if new.judge_name_at is null and new.judge_id is not null then
      select p.display_name into new.judge_name_at from public.profiles p where p.id = new.judge_id; end if;
  elsif tg_table_name = 'org_messages' then
    if new.author_name_at is null and new.author_id is not null then
      select p.display_name into new.author_name_at from public.profiles p where p.id = new.author_id; end if;
  elsif tg_table_name = 'score_log' then
    if new.editor_name_at is null and new.editor_user_id is not null then
      select p.display_name into new.editor_name_at from public.profiles p where p.id = new.editor_user_id; end if;
  elsif tg_table_name = 'post_change_log' then
    if new.target_name_at is null and new.target_user_id is not null then
      select p.display_name into new.target_name_at from public.profiles p where p.id = new.target_user_id; end if;
    if new.changed_name_at is null and new.changed_by is not null then
      select p.display_name into new.changed_name_at from public.profiles p where p.id = new.changed_by; end if;
  elsif tg_table_name = 'monka_read_log' then
    if new.target_name_at is null and new.target_monka_id is not null then
      select p.display_name into new.target_name_at from public.profiles p where p.id = new.target_monka_id; end if;
  end if;
  return new;
end $$;
revoke all on function public.stamp_user_name() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['evaluation_scores','evaluation_reviews','org_messages','score_log','post_change_log','monka_read_log'] loop
    execute format('drop trigger if exists %I_stamp_user on public.%I', t, t);
    execute format('create trigger %I_stamp_user before insert on public.%I for each row execute function public.stamp_user_name()', t, t);
  end loop;
end $$;

-- 確かめ（試しの環境で・実在の試しの利用者で）
-- ① 連絡を書いた先生／レッスンを作った人／招待を送った人／点を入れた審査員／門下を開いた運営 を作る
-- ② その人が退会する → ★最後まで通る
-- ③ 記録の行が残り、id は null・名前（*_name_at）にそのときの名前が入っている
-- ④ 契約者だけは いまのまま（退会できない）。画面に「先に契約者を移してください」が出ること
