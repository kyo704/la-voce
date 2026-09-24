-- 20260924_77 カレンダーの 購読の 切り替えを 作る（裁定195）
-- ★仕組みは もう できて います（app/api/calendar/[token]・lib/ics.js・
--   my_calendar_items・calendar_tokens・rotate_calendar_token）。
-- ★足りないのは ★住所を 見せる 画面 と、★その 切り替え だけ です。
-- ★裁定195: 「機能の 切り替えで 切っておく。出発前に 坂本さんが 1度 試してから 開ける」
-- ★★切った まま 入れます。★開けるのは 坂本さんの お手 です。

insert into public.feature_flags (key, title, note, state)
values ('cal_sub', 'カレンダーの 購読',
        '★出発前に 坂本さんが 1度 試してから 開ける（裁定195）。★開けるまでは「1件ずつ」を 出す',
        'off')
on conflict (key) do update
  set title = excluded.title,
      note  = excluded.note;
-- ★★`state` は 触りません。★開けた あとに これを 流しても、★閉じません。
