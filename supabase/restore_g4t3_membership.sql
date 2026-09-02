-- ============================================================================
-- ★+g4t3 の membership を戻す（2026-09-02・ゲートの試験を続けるため）
--
--   ★service_role で実行してください。
--     いまの RLS では、この INSERT は★通りません。
--     memberships_restrict_role_insert が「自分の順位まで」しか許さず、
--     +g4t3 はその教室に membership を持たない（順位0）ためです。
--     ★それは正しい動きです。だから管理者側から戻します。
--
--   ★assignments とはぶつかりません。
--     assignments は org_id / teacher_id / student_id を持つだけで、
--     memberships を参照していません。一意制約も別です。
--     ★むしろ、いまが不整合です。
--       「教室の担当なのに、その教室のメンバーではない先生」が
--       1行あります。戻すと、そこが揃います。
--
--   ★これは「退会のやり直し」ではありません。
--     失敗した退会は、membership を消す前に★もっと多くを消しています。
--     戻せるのは、この1行だけです。下の「戻らないもの」を読んでください。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① いまの状態（★実行前に控えてください）
-- ---------------------------------------------------------------------------
select
  (select count(*) from auth.users where id = '<+g4t3 の uuid>') as "auth.users",
  (select count(*) from public.profiles where id = '<+g4t3 の uuid>') as "profiles",
  (select count(*) from public.memberships
    where org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
      and user_id = '<+g4t3 の uuid>') as "★memberships（0のはず）",
  (select count(*) from public.assignments
    where teacher_id = '<+g4t3 の uuid>') as "assignments（1のはず）";

-- ★教室のほうが無事であることも見ます（オーナーが居ること）
select m.user_id as "誰", m.role as "役割"
  from public.memberships m
 where m.org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
 order by m.role;

-- ---------------------------------------------------------------------------
-- ② 戻す
--
--   ★on conflict は書きません。一意制約の形が分からないためです。
--     代わりに not exists で防ぎます。★二重に入りません。
--   ★何度実行しても、行は1つのままです。
-- ---------------------------------------------------------------------------
insert into public.memberships (org_id, user_id, role)
select '199704ee-4ff8-49a3-8f50-c51b77dcd336', '<+g4t3 の uuid>', 'admin'
 where not exists (
   select 1 from public.memberships
    where org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
      and user_id = '<+g4t3 の uuid>'
 );

-- ---------------------------------------------------------------------------
-- ③ 戻ったことを確かめる
-- ---------------------------------------------------------------------------
select m.user_id as "誰", m.role as "役割", m.created_at as "入った日時"
  from public.memberships m
 where m.org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
 order by m.role, m.created_at;
-- ★+g4t2 = owner、+g4t3 = admin の2行。

-- ★オーナーが1人だけであること（昇格の件の後始末が効いているか）
select count(*) as "★オーナーの数（1であること）"
  from public.memberships
 where org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336' and role = 'owner';

-- ---------------------------------------------------------------------------
-- ④ ★戻らないもの（この SQL では直せません）
--
--   失敗した退会は、memberships を消す★前に、次を消しています
--   （lib/accountDeletion.js の USER_OWNED_TABLES → severConnections の順）。
--
--     記録（entries）／周期（cycle_periods）／同意（consent_records）／
--     学ぶの進み（article_notes・article_progress・chapter_state）／
--     羊の持ち物（character_inventory）／曲や役（repertoire_tessitura・
--     role_master・project_master）／アンケート（questionnaire_responses）／
--     お知らせ（user_notices）／events／org_event_participants／
--     feedback／subscriptions
--     さらに teacher_student_links（先生としても生徒としても）と
--     teacher_invitations。
--
--   ★+g4t3 は試験用の口座なので、中身が消えていても困りません。
--     ですが「元どおりになった」とは考えないでください。
--     ★ゲートの試験に必要なのは membership だけです。
--       止める判定が見るのは memberships と enrollments と organizations で、
--       上のどれも見ていません。だから、この1行で試験は成り立ちます。
--
--   ★teacher_beta_access は profiles にあり、profiles は残っています。
--     （2026-09-02 の直しで、profiles を先に消すのをやめたためです。
--       前の版なら profiles も消えていて、+g4t3 は
--       ★ログインできるのに何も保存できない口座になっていました）
--     なので、教室の画面はこれまでどおり出ます。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ⑤ このあと（★やり直しの試験）
--
--   +g4t3 で「アカウントの削除」を押します。
--   ★期待：止まること。そして二択が出ること。
--       この教室には、ほかに 3人 の方がいます。
--       アカウントを削除すると、この教室の契約者がいなくなります。
--         [教室を閉じる] [教室を残す]
--     （+g4t2・+g4s1・+g4s2 の3人）
--
--   ★止まらずに進んだら、f130b37 が本番に出ていません。
--   ★止まったら、そこで終わりです。★教室を閉じるは押さないでください。
--     +g4t2 の教室は、このあとのゲート項目で使います。
-- ---------------------------------------------------------------------------
