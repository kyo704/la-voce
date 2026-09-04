-- ============================================================================
-- 6桁への移行の、しるし（2026-09-05）
--
--   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §5
--            lib/otpMigration.js
--
--   ★★いまは、誰にも出しません。
--     ★lib/otpMigration.js の OTP_MIGRATION_ROLLOUT_ENABLED が false です。
--     ★この列を作っても、★何も起きません。★先に器だけ作ります。
--
--   ★★埋めません（null のままにします）。
--     ★null ＝「まだ何も言っておられない」
--     ★日付が入っている ＝「ご自分で、そうなさった」
--     ★★まとめて埋めると、★その2つが見分けられなくなります。
--
--   ★「移れる方かどうか」の列は、★作りません。
--     ★パスワードをお持ちかどうかは、★auth.users を見れば分かります。
--     ★★写しを持つと、★片方だけ古くなります。
--     ★（規則：書き込んでいる値は、必ずどこかで読まれているか）
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列
-- ---------------------------------------------------------------------------

-- ★★お断りになった日。★入ったら、二度とお誘いしません。
alter table public.profiles
  add column if not exists otp_migration_declined_at timestamptz;

-- ★移り終えた日。★入ったら、パスワードはもうありません。
alter table public.profiles
  add column if not exists otp_migration_completed_at timestamptz;

-- ★どこまで進んだか。★途中で閉じられても、続きから戻れるようにします。
--   ★★explain / recovery_code / verify_otp / drop_password の並びです。
--   ★★「drop_password だけ入っていて recovery_code が無い」は、
--     ★逃げ道の無い状態です。★lib/otpMigration.js の migrationLeftUnsafe が見ます。
alter table public.profiles
  add column if not exists otp_migration_steps text[] not null default '{}';

comment on column public.profiles.otp_migration_declined_at is
  '6桁への移行を、お断りになった日。★入っていたら、二度とお誘いしない（催促しない）。';
comment on column public.profiles.otp_migration_completed_at is
  '6桁への移行を終えた日。★片道。パスワードには戻さない。';
comment on column public.profiles.otp_migration_steps is
  '移行のどこまで進んだか。★復旧コードを渡すのが先、パスワードを外すのが後。'
  '★★drop_password だけ入って recovery_code が無い状態を作らないこと。';

-- ---------------------------------------------------------------------------
-- ② 権限
--
--   ★profiles には、すでに UPDATE の権限と方針があります。
--   ★★ですが、★この3つを、★本人に書かせないこと。
--     ★otp_migration_completed_at を自分で入れられると、
--       ★「移り終えた」ことにできてしまいます。
--     ★★書くのは、★サーバの route（service_role）だけです。
--
--   ★★列を渡さないことは、★取り上げることではありません。
--     ★いま profiles の UPDATE が、★表ごと渡されているかを、先に見ます。
--     ★渡されていたら、★剥がしてから、★列を並べ直す必要があります。
--     ★（2026-09-03、memberships で同じ穴が見つかりました）
--
--   ★★下の④-3 を見てから、★⑤を当てるかどうか決めてください。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ③ 索引は作りません
--
--   ★★数える用の索引を作らないこと。
--     ★「何人が断ったか」を速く出す必要は、ありません。
--     ★人数を速く出せる形は、★人数を見にいく癖を作ります。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------

-- ④-1 ★3つとも、ちゃんと出来たか
select column_name as "列", data_type as "型", column_default as "既定"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('otp_migration_declined_at',
                       'otp_migration_completed_at',
                       'otp_migration_steps')
 order by column_name;

-- ④-2 ★★埋まっていないこと（★null のままであること）
--      ★「まだ何も言っておられない」が、★見分けられる状態です
select
  count(*) filter (where otp_migration_declined_at is not null) as "断った（0のはず）",
  count(*) filter (where otp_migration_completed_at is not null) as "移り終えた（0のはず）",
  count(*) filter (where otp_migration_steps <> '{}') as "途中（0のはず）"
  from public.profiles;

-- ④-3 ★★profiles の UPDATE が、★表ごと渡されていないか
--      ★column_name が入っている行だけなら、★列ごとに渡されています（よい形）
--      ★★column_name が空の行があれば、★表ごと渡されています（★危ない）
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee in ('anon', 'authenticated')
 order by grantee, privilege_type;

-- ④-4 ★列ごとに渡されているものの一覧
--      ★★この一覧に otp_migration_* が出てきたら、★外してください
select grantee as "相手", column_name as "列", privilege_type as "権限"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee in ('anon', 'authenticated')
   and privilege_type = 'UPDATE'
 order by grantee, column_name;

-- ---------------------------------------------------------------------------
-- ⑤ ★★④-3 で「表ごと」だったときだけ、当ててください
--
--   ★★grant は足し算です。★剥がしにはなりません。
--     ★先に revoke してから、★列を並べ直します。
--     ★★順番を逆にすると、★広いほうが黙って勝ちます（2026-09-03 の穴）。
--
--   ★★ここは、★いまの profiles の列の一覧が要ります。
--     ★私は本番の列を見ていません。★中身を書き出していません。
--     ★★お手数ですが、④-3 と ④-4 の結果をお知らせください。
--       ★そのうえで、★正しい revoke ＋ grant を書き出します。
--
--   ★★分からないまま revoke しないこと。★全員が保存できなくなります。
-- ---------------------------------------------------------------------------

-- ============================================================================
-- ★台帳への登録
--   01 削除処理    ★profiles の列なので、★すでに入っています（行は増えません）
--   02 バックアップ ★profiles の中です（行は増えません）
--   04 書き出し    ★★入れる。★本人の履歴です（いつ断ったか・いつ移ったか）
--   07 約束        ★「一度お断りになったら、二度とお誘いしません」を書くこと
-- ============================================================================
