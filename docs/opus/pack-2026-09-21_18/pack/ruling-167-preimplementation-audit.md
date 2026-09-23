# RULING 167 — 実装の前の予防調査（値段・ポートフォリオ・公演・学ぶ／分析）

```yaml
ruling: 167
date: 2026-09-21
version: design-v22
how: Opus が本番を読み取りだけで。表ごとに ①ポリシー ②authenticated の列ごとの権限 ③引き金・関数 の3つを重ねた
scope: payment_records・subscriptions・purchases・item_acquisitions・character_inventory・profiles・consent_records・minor_billing_consents・
  guardian_consents・portfolios・portfolio_entries・portfolio_recordings・performances・performance_results・entries・article_*・chapter_state
limit: 画面・サーバのコード（Stripe の webhook・公開ページの読み方）はリポジトリの中なので Opus は見られない。そこは「Code が確かめる」と書いた
```

## A. 値段（ORDER3 の前）

```yaml
A1_★よそおいの品を、払わずに自分に付けられる（character_inventory・本番321行）:
  ポリシー: Users can manage own inventory（ALL）── (auth.uid() = user_id) だけ
  権限: authenticated に INSERT・UPDATE(id, item_key, purchased_at, user_id)
  問題: 利用者が item_key を好きに書いて、有料のよそおい・244点の品を自分に足せる。UPDATE で無料の品を有料の品に書き換えられる
    ※ item_acquisitions（台帳。select だけ・書くのはサーバ）は正しく閉じている
  Code が確かめる: 画面・サーバが「持っている品」を character_inventory で決めているか、item_acquisitions で決めているか
    → character_inventory で決めているなら、いま払わずに使える（裁定164 W1 と同じ型）
  直し: authenticated から character_inventory の INSERT・UPDATE を外す。品を足すのはサーバ（支払いの確認・ポイントの確認の後）か security definer の関数だけ
    持っている品の正は item_acquisitions の1本にし、character_inventory は「いま着ているもの」だけにするか、廃止

A2_Stripe の状態の同期（fail closed）:
  いまのデータ: subscriptions 49行（active 2・none 47）。期限の過ぎた active は0
  決まり（Code が実装で守る）:
    - 使えるかの判定は「status が active／trialing」かつ「current_period_end（無ければ period_end）が今より後」の両方。
      webhook が止まっても、期限が来たら使えなくなる（止まったまま使い続けられる、を作らない）
    - 年払い（purchases）は「status が有効」かつ「ends_at が今より後」
    - webhook は Stripe の署名を必ず確かめる。確かめられない通知は捨てる（Code が確かめる）
    - 判定は1つの関数（例 entitlement(user)）にまとめ、画面の各所で別々に判定しない

A3_profiles のサーバ専用にすべき列が、利用者から書き換えられる:
  いま守られている列（引き金 profiles_guard_server_only_columns）: is_admin・is_tester・cohort・teacher_beta_access・deleted_at・reauth_at・is_internal・character_points_spent
  守られていない列（authenticated に UPDATE がある）:
    line_user_id・line_link_code ── ★他人の LINE の ID を入れると、自分の知らせを他人に送れる。連携はサーバが確かめてから書く
    guardian_consent_declared_at ── 保護者の同意を「申告した日」を自分で書ける（申告そのものは準則どおり本人の申告だが、日時はサーバで入れる）
    consent_health_data_at・consent_health_data_withdrawn_at・consent_stats_use_at・reflux_care_consent_at ── 同意の日時を後から書き換えられる（法20条2項の証拠が弱くなる）
    is_under_18・created_at ── 年齢の区分の変更の跡が残らない／登録日を変えられる
  直し: 上の列を引き金の守る列に足す。変えるのは関数（同意・撤回・LINE 連携・年齢の区分の答え直し）だけ。年齢の区分の答え直しは consent_records に1行残す

A4_同意の記録の日時を利用者が決められる（consent_records・minor_billing_consents）:
  権限: INSERT(granted_at・withdrawn_at・text_hash ほか)・INSERT(declared_at・displayed_price_yen ほか)
  直し: 日時の列は insert から外して既定値 now()。表示した値段は サーバで入れる。書くのは関数だけにする（裁定166 R2 の学生の同意と同じ形）

A5_学生の値段の同意: 既存の仕組みは無い（新しく作る。裁定166 R2 は最初から関数だけで書く形）
```

## B. ポートフォリオ（実装を検討する前）

```yaml
B1_公開ページの除外は、いまサーバの中だけ:
  台帳: portfolios・portfolio_entries・portfolio_recordings は本人だけ（ALL・own）。他人が読むポリシーは無い → 公開ページはサーバ（service role）で読んでいるはず
  問題: 「切った相手には見せない」「止められている人は出さない」（さがすの matching_visible・matching_suspended）が、台帳では守られていない。サーバのコードの書き忘れ1つで漏れる
  直し: 公開ページは security definer の関数 get_public_portfolio(slug) だけで読む。関数の中で visibility・matching_suspended・（ログインしている見る人がいれば）切った相手を確かめる。サーバは service role で表を直接読まない
  Code が確かめる: いまの公開ページの読み方（表を直接か、関数か）

B2_録画の URL の縛りが台帳に無い:
  portfolio_recordings.url は自由な文字。裁定157 T6（YouTube の埋め込みだけ）は画面でしか守られていない
  直し: check 制約 url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'。さがすの録画の URL も同じ制約・同じ関数で（重なりを1つに）
```

## C. 公演（実装を検討する前）

```yaml
C1_子どもの出演（裁定147）と 15〜17歳の同意（裁定107）は、権限の形が違う:
  いま: guardian_consents（select 本人だけ・書くのは accept_guardian_consent の合言葉）・has_guardian_consent(user, org) は
    「本人がアカウントを持つ 15〜17歳」が「学校（org）ごと」に保護者の同意を得る形
  147: 15歳未満は アカウントを持たない。保護者のアカウントの中の「子どもの枠」。公演ごと
  決定: 147 は guardian_consents を使い回さない。新しい表（例 koen_child_entries: guardian_user_id・koen_id・呼び名・緊急の連絡先）で、持ち主は保護者
    子どもは auth.users に居ない。ポリシーの主語は常に保護者（guardian_user_id = auth.uid()）

C2_約束と実装の乖離を最初から作らない（裁定159 の型）:
  147 の約束: 緊急の連絡先は「責任者だけ・当日だけ・見た記録が残る」／保護者には「いつ・どの役割が見たか」だけ
  決定: 緊急の連絡先は表を直接読ませない。読むのは RPC だけで、中で ①責任者の役割 ②当日 ③記録を先に書く（fail closed）を確かめる
    記録の表は最初から *_log の決まり（update・delete・TRUNCATE なし・直接の insert なし・人への外部キーは SET NULL）
    tools/fail_closed_lint.py と ledger_inventory の audit を、表を作った日に通す
  出演者の見え方: 運営に見えるのは呼び名・配役・出欠・集合と解散。体調・記録の列を公演の表に持たない（見せない、ではなく持たない）

C3_本番の記録（performances）に、他の学校の行事を結びつけられる:
  権限: authenticated に INSERT・UPDATE(org_event_id)。ポリシーは own だけ
  問題: 学生が、自分の属さない学校の org_event_id を自分の本番に付けられる
  決まり（裁定57）: 運営の側から performances を読まない（層をまたぐ結合の禁止）。いま運営が読んでいなければ害は無い
  直し: org_event_id を付けられるのは、自分が在籍している学校の行事だけ（with check に exists enrollments）。層をまたぐ結合の見張り（裁定55）に performances を足す
```

## D. 学ぶ・分析（着手の前）

```yaml
D1_「先生は生徒の記録を見られない」は、台帳で守られている（確認）:
  entries のポリシーは本人だけ（select・insert・update・delete。同意を撤回したら書けない）
  entries を読む security definer の関数は2本だけ（admin_entry_stats・character_unlock_summary）。どちらも anon・authenticated から呼べない（サーバの service role だけ）
  article_notes・article_progress・chapter_state は本人だけ。健康の列は無い
D2_これから先の決まり:
  - entries を読む security definer の関数は、この2本の許可リストに足すときだけ作る。足すときは裁定にする
  - tools/ledger_inventory の audit に A7「entries を読む security definer の関数が許可リストの外にある」を足した
  - 分析（しらべる）は本人の entries だけ。学校・先生の画面の集計に entries を使わない（裁定57）
D3_整理: article_progress に同じ条件のポリシーが2本（害は無い。片方を消す）
```

## 優先（実行ルートの束に入れる）

```yaml
- A1 → 束2（今の利用者が使える穴。W1 と同じ型）★Code がまず「持っている品の正」を確かめる
- A3（line_*）・A4 → 束1 の次の短い束（引き金に列を足す・列の権限を外す）
- A2・B1・B2・C1〜C3 → それぞれの機能を実装するときの決まり（ORDER3・ポートフォリオ・公演の実装の最初の DECISION_NEEDED に入れる）
```
