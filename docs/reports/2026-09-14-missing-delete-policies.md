# 消す 決まりの 無い 22の 表 ── 3つに 分ける
全127行 / 末尾は「  ★1つの ファイルで 2つの 鍵を 使い分けて いると、粗く 出ます。」

★出どころ 2026-09-14、★No.014 の 続き（★坂本さん）

★★22件を「22の 不具合」と 読んでは いけません。
　★この 製品は「消さない。印を つける」で 通して います。

## 分け方

| | 何を 見たか |
|---|---|
| ① 別の 消し方が ある | 台帳に 尋ねて、印の 列が あるか |
| ② 足すだけの 記録 | 消す 呼び出しも 印の 列も 無い |
| ③ **同じ 形** | **画面が `.delete()` を 呼ぶ** |

★★③の 見分けで いちばん 大事な こと ──
　★`.delete()` を 呼ぶ ファイルが、★**どの 鍵を 使うか**。
　★★裏方の 鍵（`service_role`）は RLS を 越えます。
　　★決まりが 無くても 消えます。★不具合には なりません。
　★★画面の 鍵だけが、★黙って 0行に なります。

## 分けた 結果

| 組 | 表 | 印の 列 | 消す 呼び出し | うち 画面から |
|---|---|---|---|---|
| 2 | `age_answer_changes` | — | 0 | 0 |
| 2 | `cohort_changes` | — | 0 | 0 |
| 2 | `email_change_log` | — | 0 | 0 |
| 2 | `events` | — | 1 | 0 |
| 2 | `feedback` | — | 0 | 0 |
| 2 | `item_acquisitions` | — | 0 | 0 |
| 2 | `link_consents` | — | 0 | 0 |
| 2 | `minor_billing_consents` | — | 0 | 0 |
| 2 | `notice_targets` | — | 0 | 0 |
| 2 | `org_posts` | — | 1 | 0 |
| 2 | `organizations` | — | 0 | 0 |
| 2 | `questionnaire_responses` | — | 0 | 0 |
| 2 | `user_notices` | — | 0 | 0 |
| 1 | `consent_records` | `withdrawn_at` | 0 | 0 |
| 1 | `org_invitations` | `expires_at`, `used_at` | 0 | 0 |
| 1 | `org_message_reads` | `read_at` | 0 | 0 |
| 1 | `org_messages` | `withdrawn_at` | 0 | 0 |
| 1 | `profiles` | `deleted_at` | 0 | 0 |
| 1 | `purchases` | `status` | 0 | 0 |
| 1 | `subscriptions` | `status` | 0 | 0 |
| 1 | `teacher_invitations` | `expires_at`, `used_at` | 0 | 0 |
| 1 | `teacher_student_links` | `revoked_at`, `status`, `accepted_at` | 0 | 0 |

## ③ 同じ 形（★見て いただきたい もの）　0件

★ありません。

## ① 別の 消し方が ある　9件

- `consent_records`
  - 印の 列 … `withdrawn_at`
- `org_invitations`
  - 印の 列 … `expires_at`, `used_at`
  - 印を つける 書き込み … `app/api/org/invitation/accept/route.js:93`　`used_at`
  - 印を つける 書き込み … `app/api/org/invitation/accept/route.js:110`　`used_at`
  - 印を つける 書き込み … `app/api/org/invitation/accept/route.js:130`　`used_at`
- `org_message_reads`
  - 印の 列 … `read_at`
- `org_messages`
  - 印の 列 … `withdrawn_at`
- `profiles`
  - 印の 列 … `deleted_at`
  - 印を つける 書き込み … `app/api/account/delete/route.js:207`　`deleted_at`
  - 印を つける 書き込み … `app/api/account/restore/route.js:30`　`deleted_at`
  - 印を つける 書き込み … `components/VocalTracker.jsx:9629`　`withdrawn_at`
  - 印を つける 書き込み … `components/VocalTracker.jsx:9662`　`withdrawn_at`
- `purchases`
  - 印の 列 … `status`
- `subscriptions`
  - 印の 列 … `status`
  - 印を つける 書き込み … `app/api/stripe/webhook/route.js:132`　`status`
  - 印を つける 書き込み … `app/api/stripe/webhook/route.js:227`　`status`
- `teacher_invitations`
  - 印の 列 … `expires_at`, `used_at`
- `teacher_student_links`
  - 印の 列 … `revoked_at`, `status`, `accepted_at`
  - 印を つける 書き込み … `components/VocalTracker.jsx:11289`　`revoked_at`, `status`

## ② 足すだけの 記録　13件

- `age_answer_changes`
  - 消す 呼び出しも 印の 列も ありません。
- `cohort_changes`
  - 消す 呼び出しも 印の 列も ありません。
- `email_change_log`
  - 消す 呼び出しも 印の 列も ありません。
- `events`
  - 消す 呼び出し … `app/api/cron/purge-events/route.js:29`　★裏方の 鍵（RLS を 越えます）
- `feedback`
  - 消す 呼び出しも 印の 列も ありません。
- `item_acquisitions`
  - 消す 呼び出しも 印の 列も ありません。
- `link_consents`
  - 消す 呼び出しも 印の 列も ありません。
- `minor_billing_consents`
  - 消す 呼び出しも 印の 列も ありません。
- `notice_targets`
  - 消す 呼び出しも 印の 列も ありません。
- `org_posts`
  - 消す 呼び出し … `app/api/org/posts/route.js:262`　★裏方の 鍵（RLS を 越えます）
- `organizations`
  - 消す 呼び出しも 印の 列も ありません。
- `questionnaire_responses`
  - 消す 呼び出しも 印の 列も ありません。
- `user_notices`
  - 消す 呼び出しも 印の 列も ありません。

## 直して いません

★★③が あっても、★決まりを 足して いません。
　★No.014 と 同じ 段取りで、★お決めを お待ちします。

## この 数えが 見て いない こと

- 印の 列は **試し用の 企画**に 尋ねました。★本番では ありません。
- 「足すだけの 記録」かは、★表に 付けた 注記を 読んで いません。
  ★消す 呼び出しも 印の 列も 無い、という ことだけ です。
- `.delete()` の 呼び出しは 字で 探します。
  ★表の 名前を 組み立てて 渡す 書き方は 見つけられません。
- 鍵の 見分けは **ファイル単位** です。
  ★1つの ファイルで 2つの 鍵を 使い分けて いると、粗く 出ます。
