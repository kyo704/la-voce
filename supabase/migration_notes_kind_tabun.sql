-- ============================================================================
-- ★ノートの 帯に「たぶん これかも」を 足します（★2026-09-25・C群）
--
--   ★★見本 `nKeiko()` は、★稽古の 中に 2つの 札を 置いて います ──
--     ★「稽古の メモ」と「たぶん これかも」。
--   ★★`SC['たぶん本文']` が その 本文の 画面 です。
--     ★「★自分で 気づいたことを、自分の ことばで 書く ところ です。
--       ★アプリは 候補を 出しません。当たっているかも 言いません。」
--
--   ★★★なぜ 帯を 分けるか
--     ★稽古の メモと 混ぜると、★一覧が 混ざります。★別の 一覧 です。
--     ★★`lib/notes.js` の 決め「★タブは 増やしません」は 守ります ──
--       ★上の 帯は 4つの まま で、★稽古の **中の 札** に します。
--
--   ★★いま ある 行に 触りません ── ★`notes` 23行は ぜんぶ `repertoire` です。
--     ★★足すだけ です。★既定（`'practice'`）も 変えません。
--
--   ★★決まり（RLS）も 変えません ── ★`notes` は 本人だけ です
--     （`notes_select_own` ／ `insert` ／ `update` ／ `delete` ぜんぶ `auth.uid() = user_id`）。
--     ★先生にも 事務にも 読む 道が ありません。★そのまま です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

do $$
begin
  -- ★いまの しばりを 外して、★同じ 名前で 作り直します。
  --   ★★`drop ... if exists` なので、★2度 流しても 落ちません。
  alter table public.notes drop constraint if exists notes_kind_check;

  alter table public.notes
    add constraint notes_kind_check
    check (kind = any (array['practice'::text, 'repertoire'::text,
                            'studio'::text, 'clinic'::text, 'tabun'::text]));
end $$;

-- ★★確かめ ── ★`tabun` が 通る ように なった こと。
--   ★★入れて、★すぐ 消します。★行は 残しません。
do $$
declare
  v_user uuid;
  v_id uuid;
begin
  select id into v_user from auth.users limit 1;
  if v_user is null then
    raise notice '★人が 1人も いません。確かめを 飛ばします';
    return;
  end if;
  insert into public.notes (user_id, kind, body)
  values (v_user, 'tabun', '★移行の 確かめ。すぐ 消します')
  returning id into v_id;
  delete from public.notes where id = v_id;
  raise notice '★tabun が 通りました（★入れて 消しました）';
end $$;
