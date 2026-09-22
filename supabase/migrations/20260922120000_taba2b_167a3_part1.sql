-- ★束2b ① ── 裁定167 A3 の うち、★画面が 1度も 書いて いない 5列（2026-09-22）
--
--   ★★★A3 は 9列 を 挙げて います。★そのうち 5列 は、
--     ★画面・サーバの どこからも **書かれて いません**（★下の 確かめ）。
--     ★★だから いま 足せます。★壊れる ところが ありません。
--
--   ★★★残る 4列 は、★いま 画面が 書いて います。
--     ★先に 関数を 作らないと、★足した 瞬間に 使えなく なります。
--     ★★別の 移行に します（★`20260922130000_…` の 予定）。
--
--   ★確かめ方（2026-09-22）── ★註と 字を 落として から、
--     `.update({… 列: …})` / `.insert({… 列: …})` を 数えました。
--
--     guardian_consent_declared_at    0か所
--     consent_health_data_at          0か所
--     reflux_care_consent_at          0か所
--     is_under_18                     0か所
--     created_at                      0か所
--
--     line_user_id                    3か所  ★別の 移行へ
--     line_link_code                  2か所  ★別の 移行へ
--     consent_health_data_withdrawn_at 2か所 ★別の 移行へ
--     consent_stats_use_at            1か所  ★別の 移行へ
--
--   ★★何度 流しても 同じに なります。

begin;

create or replace function public.profiles_guard_server_only_columns()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  guarded text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;

  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access
    then guarded := 'teacher_beta_access';
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  elsif new.is_internal is distinct from old.is_internal then guarded := 'is_internal';
  elsif new.character_points_spent is distinct from old.character_points_spent
    then guarded := 'character_points_spent';
  -- ★★★ここから 下が、★2026-09-22 に 足した ぶん です（★裁定167 A3）。
  --   ★同意の 日時 …… ★あとから 書き換えられると、★法20条2項の 証しが 弱く なります。
  elsif new.consent_health_data_at is distinct from old.consent_health_data_at
    then guarded := 'consent_health_data_at';
  elsif new.reflux_care_consent_at is distinct from old.reflux_care_consent_at
    then guarded := 'reflux_care_consent_at';
  --   ★保護者の 同意の「申告した 日」…… ★申告 そのものは ご本人の もの ですが、
  --     ★★日時は サーバが 入れます（★準則の とおり）。
  elsif new.guardian_consent_declared_at is distinct from old.guardian_consent_declared_at
    then guarded := 'guardian_consent_declared_at';
  --   ★年齢の 区分 …… ★変えた 跡が 残りません。★答え直しは 記録を 1行 残す 形に します。
  elsif new.is_under_18 is distinct from old.is_under_18
    then guarded := 'is_under_18';
  --   ★登録の 日 …… ★変えられると、★いつから の 人かが 分からなく なります。
  elsif new.created_at is distinct from old.created_at
    then guarded := 'created_at';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$function$;

commit;
