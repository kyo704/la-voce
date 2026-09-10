-- ============================================================================
-- ★ノートと 曲の 台帳に、★欄を 足します（★2026-09-11）
--   出どころ 裁定-9月10日夜の7点（役職名・先生の運営…）§1
--
--   ★★足すだけです。★1つも 消しません。★列の 型も 変えません。
--   ★★何度 走らせても 同じです（if not exists）。
--   ★★いま 入っている 行は、★ぜんぶ null に なります。
--     ★埋めません。★「書いていない」と「0」は ちがうからです。
-- ============================================================================

-- ★① 稽古の メモ ── ★分けて 持ちます
alter table public.notes add column if not exists lesson_on      date;
alter table public.notes add column if not exists teacher_label  text;
alter table public.notes add column if not exists repertoire_name text;
alter table public.notes add column if not exists said_text      text;
alter table public.notes add column if not exists next_action    text;
alter table public.notes add column if not exists gained_text    text;

comment on column public.notes.lesson_on       is '★稽古の 日。★書いた 日（created_at）とは 別です';
comment on column public.notes.teacher_label   is '★だれに。★自由文字です。★先生の id では ありません';
comment on column public.notes.repertoire_name is '★みた曲。★repertoire_tessitura.repertoire_name と 同じ 文字';
comment on column public.notes.said_text       is '★言われたこと（そのまま）';
comment on column public.notes.next_action     is '★次に 自分が すること（1つ）';
comment on column public.notes.gained_text     is '★できるように なったこと。★書かなくて よい';

-- ★★出来ばえ・点数の 欄は 作りません（★裁定）。★足さないこと。

-- ★② 曲の 台帳 ── ★足りない 4つ
alter table public.repertoire_tessitura add column if not exists composer     text;
alter table public.repertoire_tessitura add column if not exists position_in  text;
alter table public.repertoire_tessitura add column if not exists bottom_note  text;
alter table public.repertoire_tessitura add column if not exists status       text;

comment on column public.repertoire_tessitura.composer    is '★作曲家';
comment on column public.repertoire_tessitura.position_in is '★役・曲集の中の位置';
comment on column public.repertoire_tessitura.bottom_note is '★いちばん低い音。★tessitura_note（まん中）とは 別です';
comment on column public.repertoire_tessitura.status      is '★ようす。★4つの どれか（下の check）';

-- ★★知らない 値を 入れさせません。★ようすは 4つだけです。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'repertoire_status_check'
  ) then
    alter table public.repertoire_tessitura
      add constraint repertoire_status_check
      check (status is null or status in ('はじめたばかり','さらい中','本番済み','しばらく置く'));
  end if;
end $$;

-- ★③ 曲と 本番を 結びます
alter table public.performances add column if not exists repertoire_name text;
comment on column public.performances.repertoire_name
  is '★どの曲の 本番か。★repertoire_tessitura.repertoire_name と 同じ 文字';

-- ★④ 探しやすく します（★曲から 稽古の メモを 引くため）
create index if not exists notes_user_repertoire_idx
  on public.notes (user_id, repertoire_name)
  where repertoire_name is not null;
