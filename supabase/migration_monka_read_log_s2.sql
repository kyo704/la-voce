-- ============================================================================
-- S2 ── 門下を開いた記録と、開く道（裁定159 §6・2026-09-21）
--
--   いま
--     monka_read_log はあります。決まりも2つ（insert / select）あります。
--     ところが書く処理がどこにもありません。本番は 0行です。
--     S1 で、monka_read から門下を読む道は閉じました。
--
--   ここで作るもの
--     ① 記録の列を足す（誰が・そのときの役職・どの門下・いつ・理由）
--     ② 開く道（RPC）。台帳が先に1行書き、書けたときだけ中身を返します
--        書けなければ中身を返しません（fail closed）
--
--   画面からの insert に任せません。
--     画面が呼ばなければ記録が残りません。それが今回の一件です。
--
--   update・delete の決まりを作りません（*_log の決まり）。
--
--   何度流しても同じです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列を足す
--     ★役職は「そのときの名前」を写します。post_id は後から変わります。
--     ★人が消えても記録は残します（連鎖削除にしません）。消せない記録です。
-- ---------------------------------------------------------------------------
alter table public.monka_read_log
  add column if not exists reason_kind text,
  add column if not exists reason_note text,
  add column if not exists post_id uuid,
  add column if not exists post_name_at text,
  add column if not exists name_at text;

-- ★理由は4つだけ。参照表を作りません（裁定159 Q1）。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_kind_check;
alter table public.monka_read_log
  add constraint monka_read_log_reason_kind_check check (
    reason_kind in ('jiko', 'honnin', 'horei', 'sonohoka'));

-- ★「そのほか」のときだけ短文が要ります。空では開けません。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_note_check;
alter table public.monka_read_log
  add constraint monka_read_log_reason_note_check check (
    (reason_kind <> 'sonohoka')
    or (reason_note is not null and btrim(reason_note) <> ''
        and char_length(reason_note) <= 100));

comment on column public.monka_read_log.reason_kind is
  'なぜ開いたか。jiko＝事故・苦情の調べ／honnin＝ご本人からの求め／horei＝法令に基づく求め／sonohoka＝その他（短文必須）。裁定159 Q2。';
comment on column public.monka_read_log.post_name_at is
  'そのときの役職名。post_id は後から変わるため、名前を写して残す。裁定159 Q2。';

-- ★人が消えても記録を残します（連鎖削除にしません）。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_post_id_fkey;
alter table public.monka_read_log
  add constraint monka_read_log_post_id_fkey
  foreign key (post_id) references public.org_posts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- ② 開く道
--     ★先に書いてから返します。書けなければ返しません。
--     ★理由が無ければ、書く前に止まります。
--     ★一覧（名前だけ）はここを通りません。中身を返すときだけです。
-- ---------------------------------------------------------------------------
drop function if exists public.open_monka_thread(uuid, uuid, text, text);

create function public.open_monka_thread(
  p_org_id uuid,
  p_teacher_id uuid,
  p_reason_kind text,
  p_reason_note text default null
)
returns table (
  id uuid, org_id uuid, teacher_id uuid, author_id uuid,
  title text, body text, created_at timestamptz, withdrawn_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_post_id uuid;
  v_post_name text;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★できことを見ます。役割の名では見ません。
  if not public.has_can(p_org_id, 'monka_read') then
    raise exception 'NO_MONKA_READ: この役職では、門下のやりとりを開けません。'
      using errcode = 'P0001';
  end if;

  -- ★理由が無ければ、ここで止まります。記録も中身もありません。
  if p_reason_kind is null or btrim(p_reason_kind) = '' then
    raise exception 'REASON_REQUIRED: なぜ開くかを選んでください。'
      using errcode = 'P0001';
  end if;

  -- ★そのときの役職名と表示名を写します。
  select m.post_id, q.name, p.display_name
    into v_post_id, v_post_name, v_name
    from public.memberships m
    left join public.org_posts q on q.id = m.post_id
    left join public.profiles p on p.id = m.user_id
   where m.org_id = p_org_id and m.user_id = auth.uid();

  -- ★先に書きます。★縛りに引っかかれば、ここで止まり、中身は返りません。
  insert into public.monka_read_log
    (org_id, viewer_user_id, target_monka_id, reason,
     reason_kind, reason_note, post_id, post_name_at, name_at)
  values
    (p_org_id, auth.uid(), p_teacher_id, p_reason_kind,
     p_reason_kind, nullif(btrim(coalesce(p_reason_note, '')), ''),
     v_post_id, v_post_name, v_name);

  -- ★書けたときだけ、中身を返します。
  return query
    select m.id, m.org_id, m.teacher_id, m.author_id,
           m.title, m.body, m.created_at, m.withdrawn_at
      from public.org_messages m
     where m.org_id = p_org_id
       and m.teacher_id = p_teacher_id
     order by m.created_at desc;
end;
$$;

comment on function public.open_monka_thread(uuid, uuid, text, text) is
  '門下のやりとりを開く。先に monka_read_log へ1行書き、書けたときだけ中身を返す（fail closed）。理由が無ければ開かない。裁定159 S2。';

revoke all on function public.open_monka_thread(uuid, uuid, text, text) from public;
revoke all on function public.open_monka_thread(uuid, uuid, text, text) from anon;
grant execute on function public.open_monka_thread(uuid, uuid, text, text) to authenticated;
