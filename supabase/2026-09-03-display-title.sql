-- ============================================================================
-- 表示の肩書き（display_title）2026-09-03
--
--   出どころ docs/opus/lavoce-仕様-表示肩書き-display_title（9月4日）.md
--
--   ★これは「教室が、その人の呼び方を決める」ものです。
--     ★本人が、自分で名乗るものではありません。
--
--   ★★表ぜんぶの UPDATE 権限を剥がし、★role だけを与え直します（②.5）。
--     ★★「与えない」だけでは足りません。★表ぜんぶの権限が上を行きます。
--     ★2026-09-03、実機でそれが見つかりました。★下の ②.5 を読んでください。
--     ★memberships の UPDATE ポリシー（memberships_update_role_management）は
--       ★auth.uid() = user_id を、設計として許しています。
--       ★役割の変更は WITH CHECK の role_rank で正しく止まっています。
--     ★★ですが display_title に権限を与えると、★同じ道で
--       ★本人が自分の肩書きを書けてしまいます。
--     ★ポリシーは1文字も変えません。★書ける道を、関数1本にします。
--
--   ★何度実行しても、同じ結果になります。★行の中身には触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'memberships'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ① 列を足します
--
--   ★display_title_updated_by … 他人の見え方を、他人が変えられる機能です。
--     ★履歴の表は、20字の肩書きには重すぎます。
--     ★「最後に誰が変えたか」が無いのは弱すぎます。★2列で折衷します。
--   ★★台帳03（auth 参照）に登録が要ります。新しい参照点です。
-- ---------------------------------------------------------------------------
alter table public.memberships
  add column if not exists display_title text,
  add column if not exists display_title_updated_by uuid references auth.users on delete set null,
  add column if not exists display_title_updated_at timestamptz;

comment on column public.memberships.display_title is
  '教室が決める、その人の呼び方。★null は未設定。★空文字を入れないこと。'
  '★書けるのは set_member_display_title だけ（列の UPDATE 権限は与えていない）。';

-- ---------------------------------------------------------------------------
-- ② 形の制約
--
--   ★画面でも止めますが、★それは親切であって、守りではありません。
--   ★空文字を入れさせないこと。★「未設定」と「明示的に空」を分けるためです。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'display_title_shape'
                    and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships
      add constraint display_title_shape check (
        display_title is null
        or ( char_length(display_title) between 1 and 20
             and display_title = btrim(display_title)
             and display_title !~ '[[:cntrl:]]' )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ②.5 ★表ぜんぶの UPDATE 権限を、剥がします（★これが要でした）
--
--   ★2026-09-03、実機で穴が見つかりました。
--     ★このファイルは「列ごとの権限を与えない」だけで足りると考えていました。
--     ★★足りません。★authenticated は、★表ぜんぶの UPDATE を持っていました。
--     ★表ぜんぶの権限は、★列ごとの指定より★強いです。
--     ★★講師の役の人が、直の UPDATE で自分の display_title を書けました。
--       ★関数も、オーナーの確認も、禁止語も、★全部素通りでした。
--
--   ★★与えないことは、剥がすことではありません。
--     ★先に表ぜんぶを剥がし、★それから要る列だけを与えます。
--     ★org_events と lessons では、この順で書いていました
--       （migration_identity_columns_immutable.sql:55-63）。
--     ★★同じ形を、ここで書き落としました。
--
--   ★role だけを、与え直します。
--     ★handleChangeRole（VocalTracker.jsx:10377）が使います。
--     ★display_title の3列は、★どこにも与えません。★関数だけが書きます。
-- ---------------------------------------------------------------------------
revoke update on public.memberships from authenticated;
grant update (role) on public.memberships to authenticated;

-- ★anon には、そもそも用がありません。
revoke all on public.memberships from anon;

-- ---------------------------------------------------------------------------
-- ③ 書ける道は、この関数だけ
--
--   ★呼んだ人が、その教室のオーナー・責任者であることを、★中で確かめます。
--   ★入れられない語も、★中で見ます。★画面だけで止めると、API を直に叩かれます。
--   ★空白だけなら null にします。★空文字を入れません。
--   ★★role には一切触れません。★肩書きで権限は変わりません。
-- ---------------------------------------------------------------------------
create or replace function public.set_member_display_title(
  p_membership_id uuid,
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_user uuid;
  v_title text;
  w text;
  -- ★lib/displayTitle.js の配列と、同じ語です。
  --   ★2か所にありますが、★片方は画面の親切、★もう片方が守りです。
  --   ★増やすときは、★必ず両方に足してください。
  v_qualifications text[] := array[
    '医師','医者','ドクター','Dr','Doctor','歯科医',
    '看護師','薬剤師','言語聴覚士','理学療法士','作業療法士',
    '管理栄養士','栄養士','保健師','助産師','公認心理師'];
  v_impersonation text[] := array[
    '運営','公式','Woolsong','ウールソング','サポート','事務局','管理者','システム'];
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select org_id, user_id into v_org, v_user
    from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'MEMBERSHIP_NOT_FOUND';
  end if;

  -- ★呼んだ人が、その教室のオーナー・責任者であること。
  --   ★本人であっても、★それだけでは書けません。
  if not exists (
    select 1 from public.memberships m
     where m.org_id = v_org and m.user_id = auth.uid()
       and m.role in ('owner','admin')
  ) then
    raise exception 'NOT_ORG_ADMIN';
  end if;

  -- ★空白だけなら null。★空文字を入れません。
  v_title := nullif(btrim(coalesce(p_title, '')), '');

  if v_title is not null then
    if char_length(v_title) > 20 then
      raise exception 'TITLE_TOO_LONG';
    end if;
    if v_title ~ '[[:cntrl:]]' then
      raise exception 'TITLE_HAS_CONTROL_CHARS';
    end if;
    foreach w in array v_qualifications loop
      if lower(v_title) like '%' || lower(w) || '%' then
        raise exception 'TITLE_QUALIFICATION';
      end if;
    end loop;
    foreach w in array v_impersonation loop
      if lower(v_title) like '%' || lower(w) || '%' then
        raise exception 'TITLE_IMPERSONATION';
      end if;
    end loop;
  end if;

  update public.memberships
     set display_title = v_title,
         display_title_updated_by = auth.uid(),
         display_title_updated_at = now()
   where id = p_membership_id;

  return jsonb_build_object(
    'membership_id', p_membership_id,
    'user_id', v_user,
    'display_title', v_title
  );
end;
$$;

-- ★関数は、既定で PUBLIC が実行できます。★先に剥がします。
revoke all on function public.set_member_display_title(uuid, text) from public, anon;
grant execute on function public.set_member_display_title(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- ④ 名前を返す関数に、肩書きを足します
--
--   ★権限の名前（責任者／管理者／講師）は、★ここで当てません。
--     ★画面で当てます（lib/displayTitle.js の displayTitleOf）。
--     ★列や関数の返しに書き込むと、★「明示的に選ばれた値」に化けます。
--   ★role も返します。★画面が、当てはめに使います。
-- ---------------------------------------------------------------------------
create or replace function public.get_org_member_names(p_org_id uuid)
returns table(user_id uuid, display_name text, display_title text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ★その教室に居る人だけが呼べます。
  if not exists (
    select 1 from public.memberships m
     where m.org_id = p_org_id and m.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
    select m.user_id,
           nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
           m.display_title,
           m.role
      from public.memberships m
      left join public.profiles p on p.id = m.user_id
     where m.org_id = p_org_id;
end;
$$;

revoke all on function public.get_org_member_names(uuid) from public, anon;
grant execute on function public.get_org_member_names(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ⑤ 確かめ
-- ---------------------------------------------------------------------------

-- ⑤-1 列ができていること（3行）
select column_name as "列", data_type as "型", is_nullable as "null を許すか"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'memberships'
   and column_name like 'display_title%'
 order by 1;

-- ⑤-2 ★display_title の列ごとの UPDATE 権限が★無いこと（0行）
select grantee as "★display_title を直に書ける相手（0行であること）", privilege_type
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'memberships'
   and column_name like 'display_title%'
   and grantee in ('anon','authenticated');

-- ⑤-3 関数が呼べること
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as "authenticated が呼べるか",
       has_function_privilege('anon', p.oid, 'EXECUTE') as "★anon が呼べるか（false であること）"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('set_member_display_title','get_org_member_names')
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑥ ★実地の確かめ（★これが本当の答えです・別のアカウントで）
--
--   ① 講師の人が、他人の肩書きを書けないこと      → NOT_ORG_ADMIN
--   ② ★本人が、自分の肩書きを書けないこと         → NOT_ORG_ADMIN
--   ③ 別の教室の人の肩書きを書けないこと          → NOT_ORG_ADMIN
--   ④ ★直に UPDATE しようとしたら、通らないこと
--        update public.memberships set display_title = 'テスト' where id = '…';
--        ★42501（permission denied）になること。★0行ではありません。
--   ⑤ 「医師」を入れたら TITLE_QUALIFICATION
--   ⑥ 「運営」を入れたら TITLE_IMPERSONATION
--   ⑦ 空白だけを入れたら、★null になること（空文字ではないこと）
--        select display_title is null from public.memberships where id = '…';
--
--   ★service_role では RLS も権限も素通りします。★確かめになりません。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ⑦ ★anon の権限は、②.5 でまとめて剥がしました
--   ★以前は「別の日に」としていましたが、★同じ SQL に入れました。
--   ★表ぜんぶを触る回に、まとめてやるのが、いちばん漏れません。
-- ---------------------------------------------------------------------------
