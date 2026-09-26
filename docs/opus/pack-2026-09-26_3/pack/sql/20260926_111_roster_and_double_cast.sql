-- 20260926_111 ★名簿の 分けかた と ★1役ふたり（ダブルキャスト）
--
-- ★★坂本さんが お決めに なったこと（2026-09-26）
--   ① ★基本的に アカウントを 作って 入って もらう
--   ② ★払うのは 主催者。★該当する 学生が 入っていても 学校の ご請求は 変わらない
--   ③ ★学校が 公演機能を 使うときは ★学生の 名簿からも ★先生の 名簿からも 入れられる
--   ④ ★公演が 終わった あとも 名簿は 残す
--   ⑤ ★学校を 辞めた人は ★先生の 判断で 消せる
--
-- ★★いま すでに できて いること（★本番で 確かめました）
--   ★memberships（学校の 名簿）── user_id 必須。★見えるのは 本人と org の 権限持ち
--   ★koen_members（公演の 名簿）── user_id は null 可。★見えるのは その 公演の 人だけ
--   ★entries（体調の 記録）── ★★auth.uid() = user_id だけ。
--     ★★学校からも 公演からも 見えません。★抜け道は ありません
--   ★koen.org_id は null 可 ── ★学校に 属さない 公演も 作れます
--   ★koen_members.name_at ── ★★そのときの 呼び名。★学校で 変わっても 公演の 紙は 変わりません
--
-- ★★この 移行で 足す もの

-- ═══ ① アカウントを 作って 入って もらう（★①）═══
--   ★名簿に 載せるだけなら user_id なしでも できますが、
--   ★★稽古の 呼び出しが 届かないので ★『まだ 入って いない』と 分かるように します
alter table public.koen_members
  add column if not exists needs_account boolean not null default false;
comment on column public.koen_members.needs_account is
  '★true＝名前だけ 載せた（★アカウント まだ）。★稽古の 呼び出しは 届きません。'
  '★基本は アカウントを 作って 入って いただきます（2026-09-26）';

-- ═══ ② どちらの 名簿から 来たか（★③・⑤の ため）═══
alter table public.koen_members
  add column if not exists from_roster text
  check (from_roster is null or from_roster in ('student','teacher','outside'));
comment on column public.koen_members.from_roster is
  '★student＝学校の 学生の 名簿から ／ teacher＝先生の 名簿から ／ outside＝学校の 外から。'
  '★★写した ときの 記録です。★★学校の 名簿と つながって いる わけでは ありません';

-- ═══ ③ 公演が 終わっても 名簿は 残す（★④）═══
--   ★★retention（90日で 消す）の 対象に しません。
--   ★koen_members は もともと 掃除の 対象では ありません（★確かめました）。
--   ★ここでは『残す』ことを はっきり 書いて おきます
comment on table public.koen_members is
  '★公演の 名簿。★★公演が 終わっても 残します（2026-09-26 坂本さんの お決め）。'
  '★あとで 見返せる ように。★学校の 名簿（memberships）とは 別の ものです';

-- ═══ ④ 学校を 辞めた人を 先生の 判断で 消す（★⑤）═══
--   ★memberships_delete_admin は すでに has_can(org_id,'post') で 消せます。
--   ★★消しても ★koen_members は 残ります（★name_at に 名前が 写って いるので）。
--   ★ここでは『消しても 公演の 紙は 残る』ことを 確かめる 見張りを 置きます
create or replace function public.koen_member_keeps_name()
returns trigger language plpgsql as $$
begin
  -- ★★人が 抜けても 名前は 残す（★name_at は そのときの 呼び名）
  if new.user_id is null and coalesce(btrim(new.name_at),'') = '' then
    raise exception 'NAME_REQUIRED: 名前の ない 行は 作れません';
  end if;
  return new;
end $$;
drop trigger if exists koen_members_keep_name on public.koen_members;
create trigger koen_members_keep_name
  before insert or update on public.koen_members
  for each row execute function public.koen_member_keeps_name();

-- ═══ ⑤ 1役ふたり（ダブルキャスト）═══
--   ★★坂本さんの ご指示 ──
--     『1役ふたりに なることが あるので、香盤表で 誰の 何の役が どこで 登場するか、
--       クリック一つで 選べるように』
--   ★いまの 形: koen_cells(row_id, slot_id, member_id, people)
--     ★★member_id が 1つしか 入りません。★A・B を 分けられません
create table if not exists public.koen_slot_cast (
  slot_id   uuid not null references public.koen_slots(id)   on delete cascade,
  member_id uuid not null references public.koen_members(id) on delete cascade,
  ab        text not null default 'A' check (ab in ('A','B','C','D')),
  note      text,
  primary key (slot_id, member_id)
);
comment on table public.koen_slot_cast is
  '★1つの 役に ★ふたり以上（A・B…）。★★member_id で 人に つなぎます。'
  '★★同じ人が ★いくつもの 役を 兼ねる ことも できます（★兼ね役）';
create index if not exists koen_slot_cast_member_idx on public.koen_slot_cast(member_id);
alter table public.koen_slot_cast enable row level security;
revoke all on public.koen_slot_cast from anon, authenticated;
grant select, insert, update, delete on public.koen_slot_cast to authenticated;
drop policy if exists koen_slot_cast_select on public.koen_slot_cast;
create policy koen_slot_cast_select on public.koen_slot_cast for select
  using (exists (select 1 from public.koen_slots s
                  where s.id = slot_id and public.koen_can_see(s.koen_id)));
drop policy if exists koen_slot_cast_write on public.koen_slot_cast;
create policy koen_slot_cast_write on public.koen_slot_cast for all
  using (exists (select 1 from public.koen_slots s
                  where s.id = slot_id and public.koen_can_manage(s.koen_id)))
  with check (exists (select 1 from public.koen_slots s
                  where s.id = slot_id and public.koen_can_manage(s.koen_id)));

-- ═══ ⑥ ★その人が どこに 出るか を 1回で 引く ═══
--   ★★これが『クリック一つで 選べる』の 中身です
create or replace function public.koen_member_calls(p_member uuid)
returns table(row_id uuid, group_label text, row_label text, minutes integer,
              slot_label text, ab text, sort_order integer)
language sql stable security definer set search_path to 'public' as $$
  select r.id, r.group_label, r.label, r.minutes, s.label, c.ab, r.sort_order
    from public.koen_slot_cast c
    join public.koen_slots s on s.id = c.slot_id
    join public.koen_cells  x on x.slot_id = s.id
    join public.koen_rows   r on r.id = x.row_id
   where c.member_id = p_member
     and public.koen_can_see(s.koen_id)          -- ★見える 人だけ
   order by r.sort_order, s.sort_order;
$$;
revoke all on function public.koen_member_calls(uuid) from public, anon;
grant execute on function public.koen_member_calls(uuid) to authenticated;
comment on function public.koen_member_calls(uuid) is
  '★その人が 出る 行（場面）を すべて 返します。★★兼ね役も まとめて 出ます。'
  '★香盤表で 人の 名前を 押したときに 使います';

-- ★★確かめ方
-- ★① 名前の ない 行は 作れない
--    insert into koen_members(koen_id, name_at, part) values (…, '', 'cast');
--    → ★NAME_REQUIRED
-- ★② 1つの 役に ふたり
--    insert into koen_slot_cast(slot_id, member_id, ab) values (s, m1, 'A'), (s, m2, 'B');
--    → ★2行 入る
-- ★③ 同じ人が 2役
--    insert into koen_slot_cast values (s1, m1, 'A'), (s2, m1, 'A');
--    → ★2行 入る（★兼ね役）
-- ★④ その人の 出番
--    select * from koen_member_calls(m1);
--    → ★出る 行が 並ぶ。★★2役 兼ねて いれば 両方 出る
-- ★⑤ ★学校の 名簿から 消しても 公演の 紙は 残る
--    delete from memberships where user_id = u;
--    select name_at from koen_members where user_id = u;  → ★名前が 残って いる
