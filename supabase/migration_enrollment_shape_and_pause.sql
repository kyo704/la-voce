-- ============================================================================
-- ★生徒の 形と、★休会 ── ★見本 `P_sonohito`（★2026-09-19）
--
--   ★★★① 生徒に「学科・コース」を 持たせます。
--     ★★裁定 その98 は `memberships.division_id` を 決めました。
--     ★★★けれど 生徒は `memberships` に 行が ありません。
--       ★★19の 在籍の うち、★`memberships` も ある のは 10 だけ です。
--       ★★その 10 は 私が 作った 試しの 口 です（★2026-09-19 に 数えました）。
--     ★★だから `enrollments` にも 同じ 列を 置きます。
--       ★★★同じ 表を 指します。★形の 決めは 1つ の ままです。
--
--   ★★★② 休会（`paused`）を 足します。
--     ★★見本 `P_sonohito` は 3つ 出して います ── ★在籍 ／ 休会 ／ 退会。
--     ★★台帳は 2つ しか 許して いません でした（★`active` ／ `left`）。
--     ★★★`lib/orgRoster.js` に、★こう 書いて ありました ──
--       ★「入れる ことに なったら、★先に 台帳の 側を 作ります」。★その日 です。
--
--     ★★★お金に かかります。★休会の 方は **数える 人数に 入りません**。
--       ★★見本の 字 ──「休会：数える人数に入りません。日程は止まり、連絡は届きません」。
--       ★★`active` を 見て いる ところは 44か所 あります。
--         ★★どれも「`active` か どうか」で 見て います。
--         ★★★`paused` は `active` では ないので、★止まります。★足す 側の 直しは 要りません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 生徒の 形
-- ---------------------------------------------------------------------------
alter table public.enrollments
  add column if not exists division_id uuid references public.org_divisions(id);

comment on column public.enrollments.division_id is
  '生徒の 学科・コース（org_divisions を 指します）。学部は その 上から 出します。';

-- ---------------------------------------------------------------------------
-- ★② 休会
-- ---------------------------------------------------------------------------
--   ★★古い 縛りを 外してから、★新しい ものを 置きます。
--   ★★`not valid` に しません。★いまの 行は 2つ とも 通ります。
alter table public.enrollments drop constraint if exists enrollments_status_check;
alter table public.enrollments add constraint enrollments_status_check
  check (status in ('active', 'paused', 'left'));

comment on column public.enrollments.status is
  'active（在籍）／ paused（休会・数える人数に入りません）／ left（退会）。2026-09-19。';

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.enrollments'::regclass and contype = 'c';
--
--   ★`active` `paused` `left` の 3つ の はず です。
--
--   select status, count(*) from public.enrollments group by status;
--
--   ★いまは `active` と `left` だけ です。★書き換えて いません。
