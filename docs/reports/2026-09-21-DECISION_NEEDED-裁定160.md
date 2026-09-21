# DECISION_NEEDED ── 裁定160（役職の できること を変えた履歴）

## DECISION_NEEDED

## 何を変えるか

裁定160。`org_post_perm_log` を作り、`org_posts` に引き金を置きます。
役職の「できること」か名前が変わったとき、台帳の側で1行残します。
呼ぶ側に任せません（裁定159 と同じ穴を作らないため）。

★いま本番は、役職の中身が変わった履歴を **1行も残していません**。
2026-09-21 の STEP_2 で、過去に `monka_read` が付いていたかを確かめられませんでした。

## SQL全文

```sql
-- ============================================================================
-- 役職の「できること」を変えた履歴（裁定160・2026-09-21）
--
--   なぜ引き金（trigger）にするか
--     役職の「できること」を1つ入れると、その役職の人 **全員** の権限が変わります。
--     人に役職を渡すより影響が大きいのに、変わったことがどこにも残りません。
--     呼ぶ側に任せると、裁定159 と同じく「呼ばれなければ残らない」になります。
--     だから台帳の側で、必ず1行残します。
--
--   門下を読む（monka_read）は「普段は切ってある」前提の できこと です。
--   入れた・切ったの記録が無いと、その前提を確かめられません。
--     ★2026-09-21、実際に確かめられませんでした（STEP_2）。
--
--   *_log の決まり: update・delete のポリシーを作りません。
--   何度流しても同じです。
-- ============================================================================

create table if not exists public.org_post_perm_log (
  id uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default now(),
  -- ★誰が。台帳の処理（引き金だけで動いたとき）は null です。
  changed_by uuid,
  -- ★null のときに「誰も分からない」と「仕組みがした」を言い分けます。
  changed_by_kind text not null default 'person'
    check (changed_by_kind in ('person', 'system')),
  org_id uuid not null,
  -- ★役職が消えても記録は残します（連鎖削除にしません）。消せない記録です。
  post_id uuid,
  post_name_at text,
  perms_before jsonb,
  perms_after jsonb,
  -- ★増えたもの・減ったもの。読む人が差を数えずに済みます。
  added text[] not null default '{}',
  removed text[] not null default '{}',
  op text not null check (op in ('insert', 'update', 'delete'))
);

comment on table public.org_post_perm_log is
  '役職の できること が変わった記録。引き金で残す。update・delete のポリシーを作らない（裁定160）。';

create index if not exists org_post_perm_log_org_idx
  on public.org_post_perm_log (org_id, changed_at desc);
create index if not exists org_post_perm_log_post_idx
  on public.org_post_perm_log (post_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- 決まり ── 読むのは post か master を持つ人だけ。
--   ★利用者が直に insert する道を作りません。入れるのは引き金だけです。
-- ---------------------------------------------------------------------------
alter table public.org_post_perm_log enable row level security;

drop policy if exists org_post_perm_log_select on public.org_post_perm_log;
create policy org_post_perm_log_select on public.org_post_perm_log
  for select using (
    public.has_can(org_id, 'post') or public.has_can(org_id, 'master')
  );

-- ★みなに渡しません。insert は引き金（security definer）だけが通ります。
revoke insert, update, delete on public.org_post_perm_log from anon;
revoke insert, update, delete on public.org_post_perm_log from authenticated;
grant select on public.org_post_perm_log to authenticated;

-- ---------------------------------------------------------------------------
-- 引き金
--   ★perms か 名前 が変わったときだけ1行。ほかの列だけの変更では残しません。
--     （sort_order を並べ替えただけで履歴が埋まると、読めなくなります）
-- ---------------------------------------------------------------------------
create or replace function public.log_org_post_perm()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_added text[];
  v_removed text[];
  v_who uuid;
begin
  v_who := auth.uid();

  if tg_op = 'INSERT' then
    v_before := null; v_after := new.perms;
  elsif tg_op = 'DELETE' then
    v_before := old.perms; v_after := null;
  else
    -- ★perms も 名前も 変わって いなければ、★何も 残しません。
    if old.perms is not distinct from new.perms
       and old.name is not distinct from new.name then
      return new;
    end if;
    v_before := old.perms; v_after := new.perms;
  end if;

  -- ★増えた もの ── ★後に true で、★前に true で ない もの。
  select coalesce(array_agg(k order by k), '{}')
    into v_added
    from jsonb_object_keys(coalesce(v_after, '{}'::jsonb)) k
   where coalesce((v_after ->> k)::boolean, false)
     and not coalesce((v_before ->> k)::boolean, false);

  select coalesce(array_agg(k order by k), '{}')
    into v_removed
    from jsonb_object_keys(coalesce(v_before, '{}'::jsonb)) k
   where coalesce((v_before ->> k)::boolean, false)
     and not coalesce((v_after ->> k)::boolean, false);

  insert into public.org_post_perm_log
    (changed_by, changed_by_kind, org_id, post_id, post_name_at,
     perms_before, perms_after, added, removed, op)
  values
    (v_who,
     case when v_who is null then 'system' else 'person' end,
     coalesce(new.org_id, old.org_id),
     coalesce(new.id, old.id),
     coalesce(new.name, old.name),
     v_before, v_after, v_added, v_removed, lower(tg_op));

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

comment on function public.log_org_post_perm() is
  'org_posts の perms・名前が変わったときに1行残す。裁定160。呼ぶ側に任せない。';

revoke all on function public.log_org_post_perm() from public;
revoke all on function public.log_org_post_perm() from anon;
revoke all on function public.log_org_post_perm() from authenticated;

drop trigger if exists trg_log_org_post_perm on public.org_posts;
create trigger trg_log_org_post_perm
  after insert or update or delete on public.org_posts
  for each row execute function public.log_org_post_perm();
```

## 戻すSQL

```sql
-- 裁定160 を戻す。★記録の行は消しません（*_log の決め）。
drop trigger if exists trg_log_org_post_perm on public.org_posts;
drop function if exists public.log_org_post_perm();
-- ★表は残します。消すと、残した記録まで消えます。
-- ★本当に消すときだけ、下の1行を手で外してください。
-- drop table if exists public.org_post_perm_log;
```

## 変える前のポリシー

`org_post_perm_log` は **在りません**（これから作る表です）。

`org_posts` の決まりは触りません。引き金を足すだけです。

## 変えた後のポリシー

```
org_post_perm_log_select | SELECT
  using: has_can(org_id, 'post') OR has_can(org_id, 'master')

insert / update / delete の決まり: 0
　★利用者が直に入れる道を作りません。入れるのは引き金だけです。
　★anon と authenticated から insert・update・delete を revoke しています。
　★authenticated には select だけ grant しています。
```

## USINGとWITH CHECK

`org_post_perm_log_select` は SELECT なので USING のみ（WITH CHECK は存在しません）。
★`USING(true)` はありません。`has_can()` で縛っています。

INSERT のポリシーは **作りません**。だから WITH CHECK もありません。
入れるのは `security definer` の引き金だけです。

## 試験

道具 `tools/ruling160_prove.js`。実在の試しの利用者で、本当に入って引きました。

```
たろう（post あり）: できことを1つ入れる → 期待 1行 → 結果 1行
たろう: 増えたものに monka_read → 期待 1行以上 → 結果 1行以上
たろう: 切る → 期待 1行 → 結果 1行
たろう: 減ったものに monka_read → 期待 1行以上 → 結果 1行以上
たろう: 名前だけ変える → 期待 1行 → 結果 1行（増えも減りも空）
たろう: ほかの列だけ変える → 期待 0行の増え → 結果 0行
たろう: 役職を作る → 期待 1行 → 結果 1行
たろう: 役職を消す → 期待 1行 → 結果 1行（その時点の perms が残る）
たろう（post あり）: log を読む → 期待 1行以上 → 結果 6行
学生1 6fdc5121（post も master も無い）: log を読む → 期待 0行 → 結果 0行
たろう: log を update → 期待 0行 → 結果 0行（42501）
たろう: log を delete → 期待 0行 → 結果 0行（42501）
```

★較正 …… 読めるはずの人（6行）と、読めないはずの人（0行）の両方があります。

合計 14 / 14。

## なりすまし

**使っていない。** BEGIN／set role／set_config／ROLLBACK を1つも使っていません。
2026-09-15 に ROLLBACK が効かず権限が残った一件があるためです（ask_ledger 決まり3）。

## fail closed

★この工事には要りません。理由を書きます。

`monka_read` の道は「読むために記録する」ので、記録が先でした。
こちらは「変えたことを残す」引き金です。引き金が失敗すれば、**変更そのものが巻き戻ります**
（after trigger が例外を投げると、その文ごと失敗します）。
つまり「記録が残らないのに変わった」は起こりません。順序ではなく、同じ処理の中にあります。

## 本番の影響

| 見たこと | 数 |
|---|---|
| 役職の数 | 41 |
| `post` か `master` を持つ人（log を読める人） | 15 |
| `org_post_perm_log` の行 | 0（これから作る表） |
| いま読めている人が読めなくなるか | いいえ（足すだけ。既存の決まりを1つも触りません） |
| 役職を変える操作が止まるか | いいえ（引き金が通れば、いままでどおり通ります） |

★履歴の無い期間 …… 2026-09-11（役職を作った日）〜 この工事を当てる日。
修正の記録に書き足します。

## 承認

（空のまま出します）
