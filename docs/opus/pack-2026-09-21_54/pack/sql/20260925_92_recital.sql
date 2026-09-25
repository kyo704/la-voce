-- 20260925_92 門下の 発表会（★裁定203）
-- 坂本さんの 判断（2026-09-25）:
--   ★先生が 学内で 門下の 発表会を するとき、★公演機能が 使えた 方がよい
--   ★ただし ★機能を 制限した ★簡単な もので よい
-- ★★新しい 表は 要りません（★koen に org_id も kind='recital' も あります）
-- ★81・91 のあと

alter table public.koen add column if not exists simple boolean not null default false;
-- ★★true なら ★簡単な 形（★配役・香盤表・稽古・合言葉を 出さない）
--   ★出すのは: 出る人・演奏の 順番・当日の 進行・配る・出欠・参加費

-- ★★門下の 生徒だけ を 出せる（★先生が ほかの 門下を 勝手に 入れない）
create or replace function public.my_monka_students(p_org uuid)
returns table(student_id uuid, name_at text)
language sql stable security definer set search_path to 'public' as $$
  select a.student_id,
         coalesce(nullif(btrim(coalesce(p.display_name,'')),''),
                  nullif(btrim(coalesce(p.name,'')),''))
    from public.assignments a
    left join public.profiles p on p.id = a.student_id
   where a.org_id = p_org and a.teacher_id = auth.uid()
   order by 2;
$$;
revoke all on function public.my_monka_students(uuid) from public, anon;
grant execute on function public.my_monka_students(uuid) to authenticated;
-- ★★体調は 1つも 返しません（★assignments と profiles だけ）

-- ★簡単な 形のとき 使わない 表（★画面で 出さない・★台帳では 止めません）
--   koen_slots（役）・koen_cells（●）・koen_sessions（稽古）・koen_join_codes（合言葉）
--   koen_ticket_plan・koen_budget（★入場料を 取る 発表会は 少ない）
-- ★★止めない 理由: ★あとから「ふつうの 公演に する」と 決めたとき、
--   ★書いたものが 消えない ように

-- ★料金は 0円（★教室・学校の プランの 中・裁定その54）
--   ★koen.org_id が 入っていれば、★請求は 学校の プランに 含まれます
--   ★★別に 取りません

-- 確かめ（試しの環境で・★なりきって）
-- ★先生は 自分の 門下の 生徒だけ 出る（★ほかの 門下は 出ない）
-- ★体調の 列は 1つも 返らない
-- ★simple の 既定は false（★ふつうの 公演は そのまま）
-- ★事務（meibo だけ）からは 呼べない → 0行（★門下は 先生の もの）
