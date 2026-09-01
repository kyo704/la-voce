-- ============================================================================
-- 解除したあと、同じ先生ともう一度つながれるようにする（2026-09-01）
--
--   ★何が起きていたか
--     teacher_student_links_teacher_id_student_id_key は
--     (teacher_id, student_id) の一意制約で、★status を見ていません。
--     解除（handleRevokeLink）は行を消さず status を 'revoked' にするだけなので、
--     一度解除した組み合わせは★二度とつなぎ直せませんでした。
--     生徒側には 409 が返るだけで、理由も出ませんでした。
--
--   ★なぜ行を消さないのか（消してはいけません）
--     解除ずみの行は、データ書き出しの「共有設定の履歴」そのものです
--     （作業指示-公開前の実装.md A-3 / lib/exportData.js）。
--     書き出しには status・accepted_at・revoked_at・revoked_by が入ります。
--     ★行を消すと、この履歴が黙って空になります。
--
--   ★なぜ既存の行を作り直さないのか
--     revoked の行を active に戻すと、accepted_at と revoked_at を
--     上書きすることになります。★「一度解除した」という事実が消え、
--     別々の2回のつながりが1行に潰れます。
--
--   → 一意制約を★部分索引に置き換えます。
--     「同時に有効なつながりは、1組につき1つ」だけを守り、
--     解除ずみの行はいくつでも残せるようにします。
--
--   ★仕様の確認（教室プラン仕様 §38）
--     「1人の生徒が、同じ教室の複数の先生につく」
--     ＝ student_id 単独の一意制約であってはいけません。
--     この移行は (teacher_id, student_id) の組を守るだけで、
--     生徒が何人の先生とつながれるかには影響しません。
--
--   ★何度実行しても同じ結果になります。
--   ★データは1行も書き換えません。制約の形だけを変えます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select conname as "制約の名前",
       pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid = 'public.teacher_student_links'::regclass
   and contype = 'u';

select status as "状態", count(*) as "行数"
  from public.teacher_student_links
 group by status
 order by 2 desc;

-- ---------------------------------------------------------------------------
-- ② 先に確かめる：いま有効な行に、重複が無いこと
--
--   ★0行であること。もし出たら、★ここで止めてください。
--     部分索引が作れません（作る前に、どちらを残すか決める必要があります）。
-- ---------------------------------------------------------------------------
select teacher_id, student_id, count(*) as "有効な行の数（1であるべき）"
  from public.teacher_student_links
 where status = 'active'
 group by teacher_id, student_id
having count(*) > 1;

-- ---------------------------------------------------------------------------
-- ③ 古い一意制約を外す
--
--   ★制約なので、索引ではなく alter table で外します。
--   ★存在しなければ何もしません（何度でも流せます）。
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.teacher_student_links'::regclass
       and conname = 'teacher_student_links_teacher_id_student_id_key'
  ) then
    alter table public.teacher_student_links
      drop constraint teacher_student_links_teacher_id_student_id_key;
    raise notice '古い一意制約を外しました。';
  else
    raise notice '古い一意制約は、すでにありません。';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ④ 部分索引を作る（★有効な行だけを一意にする）
--
--   同じ先生と生徒の組で「同時に有効なつながり」は1つだけ。
--   解除ずみの行は、何行あってもかまいません（履歴だからです）。
-- ---------------------------------------------------------------------------
create unique index if not exists teacher_student_links_active_pair_idx
  on public.teacher_student_links (teacher_id, student_id)
  where status = 'active';

comment on index public.teacher_student_links_active_pair_idx is
  '同時に有効なつながりは、1組につき1つ。★解除ずみの行は除く（where status = ''active''）。'
  'これを普通の一意制約に戻すと、★解除したあとつなぎ直せなくなる（2026-09-01 の不具合）。';

-- ---------------------------------------------------------------------------
-- ⑤ 確かめる
--
--   ★「条件つきか」が true になっていること。
--     false なら、解除したあとつなぎ直せない状態のままです。
-- ---------------------------------------------------------------------------
select i.relname                     as "索引の名前",
       pg_get_indexdef(x.indexrelid) as "定義",
       x.indisunique                 as "一意か",
       (x.indpred is not null)       as "★条件つきか（true であること）"
  from pg_index x
  join pg_class i on i.oid = x.indexrelid
 where x.indrelid = 'public.teacher_student_links'::regclass
   and x.indisunique
 order by 1;

-- 古い制約が残っていないこと（0行であること）
select conname as "★残っている古い一意制約（0行であること）"
  from pg_constraint
 where conrelid = 'public.teacher_student_links'::regclass
   and contype = 'u';
