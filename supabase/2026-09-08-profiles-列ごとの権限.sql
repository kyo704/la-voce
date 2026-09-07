-- profiles の権限を、表ぜんたいから、列ごとに絞ります（2026年9月8日）
--
--   ★読むだけの照会も入れてあります。★順に流してください。
--   ★何度流しても大丈夫です。
--
--   ★★BEGIN / ROLLBACK は使っていません。
--     ★Supabase の SQL エディタでは、★戻らないことがあります。
--     ★2026-09-05 に、★それで管理者の印が残りました。
--
--   ★★いまは、トリガー1枚だけで守っています。
--     ★これを2枚にします（Opus）。
--     　「★ポリシーの不在は1枚の板。★権限の剥奪と合わせて2枚にすること。」
--
--   ★★数え方について
--     ★「書いてよい列」を数え上げる形にしていません。
--     ★1つ数え落とすと、★利用者の保存が、その場で失敗するからです。
--     ★代わりに「渡さない列」だけを数え、★残りぜんぶを渡します。
--     ★★数え落としても、★いまと同じ状態に留まります。安全側です。
--     ★一覧の正は lib/profileServerOnlyColumns.js です。
--
--   ★★2026-09-07、★character_points_spent を足しました（8列）。
--     ★持ちぶんは「記録から作った合計 − この数」で出しています。
--     ★この数を小さく書けば、★記録しないままポイントが増えました。
--     ★足すのは app/api/character/buy だけです。

-- ===========================================================================
-- ① いまの状態を見ます（★読むだけ）
-- ===========================================================================
select grantee as 相手, privilege_type as 権限
from information_schema.table_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- ★ここに authenticated の UPDATE が出ていれば、★表ぜんたいに権限があります。
--   ★列ごとの GRANT を足しても、★この広いほうが勝ちます。★先に外します。

select count(*) as 列ごとの権限の数
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- ===========================================================================
-- ② 渡さない列が、実在するか（★読むだけ・★名前の打ち間違いを見つけます）
-- ===========================================================================
with 渡さない(列) as (values
    'is_admin',
    'is_tester',
    'is_internal',
    'cohort',
    'teacher_beta_access',
    'deleted_at',
    'reauth_at',
    'character_points_spent'
)
select 列, case when c.column_name is null then '★ありません' else 'あります' end as 表にあるか
from 渡さない
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = 'profiles'
 and c.column_name = 渡さない.列;

-- ★★「★ありません」が1つでも出たら、★ここで止めてください。
--   ★名前が変わったか、★打ち間違いです。★そのまま進めると、守れません。

-- ===========================================================================
-- ③ 表ぜんたいの UPDATE を外し、列ごとに渡し直します
-- ===========================================================================
--   ★★順番が大事です。★先に外さないと、★広いほうが勝ちます。
--     ★2026-09-05 に、★これで一度つまずきました。

do $$
declare
  cols text;
  n int;
begin
  -- ★★まず外します。
  revoke update on public.profiles from authenticated;

  -- ★★渡す列を、その場で数えます。★手で並べません。
  --   ★列が増えても、★この SQL を流し直せば追いつきます。
  select string_agg(quote_ident(column_name), ', ' order by column_name),
         count(*)
    into cols, n
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name not in (
    'is_admin',
    'is_tester',
    'is_internal',
    'cohort',
    'teacher_beta_access',
    'deleted_at',
    'reauth_at',
    'character_points_spent'
    );

  if cols is null then
    raise exception '渡す列が1つもありません。止めます。';
  end if;

  execute format('grant update (%s) on public.profiles to authenticated', cols);
  raise notice '★% 列に、UPDATE を渡しました', n;
end $$;

-- ===========================================================================
-- ④ 確かめます（★読むだけ）
-- ===========================================================================
--   ★★2つとも空であること。★これが確かめ方です。

-- ④-1 渡してはいけないのに、渡っているもの
select column_name as 渡ってしまっている列
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
  and column_name in (
    'is_admin',
    'is_tester',
    'is_internal',
    'cohort',
    'teacher_beta_access',
    'deleted_at',
    'reauth_at',
    'character_points_spent'
  );

-- ④-2 渡すべきなのに、渡っていないもの
select c.column_name as 渡っていない列
from information_schema.columns c
where c.table_schema = 'public' and c.table_name = 'profiles'
  and c.column_name not in (
    'is_admin',
    'is_tester',
    'is_internal',
    'cohort',
    'teacher_beta_access',
    'deleted_at',
    'reauth_at',
    'character_points_spent'
  )
  and not exists (
    select 1 from information_schema.column_privileges p
    where p.table_schema = 'public' and p.table_name = 'profiles'
      and p.grantee = 'authenticated' and p.privilege_type = 'UPDATE'
      and p.column_name = c.column_name
  );

-- ④-3 表ぜんたいの UPDATE が、消えているか
select coalesce(string_agg(privilege_type, ', '), '（無し。これが正しい状態です）')
       as 表ぜんたいに残っている権限
from information_schema.table_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- ★★④-1 と ④-2 が両方とも空で、★④-3 が「無し」なら、成功です。
