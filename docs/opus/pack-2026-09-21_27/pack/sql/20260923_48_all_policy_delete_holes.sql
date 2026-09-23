-- 20260923_48 「ALL のポリシー」の消す道の穴（2026-09-23 に全件を洗って見つけた）
-- 仕組み: ALL のポリシーは、DELETE のとき ★using だけを見る（with_check は見ない）
--   → 「書き込みの条件」に守りを入れた表は、★消す道が開いたままになる
-- 全件（10本）を見た結果、実害のあるもの2件を直す。ほかは そのままでよい（理由は末尾）
-- ★165（evaluation_judges）・26 のあと
-- ★本番で確かめた（2026-09-23）: evaluation_scores・evaluation_reviews とも ★confirmed_at を持つ／
--   この3表に 消すときの引き金は ★1本も無い／公開の作品・確定した点は いま0件（実害はこれから）

-- ════════ ① ★確定した点を 消せる（いちばん重い） ════════
--   evaluation_scores_write / evaluation_reviews_write は using が「自分が審査員」だけ。
--   確定の見張り（evaluation_scores_guard）は ★UPDATE しか見ていない。
--   → 審査員が ★確定した自分の点を まるごと消せる。★score_log にも残らない（消した記録が無い）
--   → 「点を直すときは わけを添える」という決まりが、消すことで 迂回できる

-- guard-ok: ★この形は sql/53・64 で直します（掃除と退会の逃げ道）。53・64 とセットで当ててください
create or replace function public.evaluation_scores_no_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if old.confirmed_at is not null then
    raise exception '確定の あとは、消せません。直すときは わけを 添えて ください';
  end if;
  return old;
end $$;
revoke all on function public.evaluation_scores_no_delete() from public, anon, authenticated;
drop trigger if exists evaluation_scores_no_delete_trg on public.evaluation_scores;
create trigger evaluation_scores_no_delete_trg before delete on public.evaluation_scores
  for each row execute function public.evaluation_scores_no_delete();

-- 講評も同じ（★90日は残す決まり・裁定その50）
-- guard-ok: ★この形は sql/53・64 で直します（掃除と退会の逃げ道）。53・64 とセットで当ててください
create or replace function public.evaluation_reviews_no_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- ★本番で確かめたら 講評にも confirmed_at がある → 点と同じ決まりに揃える
  if old.confirmed_at is not null then
    raise exception '確定の あとは、消せません（直すことは できます）';
  end if;
  return old;
end $$;
revoke all on function public.evaluation_reviews_no_delete() from public, anon, authenticated;
drop trigger if exists evaluation_reviews_no_delete_trg on public.evaluation_reviews;
create trigger evaluation_reviews_no_delete_trg before delete on public.evaluation_reviews
  for each row execute function public.evaluation_reviews_no_delete();
-- ★確定の前なら 消せる（出す先を間違えたときの救済）。確定の後は 直すだけ

-- ════════ ② 公開した作品を 持ち主が消せる ════════
--   works_write の using は「持ち主」だけ。with_check には is_public = false がある。
--   → ★確かめて公開になった作品を、持ち主が消せる。ほかの団体が使っている雛形が 突然消える
create or replace function public.works_no_delete_public()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- ★運営が「消す」と決めたときの逃げ道（印を置いた取引の中だけ）
  --   これが無いと、★公開の作品を 運営でも消せない／将来の掃除も 詰まる（2026-09-23 の見張りで気づいた）
  if coalesce(current_setting('app.retention', true),'') = 'on' then return old; end if;
  if old.is_public then
    raise exception 'PUBLIC_WORK_NOT_DELETABLE: 公開されている作品は 消せません（運営にご相談ください）';
  end if;
  return old;
end $$;
revoke all on function public.works_no_delete_public() from public, anon, authenticated;
drop trigger if exists works_no_delete_public_trg on public.works;
create trigger works_no_delete_public_trg before delete on public.works
  for each row execute function public.works_no_delete_public();

-- ════════ そのままでよいもの（理由） ════════
-- assignments: 消すのに 名簿の札が要る（using が札）。身元の固定は 直すときの話 → 問題なし
-- evaluation_judge_done: 「終えた印」を自分で消せるが、★消すと 見える範囲が狭まるだけ
-- koen_change_seen: 「見た」の印。消しても もう一度出るだけ
-- koen_kids: 保護者が 自分の子の行を消す。★本人のもの
-- performances: 自分の本番の記録。★本人のもの
-- lesson_prefs / lesson_ng_dates: ★sql/47 で直した（締切後は消せない）

-- 確かめ（試しの環境で）
-- ① 確定前の点を消す → 通る／★確定後の点を消す → 止まる
--    確定後に 直す（わけを添える）→ 通る（edit_confirmed_score）。score_log に残る
-- ② 確定前の講評を消す → 通る／★確定後の講評を消す → 止まる
-- ③ 自分の作品（未公開）を消す → 通る／★公開されている作品を消す → 止まる
-- ④ 公開の作品を どうしても消すとき:
--    ★先に is_public=false にする（ふつうの道）か、
--    ★掃除の印（app.retention）を置いた取引の中で消す（運営の道具から）
