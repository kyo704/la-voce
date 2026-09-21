# RULING 168 — フェーズ7（2027年4月・学校向け販売）までの予防監査

```yaml
ruling: 168
date: 2026-09-21
version: design-v23
from: Sonnet の全体依頼（P1〜P8）
how: 本番は読み取りだけ（Supabase に直接）。見本は Playwright。リポジトリの中が要るものは CHECK_FIRST として Code に
priority_rule: フェーズ4（10月19日・出発）までに直すものを先に
status: P1・P2・P8 は今回調べ終えた。P3・P6・P7 はこれまでの裁定（161〜167）と合わせて整理。P4・P5 は調べる計画まで（次の回）
```

## 早見表（フェーズ4 までに直すもの＝★）

| # | 領域 | 見つかったもの | 直し方 | いつまで |
|---|---|---|---|---|
| ★1 | P1 退会 | 退会（auth のアカウント削除）が、レッスン・学校・招待・名簿の下書きに名前がある人では **止まる**（外部キーが NO ACTION） | 列ごとに SET NULL（契約者だけは「先に移してください」と画面で案内） | フェーズ4 |
| ★2 | P1 退会 | 審査員が退会すると、学生の **点と講評が消える**（judge_id が CASCADE） | SET NULL＋審査員の名前を写す列 | フェーズ4（採点は0行。先に直す） |
| ★3 | P1 退会 | 先生が退会すると、門下の **連絡が全部消える**（org_messages の author_id・teacher_id が CASCADE） | SET NULL＋名前を写す列 | フェーズ4 |
| ★4 | P2 時差 | 台帳は UTC。台帳の関数・既定値・ポリシーに UTC の日付の計算は **0件**（確認済み）。日付の計算はアプリの中 → サーバの `new Date()` が UTC だと、日本の 0時〜9時が前の日になる | CHECK_FIRST（下）。試験を TZ=Asia/Tokyo と TZ=Europe/Rome の両方で | フェーズ4 |
| ★5 | P2 気づく仕組み | 台帳に定期の仕事（pg_cron）は無い。system_alerts の表はあるが、**誰が・いつ読むかが決まっていない** | 見張りの通知の道を1本決める（下） | フェーズ4 |
| ★6 | P8 見本 | スマホ2本に **4か所の食い違い**（教室の招待の行・合言葉の注意・書き出しの注記・行事の色） | 直した（design-v23）。道具 mobile_parity で 0件 | 済み |
| 7 | P1 重なり | lessons に古い「先生と生徒のつながり」のポリシーが残り、学校のポリシーと重なる（害は無い：学校のレッスンは link_id が空） | 古いつながりの表が使われていなければ消す | フェーズ5 |
| 8 | P1 通知 | transfer_contract_owner の知らせの失敗が warning で見えなくなる（既報） | system_alerts に1行 | フェーズ5 |

## P1 台帳と権限（調べた範囲と結果）

```yaml
退会・削除の流れ（★1〜3）:
  調べた: auth.users を指す外部キー 90本すべて（CASCADE 67・NO ACTION 13・SET NULL 13 ほか）
  ★止まる（NO ACTION）: lessons（student_id・teacher_id・created_by・attendance_by）／organizations（created_by・contract_owner_user_id）／
    org_invitations（used_by・invited_by）／roster_drafts（linked_user_id・imported_by）／lesson_presets.created_by／teacher_invitations.used_by_student_id
    → これらの行に名前がある人は、アカウントを消すと外部キーの違反で失敗する。「いつでも退会できます」（規約9条）が守れない
    本番の退会は7件（account_deletions）。いままで通ったのは、これらの表に名前の無い人だった見込み
  直し:
    lessons の4列・organizations.created_by・org_invitations の2列・roster_drafts の2列・lesson_presets.created_by・teacher_invitations.used_by_student_id → ON DELETE SET NULL
      （レッスン・出欠は学校の運営の記録として残る。「やめるとどうなるか」の画面の約束どおり）
    organizations.contract_owner_user_id → 残す（NO ACTION のまま）。退会の画面で「この学校の契約者です。先に 契約者を 移してから 退会してください」と出し、
      transfer_contract_owner へ案内（黙って失敗させない）
  ★消えてはいけないのに消える（CASCADE）:
    evaluation_scores.judge_id・evaluation_reviews.judge_id → 学生の点・講評が消える → SET NULL＋judge_name_at
    org_messages.author_id・teacher_id → 門下の連絡の履歴が消える → SET NULL＋author_name_at
    （裁定161 FX1 の4表: monka_read_log・post_change_log・score_log・export_log も同じ直し）
  消えてよい（本人のもの）: entries・notes・events・cycle_periods・portfolio*・performances・article_*・character_inventory・item_acquisitions・purchases・subscriptions・
    consent_records・guardian_consents・minor_billing_consents・applications・application_messages ほか
    ※お支払いの記録は payment_records（人への外部キー無し）で7年残る（ポリシー9項どおり）
  CHECK_FIRST: 退会はどこで・どう実行しているか（auth.admin.deleteUser か）。失敗したとき画面に何が出るか
  VERIFY: 試しの環境で「レッスン・招待・名簿の下書き・点・連絡に名前がある先生／学生」を作って退会 → 通る・残るべき行が残る

招待・合言葉（再監査）:
  org_invitations: select・insert・update とも has_can(meibo)。匿名の枝なし（9/14 の No.017 が保たれている）
  teacher_invitations: 本人（teacher_id）だけ。匿名の枝は消えている（No.018 が保たれている）
  code_attempts・recovery_codes・app_secrets: 利用者に権限もポリシーも無い（閉じている）
  → 9/18 以降に増えた抜け道は無い

通知の経路:
  台帳の中: user_notices（本人の insert・select）／notice_targets（本人の select）／transfer_contract_owner の知らせ（失敗を warning で握る）
  メール・LINE はサーバ → CHECK_FIRST: 送れなかったときに、どこに残るか（system_alerts か、どこにも残らないか）

共有範囲（matching_visible 型の除外漏れ）:
  さがす: 関数（get_postings・get_posting_detail・get_applications ほか）の中で matching_visible・matching_suspended を使っている（関数の監査で確認）
  公開ページ: 台帳では除外していない（裁定167 B1。関数で読む形に）

security definer の関数: 65本すべて済み（裁定162・訂正 §8）
ポリシーの重なり: 同じ操作に許可のポリシーが2本以上 → article_progress（同じ条件）・lessons（古いつながり＋学校。害なし）・organizations（select 2本。害なし）
  memberships の update 2本（緩いほうに can_grant_post が無い）は、列の権限（post_id を update できない）で塞がっている
体調の記録に届く道: 先生・学校・運営から0本（裁定167 D1。entries は本人だけ・読む関数2本はサーバだけ）。道具 A7 で見張る
約束の台帳（484件）の台帳・権限でしか守れない約束: 「する」55件の逆引き（約束の逆引き_門下）の形で、S1・S2 の出力と台帳 JSON が届いたら全件を確定させる
```

## P2 欧州から作る間

```yaml
時差（★4）:
  台帳: TimeZone=UTC。関数・既定値・ポリシーに current_date／now()::date は0件。Asia/Tokyo を使う関数は2本（edit_confirmed_score・entries_set_source）で正しい
  日付の列: entries.date（date）・org_events.event_date・performances.performed_on・時刻は org_events の start_time・end_time（time・時差なし）
  CHECK_FIRST（Code がリポジトリで）:
    - サーバ（Vercel・Edge）の new Date()・toISOString().slice(0,10)・Date.now() から「きょう」を作っている所の一覧 → すべて Asia/Tokyo で
    - entries.date を誰が決めるか（端末の日付か・サーバか）。day_record_boundary_hour の計算の場所
    - 締切・期限（expires_at・締切の比較）を画面（端末の時計）でしていないか。比べるのは台帳の now() かサーバ
    - Vercel の cron の時刻（UTC で書く。日本の何時か注記）
  試験: CI を TZ=Asia/Tokyo と TZ=Europe/Rome の2つで回す（坂本さんの手元がイタリア時間になるため）
夏時間（10月最終日曜・3月最終日曜）:
  台帳・Vercel は UTC で影響なし。日本は夏時間が無い。影響が出るのは「イタリアの端末の時計で日付を作るコード」だけ → 上の CHECK_FIRST で0にすれば影響なし
  試験: 2026-10-25 と 2027-03-28 の前後で、日本時間の「きょう」が変わらないこと
イタリアからの接続:
  利用者（日本）→ 東京の台帳：変わらない。遅くなるのは坂本さんの手元の作業だけ（往復 約250ms 目安）
  決まり: 本番の手作業は apply_migration だけ（直接 SQL の長い処理をしない）。時間切れで半分当たる形を作らない
個人情報（GDPR）: 裁定157 T2 のまま（EU の人を利用者にしない・EU に拠点の要素を作らない）。プライバシーポリシーの外的環境の把握にイタリアを 10月19日より前に（法務の点検 L3）
壊れたときに気づく（★5）:
  いま: system_alerts の表はある。台帳に定期の仕事は無い。読む人・知らせる先が決まっていない
  決定: ①system_alerts に1行入ったら、坂本さんのメールに1通（サーバの仕組み。同じ種類は1時間に1通まで）
        ②毎朝（日本時間 7時）に「昨日の失敗の数」を1通（0件なら送らない）
        ③Supabase・Vercel の使用量の警告は坂本さんのメールへ（各サービスの設定）
  CHECK_FIRST: いまメール・LINE の送信の失敗・webhook の失敗・関数の例外が、どこにも残っていない所の一覧
```

## P3 課金（フェーズ6。裁定166・167 と合わせて）

```yaml
状態のずれ: 裁定167 A2（有効かつ期限内・判定は1つの関数）
webhook:
  - 署名を必ず確かめる（確かめられない通知は捨てる）
  - 二重受け: 受けた event.id を一意の列で残し、2回目は何もしない
  - 順番違い: 通知の中身を信じず、そのたびに Stripe から最新の状態を取り直して書く（subscription を retrieve）
  - 取りこぼし: 毎日1回、Stripe の有効な契約の一覧と subscriptions を突き合わせ、違いを system_alerts に
年払いの途中終了: 裁定166 R1・TASK_2 の上限の検査。特商法の表示（法務の点検 L2）と同じ数字であることを price_check で
学生の値段: 裁定166 R2（関数だけ・更新ごとに在籍を確かめる）
教室→学校・31人目・導入期間: 裁定166 R3・R4（36通りの試験）
未成年の課金: minor_billing_consents の日時を利用者が書ける（裁定167 A4）。年払いは18歳以上だけ（特商法表記）→ 台帳でも止める（年払いの購入の関数で age_band を確かめる）
```

## P4 アプリの審査 ── ★対象外（2026-09-21 坂本さん：App Store・Google Play に出さない。PWA のまま）

（以下は、将来ストアに出すと決めたときの控え）

### 控え

```yaml
前提の確認（★坂本さんに1問）: いまは PWA（ホーム画面に置く・アプリストア不要。特商法表記）。App Store・Google Play に出す予定はあるか
  出さないなら P4 は対象外（審査は無い）
出すなら調べること: アプリ内課金の決まり／アプリ内から退会できること／ログイン方式（他社ログインを置くなら Apple のログイン）／健康の表記／年齢区分／
  プライバシーの表示（App のプライバシー）／日本のスマホの新しい法律で Web の課金に案内できる範囲 → 公的な資料・各社の最新の指針で（Fable でもよい）
```

## P5 規模と費用（次の回に調べる）

```yaml
- 500人の名簿の重さ: 既知（全部描き直しの作り。総合評価 §2）。学校の iPad で実機
- Supabase・Vercel の無料枠と、超えたときに止まるもの・バックアップの保持の日数 → 各社の最新の料金表で確かめる（記憶で書かない）
- 同時の書き込み: 一意の制約（evaluation_judge_done に無かった＝裁定165）を全表で点検する（次の回。道具化する）
```

## P6 学校に売るとき

```yaml
- 確認票の項目と実装の差: 大学向け_法的整理書と安全管理措置（38の空欄）から。台帳から埋められる所（暗号化・権限・記録・バックアップ）は次の回に下書き
- 年度の切り替え: 4月の進級・卒業・学科の変更 → 名簿の読み込み（meibo）と enrollments の状態で。卒業で消さない
- 卒業後も学生の記録が本人に残る（裁定138 S2）: ★台帳で確認済み ── entries に学校への外部キーは無い（本人のアカウントにだけつく）。学校を閉じても記録は消えない
- 3者（事務・先生・学生）で見えてはいけないものの総当たり: perm-matrix（画面）と、台帳の試験（実在の試しの利用者）の両方。束5（試しの作り直し）の後に
- インボイス・請求書・領収書: 裁定166 R1-3（請求書に登録番号）。領収書（D14）は次の回
```

## P7 まだ作っていない機能

```yaml
裁定167 B・C・D のとおり。加えて:
- ことばの出し分け（裁定119）: 画面に辞書の鍵がそのまま出ない作り → 見本の文字に「key.」「_」の形が出ていないかを道具で（次の回に mobile_parity に足す）
```

## P8 文書と実装

```yaml
- 規約・ポリシー・特商法表記: 法務の点検（L1〜L4・D1〜D10）＋裁定157 §2 ＋裁定167 A3・A4 を入れた v2（Sonnet）
- 営業資料 v5: 画像のため UNKNOWN のまま（文字の版が要る）
- 見本4本どうし: ★スマホ2本の食い違いを道具で0件にした（tools/mobile_parity.py。release_check に入れた）
```

## Code への CHECK_FIRST（まとめ）

```yaml
1: 退会の実行の場所と、失敗したときの画面（★1）
2: サーバで「きょう」を作っている所の一覧・entries.date を決める所・締切の比べ方・Vercel の cron（★4）
3: 送信・webhook・関数の失敗が、どこにも残らない所の一覧（★5）
4: lessons の古いつながり（teacher_student_links）が使われているか（7）
5: 裁定167 の CHECK_FIRST 3点（持っている品の正・公開ページの読み方・Stripe の判定の場所）
```
