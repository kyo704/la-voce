-- ============================================================================
-- update の 決まりに、★「書ける条件」を はっきり 書く（★8件）
--
-- ★★★はじめに ── ★私の 前の 説明が 誤って いました。★訂正します。
--
--   ★私は、★いくつもの SQL の 覚え書きに こう 書いて いました ──
--     「with check が 無いと、★using が 代わりに 使われ、
--       ★他人の user_id へ 書き換える 道が 開きます」
--   ★★後ろ半分が 誤りです。
--
--   ★★PostgreSQL の 決まり（★公式の 説明）
--     ★update の 決まりに with check を 書かなかった ときは、
--     ★**using の 式が、★書くときの 確かめにも 使われます**。
--     ★★しかも、★確かめるのは **書き換えた あとの 行**です。
--
--   ★★だから profiles を 例に すると ──
--     ★using (auth.uid() = id)　★with check なし
--     ★→ ★書き換えた あとの 行も auth.uid() = id で なければ なりません。
--     ★→ ★id を 他人の ものに 変えると、★その 確かめに 落ちます。
--     ★★つまり、★**いま 漏れては いません**。
--
--   ★★では、★なぜ 直すのか。★理由は 2つ あります。
--     ★① 読む 条件と 書く 条件は、★別の ことです。
--        ★★あとで 誰かが using を 広げた とき、
--          ★★書く 側も 黙って 広がります。★気づけません。
--        ★★はっきり 書いて あれば、★広げる ときに 目に 入ります。
--     ★② 読む 人が 分かりません。
--        ★★いま、★坂本さんも Opus も 私も、★「空だ」と 見て 驚きました。
--        ★★空欄は、★「決めて いない」のか「使い回して いる」のか
--          ★区別が つきません。
--
--   ★★つまり、★これは **緊急の 穴ふさぎでは ありません**。
--     ★★備えです。★急いで 流す 必要は ありません。
--     ★★けれど、★流して 悪い ことも ありません。★式を 変えないからです。
--
--   ★★ご自分で 確かめる 道も 書いて おきます（★⑤）。
--     ★★私の 言葉を 信じずに、★台帳に 聞いて ください。
--
-- ============================================================================
--
--   ★★この SQL の やり方
--     ★★式を 私が 書き写しません。★いま 入って いる using を そのまま 使います。
--       ★★書き写すと、★写しまちがえます。★8件 ぜんぶ ちがう 式です。
--     ★★1つずつ、★消して 作り直します。★ほかは 触りません。
--     ★★lock_timeout を 置きます（★2026-09-11 の デッドロックの あと）。
--
--   ★★ほかの 台本と 同時に 流さないで ください。
-- ============================================================================


-- ===========================================================================
-- ① ★何を 直すのか、★先に 見る（★読むだけ）
--
--   ★★ここに 出た ものだけを、★③が 直します。
--   ★★「新しい 書ける条件」の 列が、★これから 入る 式です。
--     ★using と 同じ ものです。★いまの 動きと 1つも 変わりません。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読める条件（using）",
  with_check as "いまの 書ける条件",
  qual       as "★新しい 書ける条件（★同じ 式）"
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE', 'ALL')
  and coalesce(btrim(with_check), '') = ''
  and coalesce(btrim(qual), '') <> ''
order by tablename, policyname;


-- ===========================================================================
-- ② ★数を 数えて おく（★あとで くらべます）
-- ===========================================================================
select count(*) as "直す 前の 数"
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE', 'ALL')
  and coalesce(btrim(with_check), '') = ''
  and coalesce(btrim(qual), '') <> '';


-- ===========================================================================
-- ③ ★直す
--
--   ★★1つずつ、★消して 作り直します。
--   ★★using の 式は、★いま 入って いる ものを そのまま 使います。
--     ★★私が 書き写しません。
--   ★★だれに（roles）も、★そのまま 引き継ぎます。
--   ★★式を 変えないので、★いまの 動きは 1つも 変わりません。
--
--   ★★消してから 作るまでの あいだ、★その 決まりは ありません。
--     ★★同じ 命令の 中なので、★外からは 見えません。
--     ★★ただし、★途中で しくじると、★決まりが 消えた ままに なります。
--       ★★だから ④で 必ず 数えて ください。
--       ★★もし 減って いたら、★①の 表を お送りください。★作り直します。
-- ===========================================================================
set lock_timeout = '5s';

do $$
declare
  r record;
  role_list text;
begin
  for r in
    select schemaname, tablename, policyname, cmd, qual, roles
    from pg_policies
    where schemaname = 'public'
      and cmd in ('UPDATE', 'ALL')
      and coalesce(btrim(with_check), '') = ''
      and coalesce(btrim(qual), '') <> ''
    order by tablename, policyname
  loop
    -- ★★だれに。★{public} なら 書きません（★既定）。
    role_list := array_to_string(r.roles, ', ');
    if role_list is null or role_list = '' or role_list = 'public' then
      role_list := null;
    end if;

    execute format('drop policy %I on %I.%I',
      r.policyname, r.schemaname, r.tablename);

    execute format(
      'create policy %I on %I.%I for %s %s using (%s) with check (%s)',
      r.policyname,
      r.schemaname,
      r.tablename,
      case when r.cmd = 'ALL' then 'all' else 'update' end,
      case when role_list is null then '' else 'to ' || role_list end,
      r.qual,
      r.qual
    );

    raise notice '★直しました　%.%　%', r.tablename, r.policyname, r.cmd;
  end loop;
end $$;


-- ===========================================================================
-- ④ ★確かめ（★0行・0件で あって ほしい）
-- ===========================================================================
select count(*) as "★まだ 空の 数（0で あって ほしい）"
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE', 'ALL')
  and coalesce(btrim(with_check), '') = ''
  and coalesce(btrim(qual), '') <> '';

-- ★★8つが、★using と 同じ 式で 入って いること。
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  qual       as "読める条件",
  with_check as "書ける条件",
  (btrim(qual) = btrim(with_check)) as "★同じ 式か"
from pg_policies
where schemaname = 'public'
  and tablename in ('lessons','link_consents','org_events','org_invitations',
                    'profiles','repertoire_tessitura','teacher_invitations')
  and cmd in ('UPDATE','ALL')
order by tablename, policyname;

-- ★★決まりの 数が 減って いないこと。
select tablename as "表", count(*) as "決まりの 数"
from pg_policies
where schemaname = 'public'
  and tablename in ('lessons','link_consents','org_events','org_invitations',
                    'profiles','repertoire_tessitura','teacher_invitations')
group by tablename
order by tablename;


-- ===========================================================================
-- ⑤ ★私の 言葉を 信じずに、★台帳に 聞く
--
--   ★★「直す 前から、★他人の id には 変えられなかった」ことの 確かめです。
--   ★★③を 流した あとでも、★同じ 答えに なります（★式が 同じ だからです）。
--
--   ★★下は **わざと しくじる** ための ものです。
--     ★★「0 rows updated」か、★決まりに はじかれる のが 正しい 姿です。
--     ★★もし 1行 変わったら、★それが 本物の 穴です。★すぐ お知らせ ください。
--   ★★ご自分の 行だけを 触ります。★ほかの 方には 触れません。
-- ===========================================================================
-- ★★念のため、★巻き戻せる 形に します。
--   ★★SQL Editor は rollback を 効かせない ことが あります。
--     ★だから、★わざと ありえない id を 使います。
--     ★★成功しても、★その id の 人は 居ません。
begin;

update public.profiles
   set id = '00000000-0000-0000-0000-000000000001'
 where id = auth.uid();

-- ★★ここまでで「0 rows」か、★はじかれて いれば 正しい 姿です。
rollback;
