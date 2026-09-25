-- 20260924_76 15〜17歳が 保護者の同意で つながれるようにする（裁定192・★緊急）
-- 何が起きていたか:
--   ★裁定107 の 仕組みは すべて できていたのに、★古い引き金2本が 止めていました
--   trg_block_minor_teacher_link ／ trg_block_minor_assignment
--   どちらも assert_student_is_adult ＝ ★is_under_18 が false でなければ 止める
--   → ★同意を もらっても 先で 止まる ＝ 裁定107 が 働いていない
-- ★引き金は 付け替えません。★関数の 中身だけ 直します（★付け替えは 事故のもと）
-- ★04・107 のあと。★規約の 書き換えは ★これを 当てたあと（Code の判断どおり）

-- guard-ok: ★止める引き金です。★逃げ道は「18歳以上」か「保護者の同意」。★印は使いません
create or replace function public.assert_student_is_adult()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid;
begin
  -- ㋐ 18歳以上（★いままでどおり）
  if exists (select 1 from public.profiles p
              where p.id = new.student_id and p.is_under_18 is false) then
    return new;
  end if;

  -- ★年齢が 未回答（null）は 通しません（★変えません）
  if not exists (select 1 from public.profiles p
                  where p.id = new.student_id and p.is_under_18 is true) then
    raise exception 'MINOR_TEACHER_LINK_BLOCKED: 未成年、または年齢が未回答のアカウントは、先生とつながれません。'
      using errcode = 'P0001';
  end if;

  -- ㋑ 15〜17歳＋保護者の 同意（裁定107・192）
  --   ★表によって 学校の見方が 違います
  if TG_TABLE_NAME = 'assignments' then
    v_org := new.org_id;                       -- ★門下は 学校に ぶら下がる
    if public.has_guardian_consent(new.student_id, v_org) then
      return new;
    end if;
  else
    -- ★teacher_student_links は 学校の列が ありません（★本番で 確かめた）
    --   → ★どこか1つの学校で 同意が 生きていれば 通す（裁定192 §2）
    if exists (select 1 from public.guardian_consents g
                where g.user_id = new.student_id
                  and g.consented_at is not null and g.withdrawn_at is null) then
      return new;
    end if;
  end if;

  raise exception 'MINOR_NEEDS_GUARDIAN: 18歳未満の方は、保護者の方の ひとことが 要ります。'
    using errcode = 'P0001';
end $$;
revoke all on function public.assert_student_is_adult() from public, anon, authenticated;

-- ★運営が「同意の 切れた人・まだの人」を 見る
create or replace function public.minors_without_consent(p_org uuid)
returns table(student_id uuid, name_at text, has_link boolean)
language sql stable security definer set search_path to 'public' as $$
  select e.student_id,
         coalesce(nullif(btrim(coalesce(pr.display_name,'')),''),
                  nullif(btrim(coalesce(pr.name,'')),''), '（名前なし）'),
         exists (select 1 from public.assignments a
                  where a.org_id = p_org and a.student_id = e.student_id and a.ended_at is null)
    from public.enrollments e
    join public.profiles pr on pr.id = e.student_id
   where e.org_id = p_org and e.status = 'active'
     and pr.is_under_18 is true
     and not public.has_guardian_consent(e.student_id, p_org)
     and public.has_can(p_org, 'meibo')
   order by 2;
$$;
revoke all on function public.minors_without_consent(uuid) from public, anon;
grant execute on function public.minors_without_consent(uuid) to authenticated;
-- ★すでにある つながりは 切りません（has_link で 見えるだけ）。★人が 見て 決めます

-- 確かめ（試しの環境で）
-- 18歳以上 → 通る／★年齢が未回答 → 止まる（MINOR_TEACHER_LINK_BLOCKED）
-- ★15〜17歳＋その学校の同意 → ★通る（assignments）
-- 15〜17歳＋同意なし → 止まる（MINOR_NEEDS_GUARDIAN）
-- ★同意を 取り消したあと → 新しくは 止まる／★すでにある 行は 残る
-- teacher_student_links: ★どこか1つの学校の 同意で 通る
