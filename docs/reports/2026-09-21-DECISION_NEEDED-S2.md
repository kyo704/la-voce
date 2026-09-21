# DECISION_NEEDED ── S2（門下を開いた記録と、開く道）

★この紙は、当てたあとに型へ写し直したものです。
　S2 は 2026-09-21 に坂本さんのご承認をいただいて本番に当てました。
　以後の権限の変更は、当てる前にこの型で出します。

## DECISION_NEEDED

## 何を変えるか

裁定159 S2。`monka_read_log` に列を5つ足し、門下のやりとりを開く道
`open_monka_thread` を作ります。道は先に記録を1行書き、書けたときだけ
中身を返します（fail closed）。画面からの insert に任せません。

## SQL全文

```sql
-- ============================================================================
-- S2 ── 門下を開いた記録と、開く道（裁定159 §6・2026-09-21）
--
--   いま
--     monka_read_log はあります。決まりも2つ（insert / select）あります。
--     ところが書く処理がどこにもありません。本番は 0行です。
--     S1 で、monka_read から門下を読む道は閉じました。
--
--   ここで作るもの
--     ① 記録の列を足す（誰が・そのときの役職・どの門下・いつ・理由）
--     ② 開く道（RPC）。台帳が先に1行書き、書けたときだけ中身を返します
--        書けなければ中身を返しません（fail closed）
--
--   画面からの insert に任せません。
--     画面が呼ばなければ記録が残りません。それが今回の一件です。
--
--   update・delete の決まりを作りません（*_log の決まり）。
--
--   何度流しても同じです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列を足す
--     ★役職は「そのときの名前」を写します。post_id は後から変わります。
--     ★人が消えても記録は残します（連鎖削除にしません）。消せない記録です。
-- ---------------------------------------------------------------------------
alter table public.monka_read_log
  add column if not exists reason_kind text,
  add column if not exists reason_note text,
  add column if not exists post_id uuid,
  add column if not exists post_name_at text,
  add column if not exists name_at text;

-- ★理由は4つだけ。参照表を作りません（裁定159 Q1）。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_kind_check;
alter table public.monka_read_log
  add constraint monka_read_log_reason_kind_check check (
    reason_kind in ('jiko', 'honnin', 'horei', 'sonohoka'));

-- ★「そのほか」のときだけ短文が要ります。空では開けません。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_note_check;
alter table public.monka_read_log
  add constraint monka_read_log_reason_note_check check (
    (reason_kind <> 'sonohoka')
    or (reason_note is not null and btrim(reason_note) <> ''
        and char_length(reason_note) <= 100));

comment on column public.monka_read_log.reason_kind is
  'なぜ開いたか。jiko＝事故・苦情の調べ／honnin＝ご本人からの求め／horei＝法令に基づく求め／sonohoka＝その他（短文必須）。裁定159 Q2。';
comment on column public.monka_read_log.post_name_at is
  'そのときの役職名。post_id は後から変わるため、名前を写して残す。裁定159 Q2。';

-- ★人が消えても記録を残します（連鎖削除にしません）。
alter table public.monka_read_log
  drop constraint if exists monka_read_log_post_id_fkey;
alter table public.monka_read_log
  add constraint monka_read_log_post_id_fkey
  foreign key (post_id) references public.org_posts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- ② 開く道
--     ★先に書いてから返します。書けなければ返しません。
--     ★理由が無ければ、書く前に止まります。
--     ★一覧（名前だけ）はここを通りません。中身を返すときだけです。
-- ---------------------------------------------------------------------------
drop function if exists public.open_monka_thread(uuid, uuid, text, text);

create function public.open_monka_thread(
  p_org_id uuid,
  p_teacher_id uuid,
  p_reason_kind text,
  p_reason_note text default null
)
returns table (
  id uuid, org_id uuid, teacher_id uuid, author_id uuid,
  title text, body text, created_at timestamptz, withdrawn_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_post_id uuid;
  v_post_name text;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★できことを見ます。役割の名では見ません。
  if not public.has_can(p_org_id, 'monka_read') then
    raise exception 'NO_MONKA_READ: この役職では、門下のやりとりを開けません。'
      using errcode = 'P0001';
  end if;

  -- ★理由が無ければ、ここで止まります。記録も中身もありません。
  if p_reason_kind is null or btrim(p_reason_kind) = '' then
    raise exception 'REASON_REQUIRED: なぜ開くかを選んでください。'
      using errcode = 'P0001';
  end if;

  -- ★そのときの役職名と表示名を写します。
  select m.post_id, q.name, p.display_name
    into v_post_id, v_post_name, v_name
    from public.memberships m
    left join public.org_posts q on q.id = m.post_id
    left join public.profiles p on p.id = m.user_id
   where m.org_id = p_org_id and m.user_id = auth.uid();

  -- ★先に書きます。★縛りに引っかかれば、ここで止まり、中身は返りません。
  insert into public.monka_read_log
    (org_id, viewer_user_id, target_monka_id, reason,
     reason_kind, reason_note, post_id, post_name_at, name_at)
  values
    (p_org_id, auth.uid(), p_teacher_id, p_reason_kind,
     p_reason_kind, nullif(btrim(coalesce(p_reason_note, '')), ''),
     v_post_id, v_post_name, v_name);

  -- ★書けたときだけ、中身を返します。
  return query
    select m.id, m.org_id, m.teacher_id, m.author_id,
           m.title, m.body, m.created_at, m.withdrawn_at
      from public.org_messages m
     where m.org_id = p_org_id
       and m.teacher_id = p_teacher_id
     order by m.created_at desc;
end;
$$;

comment on function public.open_monka_thread(uuid, uuid, text, text) is
  '門下のやりとりを開く。先に monka_read_log へ1行書き、書けたときだけ中身を返す（fail closed）。理由が無ければ開かない。裁定159 S2。';

revoke all on function public.open_monka_thread(uuid, uuid, text, text) from public;
revoke all on function public.open_monka_thread(uuid, uuid, text, text) from anon;
grant execute on function public.open_monka_thread(uuid, uuid, text, text) to authenticated;
```

## 戻すSQL

```sql
-- S2 を戻す（裁定159）。★記録の行は消しません（*_log の決め）。
drop function if exists public.open_monka_thread(uuid, uuid, text, text);

alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_note_check;
alter table public.monka_read_log
  drop constraint if exists monka_read_log_reason_kind_check;
alter table public.monka_read_log
  drop constraint if exists monka_read_log_post_id_fkey;

alter table public.monka_read_log
  drop column if exists name_at,
  drop column if exists post_name_at,
  drop column if exists post_id,
  drop column if exists reason_note,
  drop column if exists reason_kind;
```

## 変える前のポリシー

`monka_read_log` の決まりは2つ。S2 では **1つも触っていません**。

```
monka_read_log_insert_self_monka_read | INSERT
  with_check: (viewer_user_id = auth.uid()) AND has_can(org_id, 'monka_read')
monka_read_log_select_master_or_self  | SELECT
  using: (viewer_user_id = auth.uid()) OR has_can(org_id, 'master')
```

update・delete の決まり …… **0**（*_log の決め）

## 変えた後のポリシー

同じです。決まりの数 2、update・delete 0。
S2 が足したのは列と道（関数）だけです。

```
（test・本番とも）
決まりの数: 2
update・delete の決まり: 0
open_monka_thread: security definer / set search_path to 'public'
  execute: authenticated のみ（anon・PUBLIC には渡していません）
```

## USINGとWITH CHECK

`monka_read_log_insert_self_monka_read` は INSERT なので WITH CHECK のみ
（USING は INSERT に存在しません）。
`monka_read_log_select_master_or_self` は SELECT なので USING のみ。

★`USING(true)` はありません。どちらも `auth.uid()` か `has_can()` で縛っています。

## 試験

道具 `tools/s2_prove.js`。実在の試しの利用者で、本当に入って本当に呼びました。

| 誰 | 何をした | 期待 | 結果 |
|---|---|---|---|
| たろう（monka_read あり） | 一覧（assignments）を引く | 記録は増えない | 増えない（log 0のまま・一覧3件） |
| たろう | 理由を空で `open_monka_thread` | 断られる | REASON_REQUIRED |
| たろう | そのほかで短文が空 | 断られる | 縛りで止まる |
| たろう | `jiko` で開く | 中身3行・記録1行増 | 3行 ／ log 0→1 |
| たろう | 記録の `post_name_at` | 残る | 残る |
| たろう | `monka_read_log` を update | 通らない | 42501 |
| たろう | `monka_read_log` を delete | 通らない | 42501 |
| 先生役（3edb38a1） | `monka_read_log` を select | 0行 | 0行 |

★較正 …… 両方あります。

```
たろう（monka_read あり・jiko で開く）: 門下の中身 → 期待 3行 → 結果 3行
たろう（開いたあと）: monka_read_log → 期待 1行 → 結果 1行
先生役 3edb38a1（monka_read なし）: monka_read_log → 期待 0行 → 結果 0行
たろう（理由が空）: 門下の中身 → 期待 0行 → 結果 0行
たろう（そのほかで短文が空）: 門下の中身 → 期待 0行 → 結果 0行
たろう（一覧だけ）: monka_read_log の増え → 期待 0行 → 結果 0行
```

合計 13 / 13。

## なりすまし

**使っていない。** BEGIN／set role／set_config／ROLLBACK を1つも使っていません。
2026-09-15 に ROLLBACK が効かず権限が残った一件があるためです（ask_ledger 決まり3）。
確かめ用の利用者を試しの台帳に作り、本当の合言葉で入りました。

## fail closed

要ります。記録を書いてから中身を返します。

試験 …… 「そのほか」で短文を空にすると、縛りが insert を止めます。

```
たろう（そのほか・短文が空）: 記録が書けない → 中身 期待 0行 → 結果 0行
```

書く処理が先、返す処理が後、という順序で書いてあります。

## 本番の影響

| 見たこと | 数 |
|---|---|
| `monka_read` を持つ役職 | 0 |
| `monka_read` を持つ人 | 0 |
| `monka_read_log` の行 | 0 |
| いま読めている人が読めなくなるか | いいえ（S2 は足すだけ。読む道は S1 で既に閉じています） |

★S2 を当てても、門下を開ける人は増えません。画面はまだ道を通っていません（S3 が残り）。

## 承認

（空のまま出します）
