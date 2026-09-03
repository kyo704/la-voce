# 予定を取り下げられなかった件（2026-09-04・調べただけ）
全205行 / 末尾は「  ★0行の確認を外しても落ちます（無音に戻さないため）。」

★直していません。★原因も、まだ決めていません。
★画面に出た文が届いたら、それだけで層が決まります（§4）。

## 1. 呼んでいる場所

### 取り下げ … `components/VocalTracker.jsx:10141-10156`

★DELETE ではありません。UPDATE です。行は消しません。
（10140 のコメント：「消すと、出ると印をつけた人の画面から黙って消えます」）

    書く列 … withdrawn_at, updated_at
    しぼり … .eq("id", eventId)
    確認   … .select("id") あり
             error を見る（10149）
             ★0行も見る（10150-10154）

### 日付の変更 … `components/VocalTracker.jsx:10120-10139`

    書く列 … previous_date, event_date, updated_at
    しぼり … .eq("id", ev.id)
    確認   … .select("id") あり／error あり／★0行も見る

★どちらも、同じ形です。★2026-09-02 に直したもので、
  0行を無音で見逃す形（#004 と同じ形）は、もうありません。
★同じ形なので、★日付の変更も同じように失敗しているはずです。
  ★運営者に、そちらも試していただきたいです。

## 2. リポジトリ側の、いまの想定

### 権限（migration_identity_columns_immutable.sql:55-58）

    revoke update on public.org_events from authenticated;
    revoke update on public.org_events from anon;
    grant update (event_date, previous_date, withdrawn_at, updated_at)
      on public.org_events to authenticated;

★4つの列は、どちらの処理が書く列も、すべて入っています。
  取り下げ … withdrawn_at ○ / updated_at ○
  日付変更 … previous_date ○ / event_date ○ / updated_at ○
★リポジトリのとおりに本番が当たっているなら、権限の層では止まりません。

### ポリシー（migration_org_events.sql:82-100）

    org_events_select_member … その教室に居る人（membership か、有効な在籍）
    org_events_write_admin   … for all
                               using (memberships に owner か admin の行がある)

★org_events_write_admin には★WITH CHECK がありません。
  for all のときは using が検査にも使われるので、いまは通ります。
  ★ですが、これは 2026-09-04 の決まり
  「WITH CHECK の無い UPDATE のポリシーは、欠陥です」に触れます。

### ★DELETE について（ご質問への答え）

★リポジトリのどこにも `revoke delete on public.org_events` がありません。
  あるのは revoke insert（URGENT_containment_and_diagnosis.sql:78-79）と
  revoke update（migration_identity_columns_immutable.sql:55-56）だけです。

★つまり DELETE は、既定のまま authenticated に残っている可能性があります。
  org_events_write_admin は for all なので、★オーナーと責任者は
  ★行を消せてしまいます。
★取り下げを UPDATE にした理由は「消さないため」でした。
  ★消す道が別に開いたままなら、その設計は守られていません。
  ★今回の不具合とは別の話です。分けて扱ってください。

## 3. ★本番でしか見えないこと

★私は本番を見られません。次の2つは、確かめないと分かりません。

1. migration_identity_columns_immutable.sql が★途中までしか
   当たっていない可能性。★(e)③ で、同じファイルの②にある
   assert_*_identity_unchanged 4つが★本番に無いことが分かっています。
   ★①の grant だけ当たって②が落ちたのか、①も欠けたのかは、
   grant を数えないと分かりません。
2. 2026-09-04 の夜に本番へ直接当てた変更。
   ★org_events_write_admin に WITH CHECK を足した、
   あるいは RESTRICTIVE のポリシーを足した場合、
   ★リポジトリには写っていません。

## 4. ★画面に出た文で、層が決まります

★コードが2つの言い方を分けています。どちらが出たかを教えてください。

  「取り下げられませんでした。」
    → error が返っています（10149）。
    → ★権限の層です。42501 permission denied for table/column、
      またはトリガーの raise exception。
    → ★ブラウザのコンソールに、生のエラーが出ています（10149）。
      そちらの文字も、そのまま貼ってください。

  「この予定を取り下げる権限がありません。教室のオーナーか責任者に…」
    → error は null で、★0行でした（10150）。
    → ★ポリシーの層です。org_events_write_admin の using が
      通っていません。
    → または★その id の行が、そもそも見えていません。

  どちらでもない／何も出ない
    → ★ボタンまで届いていません。confirm を取り消した、
      あるいは別の場所で止まっています。

## 5. 直しの案（★まだ実装しません）

★層が決まるまで、直しは選べません。
  権限の層なら … migration_identity_columns_immutable.sql の①を
                 当て直す。★足りない列を足すのではなく、
                 ★ファイル全体を当て直します（②も欠けているため）。
  ポリシーの層なら … org_events_write_admin の using が
                 memberships を読めているかを、なりすましで確かめる。
                 ★ポリシーの中の副問い合わせにも RLS が効きます。

★どちらの場合も、org_events_write_admin に WITH CHECK を足すことと、
  DELETE を剥がすことは、★別々に判断してください。
  ★1つの直しに混ぜると、効いたものが分からなくなります。

## 6. ★本番の権限一覧が届いたあと（追記）

★原因が確定しました。★層は「権限」です。

    取り下げ   … withdrawn_at ○ ／ ★updated_at ✕
    日付の変更 … event_date ○ ／ ★previous_date ✕ ／ ★updated_at ✕

★1つでも権限の無い列が混ざると、文ごと 42501 で落ちます。
★だから、どちらも通りません。日付の変更も、同じ理由で壊れています。
  （§1 で「同じ形なので同じ運命のはず」と書いたとおりでした。）

### ★リポジトリと本番が食い違っていました

    migration_identity_columns_immutable.sql:57（リポジトリ）
      grant update (event_date, previous_date, withdrawn_at, updated_at)

    本番の実際
      end_time, event_date, kind, start_time, target_group, title, withdrawn_at

★本番に手で当てた分が、リポジトリに写されていません。
★このファイルは、いまの本番を説明していません。読むと間違えます。
★写しは supabase/2026-09-04-org-events-grants-cleanup.sql です。

### 列ごとの判断

    updated_at    … ★画面から外します。権限も与えません。
                    ★いつ変わったかの記録を、書く側に決めさせません。
                    ★BEFORE トリガーがサーバで入れます。
                    ★列の権限は UPDATE 文が名指しした列だけを見るので、
                      トリガーが入れる列に権限は要りません。

    previous_date … ★画面から外します。権限も与えません。
                    ★「どこから動いたか」は、古い行に書いてあります。
                      ★渡してもらう必要がありません。導けます。
                    ★渡させると、嘘を書ける口が1つ増えます。
                    同じトリガーが old.event_date から入れます。

    それ以外（end_time, kind, start_time, target_group, title）
                  … ★本番にありますが、画面はいま使っていません。
                    ★今回は触りません。★一度に2つ変えると、
                      どちらが効いたのか分からなくなります。

### ★順番（守ってください）

    1) SQL を当てる … トリガーが updated_at / previous_date を入れる
    2) そのあとで、画面から2つの列を外す

★逆にすると、あいだの時間、updated_at が更新されません。
★この順なら、あいだも正しく動きます。画面はまだ落ちますが、
  ★それはいまと同じ状態です。悪くなりません。

## 7. 取りこぼし（同じSQLに入れました）

  a) ★anon に org_events の INSERT/UPDATE/DELETE/TRUNCATE/
     REFERENCES/TRIGGER が残っていました。
     ★2026-09-04 の作業は authenticated しか見ていませんでした。
  b) ★authenticated に TRUNCATE が残っていました。
     ★TRUNCATE には RLS が効きません。1文で表が空になります。
     ★今日いちばん重い取りこぼしです。
     TRIGGER と REFERENCES も剥がします。
  c) 同じことを teacher_student_links / assignments / lessons でも
     行います。★4表まとめて1つのSQLにしました。

  ★DELETE は、lessons だけ残します。
    ★画面がレッスンを消しています（VocalTracker.jsx:9836）。
    ★剥がすと、消せなくなります。
    org_events / teacher_student_links / assignments は、
    ★どれも「消さずに印をつける」設計なので、剥がします。

## 8. ★訂正（2026-09-04）

★「assert_* が本番に無い」と、このファイルと SQL に書いていました。★誤りです。
  本日すでに当たっており、trg_*_identity_immutable の4つとも
  ★有効であることが確認されています。
★(e)③ で無かったのは、その時点の話です。そのあと当たっていました。
★確認の結果には、いつ確認したかが付いています。
  ★それを落とすと、古い結果が「いまの事実」として歩き出します。

## 9. 画面側の直し（当てたあと・2026-09-04）

    VocalTracker.jsx:10138  .update({ event_date: nextDate })
    VocalTracker.jsx:10157  .update({ withdrawn_at: new Date().toISOString() })

★previous_date と updated_at を、どちらの文からも外しました。
  サーバの trg_org_events_bookkeeping が入れます。
★見張り：components/tests/org-event-write-columns.test.js（23本）
  ★本番の grant にある7列だけを許し、それ以外を書いたら落ちます。
  ★0行の確認を外しても落ちます（無音に戻さないため）。
