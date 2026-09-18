-- ===========================================================================
-- ★get_monka_read_notices ── ★確かめられた ことを、★ご本人に お伝えする
--
--   ★出どころ 裁定 その76 訂正版 ③「通知」（★2026-09-18）
--     ★「○月○日、あなたと ○○先生の やりとりが 確かめられました」
--     ★★★誰が 見たかは 出しません（★報復を 避ける）。
--
--   ★★★なぜ 関数か ── ★`monka_read_log` を 生徒に 開けられないから です。
--     ★★あの 表には `viewer_user_id` が 入って います。
--     ★★行を 1つでも 読めるように すると、★誰が 見たかが 分かります。
--     ★★★だから、★**列を 削って** 返す 関数を 1つ 置きます。
--       ★★返すのは 日づけ と 先生の お名前 だけ です。
--     ★★同じ 形が この 蔵に あります（★`get_student_entries`）。
--
--   ★★★2つめの 写しを 作りません。
--     ★★「知らせ」の 表を 別に 作って、★見た ときに 1行 書く 手も あります。
--     ★★けれど それは、★同じ 事実が 2か所に 残る という ことです。
--     ★★片方だけ 消えた とき、★どちらが 本当か 分かりません。
--     ★★`monka_read_log` が 唯一の 出どころ です。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
-- ===========================================================================

create or replace function public.get_monka_read_notices()
returns table (viewed_at timestamptz, teacher_name text)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select l.viewed_at,
         nullif(btrim(coalesce(p.display_name, '')), '') as teacher_name
    from public.monka_read_log l
    left join public.profiles p on p.id = l.target_monka_id
   where exists (
     -- ★★★呼んだ 方が、★その 門下に 居た か。
     --   ★★`ended_at` で 絞りません（★裁定 その76 追補）。
     --     ★★やめた あとに 確かめられる ことが あります。
     --     ★★やめた から 知らせない、では 筋が 通りません。
     --   ★★`org_id` と `teacher_id` の 両方で 合わせます。
     --     ★★片方だけ だと、★別の 学校の 同じ 先生に 当たります。
     select 1
       from public.assignments a
      where a.org_id = l.org_id
        and a.teacher_id = l.target_monka_id
        and a.student_id = auth.uid()
   )
   order by l.viewed_at desc
   limit 50;
$function$;

-- ---------------------------------------------------------------------------
-- ★権利 ── ★先に 取り上げ、★それから 渡します
--
--   ★★`security definer` は 決まりを 越えます。★誰に 呼ばせるかが すべて です。
-- ---------------------------------------------------------------------------
revoke all on function public.get_monka_read_notices() from public;
revoke all on function public.get_monka_read_notices() from anon;
grant execute on function public.get_monka_read_notices() to authenticated;

comment on function public.get_monka_read_notices() is
  '確かめられた日づけと先生の名だけを返します。誰が見たかは返しません（裁定その76）。';

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------

-- ★① 返す 列 … ★viewed_at と teacher_name の 2つ だけ。
--   ★★`viewer_user_id` が 入って いない ことを 見ます。
select p.proname as 名, pg_get_function_result(p.oid) as 返すもの
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_monka_read_notices';

-- ★② 誰が 呼べるか … ★authenticated だけ。★anon は 0行。
select grantee as 相手, privilege_type as 権利
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'get_monka_read_notices'
order by grantee;
