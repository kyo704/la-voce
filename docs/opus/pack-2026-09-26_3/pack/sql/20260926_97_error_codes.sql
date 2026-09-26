-- 20260926_97 止まった ときの ことばを ★記号に（★9言語の 下ごしらえ）
-- 坂本さんの ご判断（2026-09-26）:「★先に できることは 全て やっておきましょう」
-- ★★台帳は ★9言語を 知りません（★知るべきでも ありません）
--   ★いま 日本語が 入っているので、★★ドイツの 学校で ★日本語が 出ます
-- ★数えたら ★30本。★うち ★16本は ★すでに 記号が 先頭に あります
--   → ★残る 14本に 記号を 付けます
-- ★★試して 分かった こと: ★1つの 関数に ★文が いくつも あります
--   ★change_monka_teacher ★4文 ／ edit_confirmed_score ★3文
--   → ★★19の 記号を 付けました。★★記号なし ＝ 0 に なりました
-- ★★ことばは ★画面が 付けます（t('err.<記号>')）
-- ★96 のあと

-- ★★付ける 記号（★err.<記号> で 画面が 引きます）
--   NOT_ROSTER_KEEPER      その 学校の 名簿を 直せません
--   NOT_SCORE_KEEPER       この 学校の 点を 確定できません
--   SCORE_NOT_FOUND        その 点が ありません
--   SCORE_NO_DELETE        確定の あとは、消せません
--   SCORE_NEED_REASON      確定の あとは、わけを 添えて 直して ください
--   GRADE_LABEL_LOCKED     学年の札は、名簿をお預かりの方が決めます
--   NOT_ENROLLED           お入りに なって いません
--   DRAFT_NOT_FOUND        その 下書きが ありません
--   REP_NOT_FOUND          その 担当が ありません

do $$
declare r record; src text; out_ text; n int := 0;
begin
  for r in
    select p.oid, p.proname
      from pg_proc p join pg_namespace n2 on n2.oid = p.pronamespace
     where n2.nspname = 'public' and p.prokind = 'f'
       and pg_get_functiondef(p.oid) ~ 'raise\s+exception\s+''[^A-Z'']'
       and pg_get_functiondef(p.oid) ~ '[ぁ-んァ-ヶ一-龥]'
  loop
    src := pg_get_functiondef(r.oid);
    out_ := src;
    -- ★日本語の 文の 前に ★記号を 足します（★文は 残します）
    --   ★理由: ★いきなり 消すと ★いまの 画面が 何も 出せなく なります
    --   ★★画面が t('err.…') に なったら、★あとで 文を 削ります
    out_ := replace(out_, 'raise exception ''その 学校の 名簿を 直せません',
                          'raise exception ''NOT_ROSTER_KEEPER: その 学校の 名簿を 直せません');
    out_ := replace(out_, 'raise exception ''この 学校の 点を 確定できません',
                          'raise exception ''NOT_SCORE_KEEPER: この 学校の 点を 確定できません');
    out_ := replace(out_, 'raise exception ''その 点が ありません',
                          'raise exception ''SCORE_NOT_FOUND: その 点が ありません');
    out_ := replace(out_, 'raise exception ''確定の あとは、消せません',
                          'raise exception ''SCORE_NO_DELETE: 確定の あとは、消せません');
    out_ := replace(out_, 'raise exception ''確定の あとは、わけを 添えて',
                          'raise exception ''SCORE_NEED_REASON: 確定の あとは、わけを 添えて');
    out_ := replace(out_, 'raise exception ''学年の札は、名簿をお預かりの方が決めます',
                          'raise exception ''GRADE_LABEL_LOCKED: 学年の札は、名簿をお預かりの方が決めます');
    out_ := replace(out_, 'raise exception ''お入りに なって いません',
                          'raise exception ''NOT_ENROLLED: お入りに なって いません');
    out_ := replace(out_, 'raise exception ''その 下書きが ありません',
                          'raise exception ''DRAFT_NOT_FOUND: その 下書きが ありません');
    out_ := replace(out_, 'raise exception ''その 担当が ありません',
                          'raise exception ''REP_NOT_FOUND: その 担当が ありません');
    -- ★★1つの 関数に ★文が いくつも あります（★試して 分かりました）
    --   ★change_monka_teacher は ★4文。★edit_confirmed_score は 3文
    out_ := replace(out_, 'raise exception ''その 先生は、この 学校に いません',
                          'raise exception ''TEACHER_NOT_IN_ORG: その 先生は、この 学校に いません');
    out_ := replace(out_, 'raise exception ''その 方は、この 学校に いません',
                          'raise exception ''PERSON_NOT_IN_ORG: その 方は、この 学校に いません');
    out_ := replace(out_, 'raise exception ''すでに その 先生が 担当です',
                          'raise exception ''ALREADY_ASSIGNED: すでに その 先生が 担当です');
    out_ := replace(out_, 'raise exception ''その 点を 直せません',
                          'raise exception ''SCORE_NOT_EDITABLE: その 点を 直せません');
    out_ := replace(out_, 'raise exception ''まだ 確定して いません',
                          'raise exception ''NOT_CONFIRMED: まだ 確定して いません');
    out_ := replace(out_, 'raise exception ''保護者の メールアドレスが ありません',
                          'raise exception ''NO_GUARDIAN_EMAIL: 保護者の メールアドレスが ありません');
    out_ := replace(out_, 'raise exception ''書いた ご本人だけが 出せます',
                          'raise exception ''AUTHOR_ONLY: 書いた ご本人だけが 出せます');
    out_ := replace(out_, 'raise exception ''中身が ありません',
                          'raise exception ''EMPTY_BODY: 中身が ありません');
    out_ := replace(out_, 'raise exception ''その 門下の 先生だけが 決められます',
                          'raise exception ''MONKA_TEACHER_ONLY: その 門下の 先生だけが 決められます');
    out_ := replace(out_, 'raise exception ''代表は %人までです',
                          'raise exception ''TOO_MANY_REPS: 代表は %人までです');
    if out_ <> src then
      execute out_;
      n := n + 1;
    end if;
  end loop;
  raise notice '★記号を 付けた 関数: %本', n;
end $$;

-- ★★画面が 引く ときの 綴り（★i18n_keyの決めごと §3 ⑥）
--   台帳: raise exception 'NOT_ROSTER_KEEPER: …'
--   画面: t('err.NOT_ROSTER_KEEPER')
--   ★★同じ 綴り なので、★機械で 突き合わせられます

-- ★★日本語の 文を ★いま 消さない 理由:
--   ★★画面が まだ t('err.…') に なっていません
--   ★いま 消すと ★★何も 出せなく なります
--   → ★★画面が 直ったら、★別の SQL で 文を 削ります

-- 確かめ（試しの環境で）
-- ★★記号なし ＝ ★0本（★試しの環境で 確かめました）
-- ★記号あり ＝ 30本
-- ★もとの 守りは 1つも 変わらない（★止まる ところは 同じ）
-- ★すでに 記号が ある 16本は 触らない
