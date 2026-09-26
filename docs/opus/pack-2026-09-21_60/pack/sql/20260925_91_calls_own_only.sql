-- 20260925_91 ★ほかの方の 集合時刻が 見えていました（★裁定141）
-- 見つけ方（2026-09-25・香盤表と 稽古を 本物で 通していて）:
--   ★koen_calls の 読みが ★koen_can_see（★公演に いる人 全員）でした
--   → ★★歌手A から ★歌手B の 呼び出しが ★見えました
-- ★裁定141:「★他人の 集合時刻は 見えない」
-- ★見本の 約束:
--   稽古「★ほかの 方の 集合時刻は 見えません」
--   本番の日の流れ「★ほかの 方の 入りの 時刻は 出ません」
--   ★★書いてあるのに ★守られていませんでした
-- ★81 のあと

drop policy if exists koen_calls_select on public.koen_calls;
create policy koen_calls_select on public.koen_calls for select to authenticated
  using (
    -- ★制作は 全部（★呼び出しを 組む 人）
    public.koen_can_manage(koen_id)
    -- ★★出演者は ★自分の ぶんだけ
    or exists (select 1 from public.koen_members m
                where m.id = koen_calls.member_id
                  and m.user_id = auth.uid() and m.left_at is null)
    -- ★保護者は ★自分の 子の ぶん（★裁定147）
    or exists (select 1 from public.koen_kids k
                where k.id = koen_calls.kid_id and k.guardian_user_id = auth.uid())
  );
-- ★書くのは いままでどおり 制作だけ（koen_calls_write は そのまま）

-- ★★row_id だけの 行（★場面まるごとの 呼び出し）は:
--   ★member_id も kid_id も null なので ★上の どれにも 当たりません
--   → ★制作だけが 見ます。★出演者には ★自分の 行（member_id つき）で 届きます
--   ★これは 意図どおり です（★「誰が 呼ばれたか」は 人ごとに 作られます）

-- 確かめ（試しの環境で・★なりきって）
-- ★Aから 自分の 呼び出し ＝ 1
-- ★★Aから Bの 呼び出し ＝ ★0（★前は 1 でした）
-- 制作から ＝ 全部
-- ★よその公演の人 ＝ 0
