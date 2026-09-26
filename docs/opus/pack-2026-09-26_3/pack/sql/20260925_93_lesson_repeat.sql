-- 20260925_93 コマの 繰り返し／予定の 出どころ（★C群 残り2画面）
-- Code の指摘（2026-09-25）:
--   ★① lessons に「繰り返し」「いつまで」が ★無い
--      ★見本の 約束:「繰り返すなら 期限を 決める」「無期限に しない」
--   ★② my_timetable に「学校／自分」の ★区別が 無い
--      ★見本の 約束:「自分の 予定は 事務から 動かせと 言わない」
--                  「事務の 画面には 学校か 自分かも 出さない」
--   ★★置き場の 無い 欄を 作らず、★画面を 保留に した ── ★正しい 判断です
-- ★91 のあと

-- ① ★コマの 繰り返し
alter table public.lessons add column if not exists repeat_kind text not null default 'once'
  check (repeat_kind in ('once','weekly','biweekly','monthly'));
alter table public.lessons add column if not exists repeat_until date;

-- ★★繰り返すなら ★期限を 決める（★無期限に しない）
alter table public.lessons drop constraint if exists lessons_repeat_needs_until;
alter table public.lessons add constraint lessons_repeat_needs_until
  check (repeat_kind = 'once' or repeat_until is not null);
-- ★理由: ★無期限の 繰り返しは ★止め方が 分からなく なります
--   ★★「いつまで」を 先に 決めれば、★止め忘れが 起きません

-- ★★期限は 遠すぎない（★1年）
alter table public.lessons drop constraint if exists lessons_repeat_until_range;
alter table public.lessons add constraint lessons_repeat_until_range
  check (repeat_until is null or repeat_until <= (scheduled_at at time zone 'Asia/Tokyo')::date + 366);
-- ★理由: ★回を 始めるのは 半年ごと（裁定183）。★1年を 超える 繰り返しは 要りません

-- ② ★予定の 出どころ（★学校か 自分か）
alter table public.my_timetable add column if not exists kind text not null default 'school'
  check (kind in ('school','self'));
-- ★★既定は school（★Code の 見立てどおり）
--   ★いま 入っている 13行は ★すべて 学校の 時間割 です
--   ★あとから 自分で 足した ものだけ 'self' に なります

-- ★★事務の 画面には ★kind を 出しません（★画面の 決まり・台帳では 止めません）
--   ★理由: ★「これは ご自分の 予定ですね」と 分かること 自体が、
--          ★★事務から「動かして」と 言う きっかけに なります
--   ★★事務に 見えるのは「★この 時間は 空いていない」だけ です

-- 確かめ（試しの環境で）
-- ★repeat_kind の 既定は 'once'／★weekly で until が 空 → 止まる
-- ★until が 1年より 先 → 止まる
-- ★my_timetable.kind の 既定は 'school'／★いまの 13行は そのまま
-- ★ほかの 値（'にせ'）→ 止まる
