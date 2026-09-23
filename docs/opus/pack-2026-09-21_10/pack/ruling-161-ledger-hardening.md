# RULING 161 — 台帳の締め直し（Opus が本番・試しを直接見て見つけた7件）

```yaml
ruling: 161
date: 2026-09-21
version: design-v21
how: Opus が Supabase に読み取りだけで接続（pg_proc・pg_policies・pg_constraint・権限・件数。利用者の中身は読んでいない）
projects: 本番 xxjtplvpcneksrofkjmf ／ 試し smntpurraumeerselvsc（la-voce-test）
rule: どれも本番の権限・構造を変える → tools/権限変更の型.md の形で出し、decision_needed_check.py を通し、坂本さんの承認のあとに当てる
```

## ★0. まず答えてほしいこと（前回から未回答）

```yaml
- S2（open_monka_thread・monka_read_log・2つのポリシー）は本番に既に入っている（試しと同じ定義・0行）。報告は「本番は未適用」だった
- list_migrations（本番）の最新は 2026-09-18。S1・S2 に当たる移行が履歴に無い
- 問い: いつ・誰の承認で当てたか／なぜ履歴に無いか（直接 SQL か）／S1・S2 の移行ファイルはリポジトリのどこか
```

## 1. 直すこと

```yaml
FX1_開いた記録が消える（本番・★最優先）:
  いま: monka_read_log の viewer_user_id・target_monka_id・org_id が ON DELETE CASCADE
  問題: アカウントを消す・学校を閉じると、開いた記録も消える。「消せません」（仕様シート②③・裁定159）に反する。裁定159 §6 Q2「連鎖削除しない」とも違う
  直し: 3つとも ON DELETE SET NULL（列を null 可に）。消える前の名前は name_at・post_name_at に残っている。学校の名前も残すため org_name_at（text）を足し、RPC で写す
  あわせて: reason_kind を NOT NULL に

FX2_開いた記録を画面から直接書ける（本番）:
  いま: ポリシー monka_read_log_insert_self_monka_read（authenticated が自分の名で insert 可）＋ authenticated に INSERT の権限
  問題: RPC を通らずに行を作れる（読んでいないのに「読んだ」行・理由の偽造）。reason_kind が null の行も作れる
  直し: そのポリシーを消し、authenticated から INSERT を外す。書くのは open_monka_thread（security definer）だけ

FX3_役職の変更履歴を消せる（試し。★本番に当てる前に）:
  いま: org_post_perm_log に anon・authenticated の TRUNCATE・REFERENCES・TRIGGER、anon の SELECT
  直し: 裁定160 の移行に revoke all on org_post_perm_log from anon, authenticated; grant select on org_post_perm_log to authenticated; を入れる（RLS で post・master だけ）

FX4_書きかけを全部消せる権限（本番）:
  いま: authenticated に org_message_drafts の TRUNCATE
  補足: REST からは TRUNCATE を出せないので、いま外から使える穴ではない。ただし「書きかけは消えません」の約束を権限でも守る
  直し: revoke truncate on org_message_drafts from authenticated;

FX5_だれでも人の関係を問い合わせられる（本番）:
  いま: are_connected(viewer_id, other_id)・is_org_member(viewer_id, org)・is_org_owner_or_admin(viewer_id, org)・can_view_organization(viewer_id, org) が anon で実行できる（security definer）
  問題: 公開の鍵で /rpc から「この人はこの学校の人か」「この先生とこの学生はつながっているか」を問い合わせられる（UUID が要る）
  直し: 4つとも anon・public から execute を外す。is_org_owner_or_admin はポリシーで使われていない → リポジトリに呼び出しが無ければ消す（Code が grep）
  次の段: are_connected・is_org_member は viewer_id を引数で受けず auth.uid() を中で使う形に（ログインした人が他人を問い合わせられないように）。呼び出し元を Code が一覧に

FX6_招待中の学校がだれにでも見える（本番・いまは0件）:
  いま: can_view_organization に「その学校に使われていない招待が1つでもあれば true」の枝。organizations_select はこの関数だけ
  問題: 招待を出している間、ログインしている人ならだれでもその学校の行（created_by・contract_owner_user_id を含む）を読める。コメントは「合言葉を知っている前提」だが、条件に合言葉が無い
  直し: その枝を消す（合言葉での参加は 9/2 からサーバ側の処理）。試験：合言葉で参加できる／合言葉の無い人がその学校を読めない

FX7_試しの台帳が本番と違う（★証明の土台）:
  いま: has_can の中身が違う（本番は has_can_user を呼ぶ、試しは直接）。security definer の関数のうち anon で実行できるのが 本番5・試し30以上。ほか数本の本文が違う
  問題: 試しで通った証明（S1 5/5・S2 13/13）が、本番でも同じとは言えない
  直し: 試しを本番の移行から作り直す（裁定112）。それまでは、証明の報告に「使った関数の本番と試しの md5 が同じ」を1行ずつ付ける
```

## 2. 約束の台帳との関係

FX1・FX2・FX3・FX4 は「消せません」「書きかけは消えません」の約束を、権限と構造で守るもの。約束の台帳の「守る処理」の欄に、この裁定の番号と試験を書く。

## 3. VERIFY（実在の試しの利用者で）

```yaml
FX1: 試しの利用者を消す → その人の開いた記録が残る（viewer_user_id が null・name_at は残る）
FX2: 事務（monka_read あり）が monka_read_log に直接 insert → 拒否
FX3: authenticated で truncate org_post_perm_log → 権限エラー
FX5: anon の鍵で /rpc/is_org_member → 権限エラー
FX6: 招待を1つ出した学校を、無関係の試しの利用者が select → 0行／合言葉での参加は通る
```

## 4. 追記（同日・Opus の独立検証の2回目）

```yaml
how: tools/ledger_inventory.sql を本番で流し、tools/ledger_inventory.py audit で検査（控え: tools/ledger_snapshots/2026-09-21_prod.json）

★記録漏れ（2件目）:
  - 裁定160（org_post_perm_log・log_org_post_perm・引き金 trg_log_org_post_perm）が、この会話の中で本番に入った。
    1回目の確認では本番に無かった。移行の履歴は 2026-09-18 のまま増えていない
  - しかも FX3（TRUNCATE・REFERENCES・TRIGGER を外す）を入れずに当てている → FX3 は「試し」ではなく「本番」の件になった
  問い: 裁定160 はいつ・誰の承認で本番に当てたか。DECISION_NEEDED（権限変更の型）は出たか

FX1 を広げる（退会で記録が消える。audit A3）:
  monka_read_log（viewer・target）／post_change_log（target_user_id）／score_log（editor_user_id）／export_log（user_id）
  → 人への外部キーを ON DELETE SET NULL に。その時点の名前を写す列（name_at など）が無い表は足す
  除外: email_change_log（本人の操作の記録。退会で消えてよい）
  学校（org_id）の連鎖削除は、monka_read_log だけ SET NULL（学生の開示の求めに応える）。ほかは学校を閉じたら消える、のまま

FX8（新・audit A2）: 記録の表に利用者が直接 insert できる
  post_change_log・org_billing_log・export_log・monka_read_log（FX2）
  問題: 権限を持つ人が「したことにする」行を作れる（役職を変えていないのに変えた、など）
  直し: 書くのは関数か引き金だけ。insert のポリシーと authenticated の INSERT を外す。順番は FX2 → post_change_log → 残り

FX9（新・audit A5）: 本番に試しのデータの移行が8本（2026-09-16〜18）
  seed_visual_demo_3sections・place_test_furniture…・place_interior_furniture…・create_gakucho_post_for_forcode_test_org・
  assign_gakucho_post_to_forcode・seed_6_enrollments_for_screenshot・reseed_6_enrollments_for_meibo_shot・seed_teacher_assignment_and_lesson_for_shukketsu_test
  （cleanup_test_enrollments_final はあるが、家具・役職・課題・レッスンの片付けは見当たらない）
  決まり: 本番に試しのデータを入れない（CLAUDE.md）
  直し: Code が、この8本で入った行を一覧にし、残っているものを消す移行を1本。消す前に一覧を坂本さんに見せる
```

## 5. 独立検証の運用（Sonnet の提案を採る）

```yaml
when: 大きな権限変更・裁定の実装の報告が来たとき／本番に当てたと聞いたとき／週1回
who: Opus（Supabase に読み取りだけで直接）
steps:
  1 ledger_inventory.sql を本番・試しで流す → ledger_snapshots/<日付>_prod.json・_test.json
  2 ledger_inventory.py audit（本番）／drift（前回→今回）／twin（本番↔試し）
  3 記録を書く関数は fail_closed_lint.py（関数の定義を本番から取って）
  4 見つけたものは裁定か、この §4 の形で Code に（ファイル名・行ではなく、台帳の名前と直し方）
never: 書き込み・DDL・利用者の中身を読むこと（目録だけ）
note: リポジトリの SQL ファイルとの数の突き合わせは、Code から一覧（ls supabase/migrations）を受け取って行う。Opus はリポジトリを見られない
```

## 6. 追記（2026-09-22・束2 の報告を Opus が本番で独立に確かめた）

```yaml
効いている（本番）:
  164 W2: org_messages の authenticated の表ごとの権限は INSERT・SELECT だけ。UPDATE は列 withdrawn_at だけ ✓
  164 W1: applications_update_own の with check に status in ('sent','withdrawn') ✓
  FX2: monka_read_log の insert のポリシー0本・authenticated は SELECT だけ ✓
  167 A1: character_inventory の authenticated は SELECT だけ ✓
★記録漏れ（3回目）: 本番の schema_migrations は 2026-09-18 の31本のまま。束2 も移行の履歴に無い
  → S2・裁定160・束2 の3回とも、apply_migration ではなく直接の SQL で当てている見込み
  決まり（再掲・強める）: 本番の台帳を変えるのは apply_migration だけ。直接の SQL で変えたら、その日のうちに同じ中身の移行を apply_migration で「記録だけ」当てる
  Opus の見張り: 毎日1回 ledger_inventory drift（目録が変わったのに移行が増えていなければ、その日のうちに Code に）
★本番に試しの学校10件（名前に「50通り」。報告では「★50通り-01〜10」）: 本番にある（organizations で10件）。FX9 の一覧に足す（坂本さんの判断 10/5 まで）
未着手の確認: evaluation_judges は本番に無い（束3 は試しだけ。報告どおり）
```
