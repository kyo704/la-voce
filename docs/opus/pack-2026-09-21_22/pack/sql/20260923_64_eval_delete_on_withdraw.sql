-- 20260923_64 ★退会が止まる5件目（★本番にすでに当たっている・急ぎ）
-- 見つけ方: ★道具（sql_guard_lint）を 直したら 出た。人が見て気づいたものではない
-- 何が起きるか:
--   evaluation_scores.student_id / evaluation_reviews.student_id は ★CASCADE
--   → 学生が退会すると、その学生の 点と講評が ★消される
--   → sql/48 で入れた「確定のあとは消せない」引き金が ★その削除を止める
--   → ★確定した点が1つでもある学生は、退会できない
--   ★本番に 引き金は すでにある（evaluation_scores_no_delete_trg／evaluation_reviews_no_delete_trg）
--   いま確定した点は0件なので 詰まっている人は いない。★点が入った瞬間に出る
-- 決めたこと:
--   ★退会のときは 消してよい（本人のものだから）。★人が「なかったことにする」のは これまでどおり止める
--   ★消えた記録の代わりに、点があったことは 採点の記録（score_log）に残る（別の表・退会で消えない）
-- ★48・53 のあと

-- ① 退会している最中の印（auth.users を消す前に立てる）
create or replace function public.mark_deleting_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform set_config('app.deleting_user', old.id::text, true);   -- ★この取引の中だけ
  return old;
end $$;
revoke all on function public.mark_deleting_user() from public, anon, authenticated;
drop trigger if exists users_mark_deleting on auth.users;
create trigger users_mark_deleting before delete on auth.users
  for each row execute function public.mark_deleting_user();

-- ② 点: 退会のときは通す（★それ以外は これまでどおり止める）
create or replace function public.evaluation_scores_no_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if coalesce(current_setting('app.deleting_user', true),'') in (old.student_id::text, old.judge_id::text) then
    return old;                                   -- ★退会（本人のものが消える）
  end if;
  if coalesce(current_setting('app.retention', true),'') = 'on' then return old; end if;  -- ★保存期間の掃除
  if old.confirmed_at is not null then
    raise exception '確定の あとは、消せません。直すときは わけを 添えて ください';
  end if;
  return old;
end $$;
revoke all on function public.evaluation_scores_no_delete() from public, anon, authenticated;

-- ③ 講評: 同じ
create or replace function public.evaluation_reviews_no_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if coalesce(current_setting('app.deleting_user', true),'') in (old.student_id::text, old.judge_id::text) then
    return old;
  end if;
  if coalesce(current_setting('app.retention', true),'') = 'on' then return old; end if;
  if old.confirmed_at is not null then
    raise exception '確定の あとは、消せません（直すことは できます）';
  end if;
  return old;
end $$;
revoke all on function public.evaluation_reviews_no_delete() from public, anon, authenticated;

-- 確かめ（試しの環境で・★実際に人を消して）
-- ① 確定した点のある学生が 退会する → ★通る（点と講評も 一緒に消える）
-- ② 審査員が 確定した点を 消そうとする → ★止まる（いままでどおり）
-- ③ 保存期間の掃除（app.retention）→ 通る
-- ④ 学生を消さずに 点だけ消す → 止まる
