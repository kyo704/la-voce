-- ============================================================================
-- 未成年のアカウントを、教師と紐付けられないようにする
--
--   出典 docs/lavoce-判断の回答-配布前の決定-20260829.md §7-2 ②（案D）
--   関連 設計憲章 §5「契約で禁じたことを、コードでも不可能にする」
--        docs/lavoce-未成年の扱い-A-7の残り.md
--
--   ★なぜ RLS ではなくトリガーか
--     RLS は service_role（lib/supabase/admin.js）が素通りします。
--     「いま分かっている経路を塞ぐ」ではなく「その状態を作れない」に
--     したいので、役割に関係なく必ず走るトリガーにします。
--     ★管理画面からも、SQLエディタからも、将来のAPIからも弾かれます。
--
--   ★フェイルクローズ
--     is_under_18 が false（＝本人が「18歳以上」と答えた）ときだけ通します。
--       true  … 未成年       → 弾く
--       null  … 答えていない → ★弾く
--       行が無い             → ★弾く
--
--   ★2つの表を守ります
--     teacher_student_links … 健康データの共有
--     assignments           … 教室の中の「担当」。★これも教師と生徒の対です
--     （enrollments は教室への在籍で、教師の名前を伴わないため対象外）
--
--   ★これは「保護者同意を作らなくてよい」という意味ではありません。
--     一般公開の前に、A-7 の残り5行を必ず作ります（判断の回答 §7-5 ⑤）。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行の前に、いまの状態を数える（★記録として残してください）
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.teacher_student_links)                as "いまある紐付け",
  (select count(*) from public.assignments)                          as "いまある担当",
  (select count(*) from public.profiles where is_under_18 is true)    as "未成年と答えた人",
  (select count(*) from public.profiles where is_under_18 is null)    as "まだ答えていない人";

-- ★既にある行は消しません。これから作れなくするだけです。
--   もし未成年の紐付けが既にあれば、下の④で見えます。

-- ---------------------------------------------------------------------------
-- ② 判定を1か所に置く
--
--   ★security definer にします。教師の側から生徒の profiles を読むため。
--     （profiles の RLS は本人の行しか読めません）
--   ★search_path を固定します。security definer の関数で必須です。
-- ---------------------------------------------------------------------------
create or replace function public.assert_student_is_adult()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ★「18歳以上だと本人が答えた」ときだけ通す。
  --   null（未回答）も、profiles の行が無い場合も、ここで弾かれます。
  if not exists (
    select 1 from public.profiles p
     where p.id = new.student_id
       and p.is_under_18 is false
  ) then
    raise exception
      'MINOR_TEACHER_LINK_BLOCKED: 未成年、または年齢が未回答のアカウントは、先生とつながることができません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function public.assert_student_is_adult() is
  '★未成年（および年齢未回答）のアカウントを、教師との紐付けから弾く。判断の回答 §7-2②（案D）。RLSではなくトリガーにしているのは、service_role も必ず通すため。保護者同意ができるまでの措置であり、A-7 の残りを不要にするものではない。';

-- ---------------------------------------------------------------------------
-- ③ 2つの表に取り付ける
--    ★update にも掛けます。student_id を後から差し替えられると意味が無いため。
-- ---------------------------------------------------------------------------
drop trigger if exists trg_block_minor_teacher_link on public.teacher_student_links;
create trigger trg_block_minor_teacher_link
  before insert or update of student_id on public.teacher_student_links
  for each row execute function public.assert_student_is_adult();

drop trigger if exists trg_block_minor_assignment on public.assignments;
create trigger trg_block_minor_assignment
  before insert or update of student_id on public.assignments
  for each row execute function public.assert_student_is_adult();

-- ---------------------------------------------------------------------------
-- ④ 既にある紐付けのうち、未成年・未回答のものを一覧する
--    ★消しません。見えるようにするだけです。どうするかは坂本さんの判断です。
-- ---------------------------------------------------------------------------
select 'teacher_student_links' as "表", l.id::text as "行", l.student_id as "生徒",
       coalesce(p.is_under_18::text, '(未回答)') as "18歳未満か"
  from public.teacher_student_links l
  left join public.profiles p on p.id = l.student_id
 where p.is_under_18 is not false
union all
select 'assignments', a.id::text, a.student_id,
       coalesce(p.is_under_18::text, '(未回答)')
  from public.assignments a
  left join public.profiles p on p.id = a.student_id
 where p.is_under_18 is not false;

-- ---------------------------------------------------------------------------
-- ⑤ 取り付けられたことを確かめる（★2行出ること）
-- ---------------------------------------------------------------------------
select c.relname as "表", t.tgname as "トリガー",
       case when t.tgenabled = 'O' then '有効' else t.tgenabled::text end as "状態"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
 where t.tgname in ('trg_block_minor_teacher_link', 'trg_block_minor_assignment')
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑥ ★実際に弾かれることを確かめる（安全な試し方）
--
--    下のブロックは、わざと失敗させて、そのまま巻き戻します。
--    ★何も書き込まれません。「弾かれました」と出れば成功です。
-- ---------------------------------------------------------------------------
do $$
declare
  v_minor uuid;
  v_teacher uuid;
begin
  -- 未成年、または未回答の人を1人選ぶ（居なければ試験を飛ばす）
  select id into v_minor from public.profiles where is_under_18 is not false limit 1;
  select id into v_teacher from public.profiles where id <> v_minor limit 1;
  if v_minor is null or v_teacher is null then
    raise notice '試せる相手が居ないので、この確認は飛ばします。';
    return;
  end if;
  begin
    -- ★必須の列も埋めておきます。埋めないと、トリガーではなく
    --   NOT NULL で落ちて、それを「弾かれた」と読み違えかねません。
    insert into public.teacher_student_links (teacher_id, student_id, status, share_scope, accepted_at)
      values (v_teacher, v_minor, 'active', '{}'::jsonb, now());
    raise exception '★弾かれませんでした。トリガーが効いていません。';
  exception
    when others then
      if sqlerrm like '%MINOR_TEACHER_LINK_BLOCKED%' then
        raise notice '✅ 弾かれました（正しい動作）: %', sqlerrm;
      else
        raise;
      end if;
  end;
  -- ★ここまでの書き込みは、この do ブロックの外へは出ません。
  raise notice '確認おわり。何も書き込まれていません。';
end $$;
