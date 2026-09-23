-- 20260923_55 退会が止まる4件目（Code が sql/50 を当てたあと 実際に消して見つけた）
-- 見つけたもの:
--   assert_lesson_identity_unchanged は teacher_id・student_id が ★変わったら止める
--   退会すると 外部キーの SET NULL で ★この2つが null になる → 引き金が止める → ★退会できない
--   （Code の調べ: 同じ型の引き金4本のうち、★SET NULL の対象を持つのは lessons だけ）
-- 実害: いまは0（lessons に 実在の利用者の id を持つ行が無い）。★実データが入った瞬間に出る
-- ★決め方の考え:
--   「身元を変えない」は ★人が差し替えるのを止める決まり（先生を別人にすり替えない・学校を移さない）
--   ★人が居なくなって 空になるのは 差し替えではない。★空へ向かう変更だけ 通す
-- ★50 のあと

create or replace function public.assert_lesson_identity_unchanged()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  -- 学校とつながりは いままでどおり 変えられない
  if new.link_id is distinct from old.link_id
     or new.org_id is distinct from old.org_id then
    raise exception 'LESSON_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;

  -- ★先生・生徒は「別の人に差し替える」のだけ止める。
  --   ★空になる（退会で SET NULL）のは 通す。★空から誰かを入れ直すのは 止める
  if new.teacher_id is distinct from old.teacher_id and new.teacher_id is not null then
    raise exception 'LESSON_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  if new.student_id is distinct from old.student_id and new.student_id is not null then
    raise exception 'LESSON_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;

  return new;
end $$;
revoke all on function public.assert_lesson_identity_unchanged() from public, anon, authenticated;

-- 確かめ（試しの環境で・★実際に人を消して）
-- ① 先生が退会する → ★通る（lessons.teacher_id が null になる。行は残る）
-- ② 生徒が退会する → ★通る
-- ③ 先生を ★別の人に差し替える → 止まる（LESSON_IDENTITY_IMMUTABLE）
-- ④ 空になった teacher_id に ★誰かを入れ直す → 止まる（★記録を後から作り替えさせない）
-- ⑤ 学校・つながりを変える → 止まる（いままでどおり）
-- ★①②のあと、レッスンの行が残っていること（時間・場所・日付が消えていない）

-- ═══════ ★同じ型の4件目。確かめる観点を5つにする ═══════
--   「書けなくする・消せなくする・変えさせない」仕組みを入れたら、必ず確かめる:
--     ①退会 ②親を消す ③連鎖の SET NULL ④保存期間の掃除 ★⑤身元の固定 × SET NULL
--   ★Code の調べ方（実際に人を消してみる）が、私の読み取りより確実でした
