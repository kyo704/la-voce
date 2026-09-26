-- 20260925_96 ページの 節を お仕事ごとに（★裁定207）
-- 坂本さんの ご指摘（2026-09-25）:
--   ★「カスタムが 声楽家のための ものしか ない」
-- ★★調べたら ★台帳は すでに できていました
--   portfolio_entries.kind は ★16種（★role・skill・physical・management を 含む）
--   ★★見本が 9種しか 出していなかった だけ です
-- ★★新しい 表は 要りません。★出し分けの 関数だけ
-- ★90（field）のあと

create or replace function public.my_page_fields()
returns table(kind text, label text, hint text, sort_order integer)
language plpgsql stable security definer set search_path to 'public' as $$
declare f text;
begin
  select coalesce(p.field,'music') into f from public.profiles p where p.id = auth.uid();
  f := coalesce(f,'music');
  return query
  select * from (values
    ('education',   '学んだところ',
                    '学校・養成所・研究所', 1),
    ('teacher',     case f when 'music' then '師事した方' else null end,
                    'お名前だけで かまいません', 2),
    ('award',       '受賞', 'コンクール・賞', 3),
    ('performance', case f when 'music' then '演奏・出演' else '出演作品' end,
                    '日付・題名・役', 4),
    ('repertoire',  case f when 'music' then 'レパートリー' else '持ち役' end,
                    '出せる ものだけで かまいません', 5),
    ('recording',   case f when 'voice' then 'ボイスサンプル'
                           when 'stage' then '録画' else '録画・音源' end,
                    'リンクでも かまいません', 6),
    ('role',        case f when 'music' then null else '役の はば' end,
                    '少年・青年・老人 など', 7),
    ('skill',       case f when 'voice' then '話せる ことば・特技'
                           when 'stage' then '特技' else null end,
                    '方言・楽器・スポーツ など', 8),
    ('physical',    case f when 'voice' then '声の 高さ'
                           when 'stage' then '身長・声域' else null end,
                    '★お仕事の ための 数字です。体調の 記録とは 別の ものです', 9),
    ('management',  case f when 'music' then '所属' else '所属事務所' end,
                    '無くても かまいません', 10),
    ('press',       '批評', '書かれた もの', 11),
    ('link',        'リンク', 'ほかの ページへ', 12)
  ) as t(kind, label, hint, sort_order)
  where t.label is not null;
end $$;
revoke all on function public.my_page_fields() from public, anon;
grant execute on function public.my_page_fields() to authenticated;

-- ★★physical は ★体の ことで、★★体調では ありません
--   ★entries（体調の 記録）とは ★1つも つながっていません
--   ★画面に 1文 書きます:
--     「ここに 書くのは、お仕事の ための 数字です。
--      ★体調の 記録とは 別の ものです。出さないかぎり、誰にも 見えません」

-- ★★型（web_type）では 決めません。★お仕事（field）で 決めます
--   ★理由: ★型は 見た目で 選ぶ もの。★中身まで 変わると 驚きます

-- 確かめ（試しの環境で・★なりきって）
-- ★music → ★9種（★役・特技・声の高さ は 出ない）★私は はじめ 10と 書きました ── ★数え違い
-- ★★voice → 11種（★師事した方 は 出ない／★役・特技・声の高さ が 出る）
-- ★stage → 11種
-- ★kind は ★どの お仕事でも 書けます（★出し分けは 画面だけ・★台帳は 止めません）
--   ★理由: ★お仕事を 変えても ★書いたものは 消しません（裁定119）
