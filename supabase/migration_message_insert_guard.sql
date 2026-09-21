-- ============================================================================
-- La Voce / Woolsong ── ★ことばを 返す ときの 門（★裁定 その94 §4c・2026-09-21）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★`migration_application_messages.sql` の NOT_YET ③ を 外します。
--   ★★あの 紙に、★外す 条件を こう 書きました ──
--     ★「when …… ★「曲目を答える」の 画面を 作る とき」。
--   ★★きょう その 画面を 作りました。★だから ここで 締めます。
--
-- ★★★これまで ── ★`auth.uid() = sender_user_id` だけ でした。
--   ★★誰でも、★どの 応募にでも、★いつでも 返せました。
--   ★★★たずねられて いない のに 答えを 送れました。
--     ★★応募した 方の 画面に、★覚えの ない 返事が 出ます。
--   ★★★応募した 本人も、★自分の 応募に 返せました。
--     ★★返事は 募集を 出した 方の もの です。
--
-- ★★★これから ── ★3つ 重ねます。
--   ★① 送るのは **募集を 出した 方** だけ
--   ★② その 応募が **たずねて いる**（`kyokumoku_kikitai`）こと
--   ★③ 切れて いない こと（★双方向）
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
    and tablename='application_messages'
    and policyname='application_messages_insert_own') then
    drop policy "application_messages_insert_own" on public.application_messages;
  end if;
  create policy "application_messages_insert_own" on public.application_messages
    for insert with check (
      auth.uid() = sender_user_id
      and exists (
        select 1
        from public.applications a
        join public.postings p on p.id = a.posting_id
        where a.id = application_messages.application_id
          -- ★① 返すのは 募集を 出した 方 だけ。
          and p.owner_user_id = auth.uid()
          -- ★② たずねられて いる ときだけ。
          and a.template_key = 'kyokumoku_kikitai'
          -- ★③ 取り下げられて いない こと。
          and a.status <> 'withdrawn'
          -- ★③ 切れて いない こと（★双方向）。
          and public.matching_visible(a.applicant_user_id, p.owner_user_id)
      )
    );
end $$;

-- ============================================================================
-- ★残る NOT_YET
--   ★★`orei_sodan` は「相談に 応じます」の 募集に だけ 出せます（★§4g）。
--     ★★いま、★台帳では 止めて いません。★画面が 出し分けて います。
--     ★★★when …… ★応募を 書き込む 門を 締める とき。
--       ★★`applications_insert_own` に、★`p.sodan` を 見る 枝を 足します。
-- ============================================================================
