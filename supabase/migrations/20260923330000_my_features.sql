-- ★★★いまの 人に 見える 機能を、★1回で 返します（★2026-09-23・Code）。
--
--   ★★わけ ── ★`feature_on(key)` は 1つの 鍵に 1回 です。★鍵は いま 10 あります。
--     ★画面を 開く たびに 10回 尋ねる ことに なります。
--   ★★★決めは 変えません。★`feature_on` を そのまま 呼びます。
--     ★ここでは「まとめて 尋ねる 道」を 1本 足すだけ です。
--
--   ★★無い 鍵は false です（★`feature_on` が そう 決めて います）。
--     ★ここでも 同じ です ── ★並ぶのは `feature_flags` に ある 鍵 だけ。

create or replace function public.my_features()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_object_agg(f.key, public.feature_on(f.key)), '{}'::jsonb)
    from public.feature_flags f;
$$;
revoke all on function public.my_features() from public, anon;
grant execute on function public.my_features() to authenticated;
