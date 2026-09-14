# No.018 第2段 ── `get_invitation_teacher` を 広げる
全137行 / 末尾は「★★③が 通れば、★締める 紙を お出しします。」
全00行 / 末尾は「★③が 通れば、★締める 紙を お出しします。」

★2026-09-14　★裁定（★Opus・坂本さん 承認）

★★新しい 関数は 作りません。★もとから ある ものを 広げます。

---

## ① 流す 前に 見る（★読むだけ）

```sql
-- ★★いまの 中身。★使える コードかの 判定は まだ ありません。
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_invitation_teacher';

-- ★★読む 決まり。★この 紙では **まだ 締めません**。
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
order by cmd, policyname;
```

## ② 流す

```sql
create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code    text;
  v_teacher uuid;
  v_used    timestamptz;
  v_exp     timestamptz;
  v_who     jsonb;
begin
  -- ★★ログインして いない 人には、★何も 返しません。
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- ★★しぼらずに 引きます。★使用済み・期限切れも 見分ける ため です。
  select i.teacher_id, i.used_at, i.expires_at
    into v_teacher, v_used, v_exp
  from public.teacher_invitations i
  where i.code = v_code
  limit 1;

  if v_teacher is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_used is not null then
    return jsonb_build_object('ok', false, 'reason', 'used');
  end if;
  if v_exp is not null and v_exp <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  -- ★★返す 列を しぼります。★`select *` に しないこと。
  select jsonb_build_object(
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school',       nullif(trim(coalesce(p.school, '')), '')
         )
    into v_who
  from public.profiles p
  where p.id = v_teacher;

  return jsonb_build_object(
    'ok', true,
    'teacher', coalesce(v_who, jsonb_build_object(
                 'display_name', null, 'school', null))
  );
end;
$$;

revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

comment on function public.get_invitation_teacher(text) is
  '★招待コードから、先生の 名前だけを 返します。'
  '★2026-09-14（No.018）、使える コードかの 判定も 返す ように 広げました。'
  '★画面は これを 通します。teacher_invitations を 直に 読みません。';
```

## ③ 流した あとに 見る

```sql
-- ★★(1) 無い コード
select public.get_invitation_teacher('ZZZZZZZZ');
--   → {"ok": false, "reason": "not_found"}

-- ★★(2) 生きて いる コード（★1つ ご用意ください）
-- select public.get_invitation_teacher('<生きて いる コード>');
--   → {"ok": true, "teacher": {"display_name": "…", "school": "…"}}

-- ★★(3) 匿名に 渡って いない こと
select has_function_privilege('anon',
  'public.get_invitation_teacher(text)', 'execute') as 匿名が呼べる;
--   → false
```

## ★★画面の ほうは、★同じ 便で 直して あります

★★`components/VocalTracker.jsx` の `handleLookupInviteCode`。

★★`from("teacher_invitations").select(...)` を **やめました**。
★★関数 1本だけを 通します。

★★★古い 形でも 動きます。
　★★紙を 流す 前に 画面だけ 先に 出ても、★壊れません。
　★★`ok` の 有無で 見分けます。

★★「無い」と「使用済み」は、★**同じ 一文**に します。
　★★分けると、★コードを 総当たりして
　　★「その コードは 在る が 使用済み」と 分かって しまいます。

## ★まだ 締めて いません

★★読む 決まりは、★この 紙では 触りません。

★★順番 ──
1. この 紙を 流す
2. 画面を 出す（★配備）
3. ★実際に 招待コードで 入って みる
4. ★そのあとで、★別の 紙で 締める

★★③が 通れば、★締める 紙を お出しします。
