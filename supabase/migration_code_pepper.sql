-- ===========================================================================
-- ★台帳の 側にも 塩を 入れます（★2026-09-16・訂正）
--
--   ★★私は `migration_code_attempts.sql` で こう 書きました ──
--     「塩は 台帳の 側では 混ぜられません（★アプリの 秘密 です）。
--       だから ここでは `md5` で 十分 とします」
--   ★★**十分では ありません。** ★言い直します。
--     ★★`md5('code ' || v_code)` は **塩なし** です。
--     ★★8文字・31種＝8,530億通り。★md5 なら 手元の 機械で 総当たりできます。
--     ★★`code_attempts` が 漏れたら、★生きて いる 合言葉が 戻せます。
--   ★★台帳の 側でも 塩は 混ぜられます。★私が 知らなかった だけ です。
--
--   ★★塩は データベースの 設定に 置きます。★行では ありません。
--     ★★`current_setting('app.code_pepper', true)` で 読みます。
--     ★★第2引数 `true` ── ★無い ときに 落ちず、★null を 返します。
--
--   ★★順番 ── ★① 下の `alter database` を 走らせる
--             ★② この ファイルの 関数を 走らせる
--   ★★①を 飛ばすと、★関数が 止めます（★塩なしで 進めません）。
-- ===========================================================================

-- ★★① 塩を 置きます。★`◯◯◯` を 置き換えて ください。
--   ★作り方（手元で）… openssl rand -base64 32
--   ★★この 1行は **貼る 前に 書き換えて ください**。
--   ★★書き換えずに 走らせると、★塩が `◯◯◯` に なります。
--
--   alter database postgres set app.code_pepper = '◯◯◯';
--
--   ★★走らせた あと、★つなぎ直すまで 効きません（★新しい 接続から）。
--     ★Supabase の SQL Editor なら、★一度 別の 問いを 走らせれば 足ります。

-- ★★①-2 `pgcrypto` を 入れます（★`digest` を 使う ため）。
--   ★★もう 入って いれば、★何も 起きません。
create extension if not exists pgcrypto;

-- ★★② 関数を 塩つきに します。
create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_result jsonb;
  v_code   text;
  v_hash   text;
  v_tries  integer;
  v_pepper text;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  -- ★★塩が 無ければ、★進めません。
  --   ★★「塩なしで とりあえず 動かす」を しません。
  --     ★★動いて しまうと、★誰も 気づかない まま 塩なしの ハッシュが 貯まります。
  v_pepper := current_setting('app.code_pepper', true);
  if v_pepper is null or v_pepper = '' then
    raise warning '★app.code_pepper が ありません。合言葉を 引けません。';
    return null;
  end if;

  -- ★★`pgcrypto` の `digest` を 使います。★無ければ 下で 入れます。
  v_hash := encode(digest(v_pepper || ' code ' || v_code, 'sha256'), 'hex');

  select count(*) into v_tries
  from public.code_attempts
  where code_hash = v_hash
    and at > now() - interval '24 hours';

  if v_tries >= 10 then
    insert into public.code_attempts (code_hash) values (v_hash);
    return null;
  end if;

  insert into public.code_attempts (code_hash) values (v_hash);

  select i.teacher_id into v_teacher
  from public.teacher_invitations i
  where i.code = v_code
    and i.used_at is null
    and i.expires_at > now()
  limit 1;

  if v_teacher is null then
    return null;
  end if;

  select jsonb_build_object(
           'teacher_id', p.id,
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school', nullif(trim(coalesce(p.school, '')), '')
         )
    into v_result
  from public.profiles p
  where p.id = v_teacher;

  return v_result;
end;
$$;

revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

-- ★★③ 塩なしで 貯まった ぶんを 捨てます。
--   ★★古い ハッシュは もう 引き当てられません。★残して おく 意味が ありません。
--   ★★止めて いた ぶんも 消えます ── ★24時間 待たずに 開きます。
--     ★★いまは まだ 誰も 使って いないので、★困る 人は いません。
delete from public.code_attempts;
