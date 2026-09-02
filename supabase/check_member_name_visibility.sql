-- ============================================================================
-- ★メンバー欄に名前が出ない理由を、1回で確定させる（2026-09-02）
--
--   ★調べるだけです。書き込みは1つもありません。
--
--   ★いま分かっていること（コードを読んで確かめた範囲）
--     ・メンバー欄は orgDisplayName(mem.user_id) を呼びます（13317）。
--       ★引数は user_id ひとつだけで、見る人の役割は受け取りません。
--       出し分けは、コードのどこにもありません。
--     ・名前は fetchOrgDetail が★別クエリで引いています。
--         supabase.from("profiles")
--           .select("id, display_name, vocal_profession").in("id", ids)
--       ★JOIN が無いのではなく、意図的に2本目のクエリにしてあります
--       （teacher_student_links で PostgREST の外部キー埋め込みが
--         問題を起こしたため、と当時のコメントに書かれています）。
--     ・つまり「JOIN が無いから届かない」のではありません。
--       ★このクエリが何を返すかが、すべてです。
--
--   ★そして、ここが肝心です
--     もし原因が RLS なら、★JOIN にしても直りません。
--     PostgREST の埋め込みも、埋め込まれる表の RLS に従います。
--     読めない行は、どの書き方でも読めません。
--
--   ★残っている可能性は2つだけです。
--     (a) その人の display_name が空
--     (b) profiles を他人の行まで読めない
--         supabase/schema.sql の SELECT は auth.uid() = id です。
--         これが本番の状態なら、他人の名前は1つも引けません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① profiles のポリシー（★これが答えです）
--
--   SELECT のポリシーが「auth.uid() = id」1本だけなら、(b) で確定です。
--   ほかに「同じ教室の人なら読める」系のポリシーがあれば、(a) を疑います。
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- ② display_name は、そもそも入っているか
--     ★service_role で実行してください（ここは事実を知りたいだけなので）。
-- ---------------------------------------------------------------------------
select p.id as "利用者", p.display_name as "設定されている表示名",
       case when p.display_name is null then '★null'
            when p.display_name = ''   then '★空文字'
            else 'あり' end as "状態"
  from public.profiles p
 where p.id in (
   select m.user_id from public.memberships m
    where m.org_id = '<マイ教室の uuid>'
 );

-- ---------------------------------------------------------------------------
-- ③ ★決定的な確認：オーナーになりすまして、他人の名前が読めるか
--
--   ★claims を先、role をあとに。逆にすると auth.uid() が null になります。
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<オーナー(+t5など)の uuid>","role":"authenticated"}', true);
set local role authenticated;

select auth.uid() as "★オーナーになっているか";

-- ③-1 メンバーの人数（memberships は読めるはず）
select count(*) as "メンバーの行数"
  from public.memberships where org_id = '<マイ教室の uuid>';

-- ③-2 ★そのメンバーの profiles が、何行読めるか
--      ★1 なら (b) で確定です（自分の行しか読めていない）。
--        メンバーの人数と同じなら (a) です（読めているが名前が空）。
select count(*) as "★読める profiles の行数",
       count(display_name) filter (where display_name <> '') as "うち名前が入っている行"
  from public.profiles
 where id in (
   select m.user_id from public.memberships m
    where m.org_id = '<マイ教室の uuid>'
 );

rollback;

-- ---------------------------------------------------------------------------
-- ④ 読み方と、次にすること
--
--   ③-2 が 1 →★(b)。profiles の RLS が原因です。
--     ★コード側では直せません。JOIN にしても、列を足しても読めません。
--     直すなら、次のどちらかです（①の本文を見てから決めます）。
--       ・同じ教室に居る人どうしで display_name だけ読めるポリシーを足す
--       ・display_name だけを返す SECURITY DEFINER の関数を作る
--     ★どちらも profiles 全体を開けてはいけません。
--       profiles には健康に関わる列（allergies・regular_medications・
--       cycle 関連・is_under_18 など）が入っています。
--       ★「行が読めれば全列が読めます」— 今日 entries で確かめたとおりです。
--
--   ③-2 がメンバーの人数と同じ →★(a)。名前が空なだけです。
--     ★埋め戻しはしません。本人が付けるものです。
--     画面は「名前を読み込めませんでした」と出ます（7bd0756）。
--
--   ★アプリ側でも同じことが分かります。
--     教室を開いて、ブラウザのコンソールを見てください。
--       ★名前を読めた人数が足りません: 1/3 …
--     という行が出ていれば、(b) です。
-- ---------------------------------------------------------------------------
