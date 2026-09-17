-- ===========================================================================
-- ★問い ── ★その 3人は、★試しの 口ですか、★本当の お客さまですか
--
--   ★★53ef27ed ／ 40fb914f ／ 5f9cf956。
--   ★★コードからは 分かりません。★台帳に しか ありません。
--
--   ★★★読むだけ です。★1文字も 書きません。
--   ★★★お名前と メールは **頭だけ** 出します。★そのまま 出しません。
-- ===========================================================================

select left(u.id::text, 8) as id,
       -- ★★メールは 形だけ 見ます。★`+` が 付いて いれば、★同じ 方の 別の 口 です。
       left(u.email, 3) || '…' ||
         case when position('+' in u.email) > 0 then '（＋つき）' else '' end ||
         '@' || split_part(u.email, '@', 2) as メールの形,
       u.created_at as 作った日,
       u.last_sign_in_at as 最後に入った日,
       p.display_name is not null as 名前を入れているか,
       c.is_internal as 試しの口か,
       t.is_tester as 試す方か,
       (select count(*) from public.entries e where e.user_id = u.id) as 記録した日数
from auth.users u
left join public.profiles p on p.id = u.id
left join public.cohorts c on c.user_id = u.id
left join public.testers t on t.user_id = u.id
where u.id::text like '53ef27ed%'
   or u.id::text like '40fb914f%'
   or u.id::text like '5f9cf956%'
order by u.created_at;

-- ★★見分け方 ──
--   ★メールに `+` が 付いて いる ……… ★同じ 方の 別の 口（★試し の 見込み）
--   ★`試しの口か` が true ………………… ★試し
--   ★`記録した日数` が 0 ………………… ★使われて いません（★試し の 見込み）
--   ★`最後に入った日` が ずっと 前 …… ★使われて いません
--   ★★どれでも なく、★記録が 続いて いれば ── ★**本当の お客さま**です。

-- ★★`cohorts` / `testers` の 表が 無ければ、★その 2列を 外して ください。
