-- ============================================================================
-- つながっている人の「名前」だけを返す関数（2026-09-03・緊急の置き換え）
--
--   ★なぜ要るか
--     ポリシー profiles_connected_display_name を落としました。
--     名前は「display_name だけ」と読めますが、RLS は★行単位です。
--     行が読めれば、その行の★全部が読めていました。
--       allergies / regular_medications / conditions（既往症）/
--       health_notes / is_under_18 / cycle_show_on_home / line_user_id …
--     ★lessons・entries に続く、今日3件目の同じ誤解でした。
--
--   ★are_connected は、書き写しません。★呼びます。
--     「誰とつながっているか」の決めごとは、あの関数が持っています。
--     ここに書き写すと、同じ判断が2か所になり、
--     ★片方だけ直されて食い違います。この repo がくり返してきた欠陥です。
--     ★私はまだ are_connected の中身を見ていません。
--       見ずに書き写すことはできませんし、見ても書き写しません。
--
--   ★返す列は3つだけです（id, display_name, vocal_profession）。
--     アプリの3か所が引いているのが、ちょうどこの3つです。
--       VocalTracker.jsx:9733   先生が、自分の生徒の名前を引く
--       VocalTracker.jsx:9937   生徒が、担当の先生の名前を引く
--       VocalTracker.jsx:10284  生徒が、レッスンの先生の名前を引く
--     ★全列を要る場所は、1つもありませんでした。
--     ★増やすときは、先に「何が相手に見えるか」を本人に見せてから。
--
--   ★get_org_member_names と、わざと別の関数にしています。
--     あちらは「同じ教室にいるか」で決めます。こちらは are_connected です。
--     ★別の問いなので、1つにまとめません。
--     まとめると、片方を広げたときに、もう片方も黙って広がります。
--
--   ★何度実行しても同じ結果になります。
--   ★profiles にも entries にも、1行も書きません。読むだけです。
-- ============================================================================

create or replace function public.get_connected_names(p_ids uuid[])
returns table(id uuid, display_name text, vocal_profession text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- ★ログインしていなければ、0行です。エラーにしません
  --   （エラーにすると、uuid の当たりはずれを調べる道具になります）。
  if auth.uid() is null then
    return;
  end if;

  -- ★自分自身は、ここでは返しません。
  --   自分の行は、本人のポリシー（auth.uid() = id）で読めます。
  --   ★2つの道から同じものが来ると、どちらが効いているか分からなくなります。
  return query
    select p.id,
           -- ★空文字は null にして返します。画面が「名前が無い」と
           --   「読めなかった」を同じに扱えるようにするためです。
           nullif(btrim(coalesce(p.display_name, '')), ''),
           p.vocal_profession
      from public.profiles p
     where p.id = any(p_ids)
       and p.id <> auth.uid()
       -- ★ここが唯一の関門です。決めごとは are_connected が持っています。
       and public.are_connected(auth.uid(), p.id);
end;
$$;

revoke all on function public.get_connected_names(uuid[]) from public, anon;
grant execute on function public.get_connected_names(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ方（★ふつうの利用者のセッションで。service_role では意味がありません）
--   ★claims を先、role をあとに。順番を逆にすると効きません。
-- ---------------------------------------------------------------------------

-- ① つながっている相手の名前が返ること（+g4t2 → +g4s1）
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"0648585d-42f7-4d26-b47c-878beba15fa0","role":"authenticated"}', true);
-- set local role authenticated;
-- select * from public.get_connected_names(
--   array['ef626dc0-a489-4464-a1fb-56e63c63d090']::uuid[]);
-- rollback;
-- ★1行返り、列は3つだけであること。

-- ② ★つながっていない人を頼んでも、0行であること
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<関係のない人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★0 であること" from public.get_connected_names(
--   array['ef626dc0-a489-4464-a1fb-56e63c63d090']::uuid[]);
-- rollback;

-- ③ ★profiles そのものは、本人の行しか読めないこと（いちばん大事）
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"0648585d-42f7-4d26-b47c-878beba15fa0","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★1 であること（直す前は 2）" from public.profiles;
-- rollback;

-- ④ ★機微な列が、この関数からは出ないこと
--    返る列が3つだけであることを、型から確かめます。
select a.attname as "返る列"
  from pg_proc p
  join pg_type t on t.oid = p.prorettype
  join pg_class c on c.reltype = t.oid
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'get_connected_names'
 order by a.attnum;
-- ★id / display_name / vocal_profession の3行だけであること。
