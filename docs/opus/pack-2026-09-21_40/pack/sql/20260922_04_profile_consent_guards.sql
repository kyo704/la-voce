-- 20260922_04 サーバ専用の列と、同意の日時（裁定167 A3・A4）
-- ★壊さない形: 同意の日時は「拒否」ではなく「台帳がいまの時刻に置き換える」（画面が日時を送っていても動く）
-- ★拒否するのは LINE の連携と登録日だけ。★CHECK_FIRST: 画面が line_user_id・line_link_code・created_at を直接書いていないか（書いていればサーバの関数へ移してから当てる）

-- guard-ok: 直すときだけ動く引き金（UPDATE のみ）。退会は profiles ごと消えるので 詰まらない
create or replace function public.profiles_guard_server_only_columns()
returns trigger language plpgsql set search_path to '' as $function$
declare guarded text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;
  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access then guarded := 'teacher_beta_access';
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  elsif new.is_internal is distinct from old.is_internal then guarded := 'is_internal';
  elsif new.character_points_spent is distinct from old.character_points_spent then guarded := 'character_points_spent';
  -- ★足した（裁定167 A3）
  elsif new.line_user_id is distinct from old.line_user_id then guarded := 'line_user_id';
  elsif new.line_link_code is distinct from old.line_link_code then guarded := 'line_link_code';
  elsif new.created_at is distinct from old.created_at then guarded := 'created_at';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  -- ★同意の日時は、利用者が入れた値を使わず、いまの時刻にする（後から日付を書き換えさせない）
  if new.consent_health_data_at is distinct from old.consent_health_data_at and new.consent_health_data_at is not null then
    new.consent_health_data_at := now(); end if;
  if new.consent_health_data_withdrawn_at is distinct from old.consent_health_data_withdrawn_at and new.consent_health_data_withdrawn_at is not null then
    new.consent_health_data_withdrawn_at := now(); end if;
  if new.consent_stats_use_at is distinct from old.consent_stats_use_at and new.consent_stats_use_at is not null then
    new.consent_stats_use_at := now(); end if;
  if new.reflux_care_consent_at is distinct from old.reflux_care_consent_at and new.reflux_care_consent_at is not null then
    new.reflux_care_consent_at := now(); end if;
  if new.guardian_consent_declared_at is distinct from old.guardian_consent_declared_at and new.guardian_consent_declared_at is not null then
    new.guardian_consent_declared_at := now(); end if;

  return new;
end;
$function$;

-- 同意の記録・未成年の申告の日時も、台帳が入れる
create or replace function public.force_now_on_consent_rows()
returns trigger language plpgsql set search_path to '' as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_table_name = 'consent_records' then
      new.granted_at := now(); new.created_at := now(); new.withdrawn_at := null;   -- 撤回は別の操作（update）で
    elsif tg_table_name = 'minor_billing_consents' then
      new.declared_at := now();
    end if;
  end if;
  return new;
end $$;
drop trigger if exists consent_records_force_now on public.consent_records;
create trigger consent_records_force_now before insert on public.consent_records for each row execute function public.force_now_on_consent_rows();
drop trigger if exists minor_billing_consents_force_now on public.minor_billing_consents;
create trigger minor_billing_consents_force_now before insert on public.minor_billing_consents for each row execute function public.force_now_on_consent_rows();

-- 確かめ（実在の試しの利用者で）
-- 自分の profiles.line_user_id を update → SERVER_ONLY_COLUMN
-- consent_health_data_at を '2020-01-01' で update → 行の値は いまの時刻
-- consent_records を granted_at='2020-01-01' で insert → granted_at は いまの時刻
