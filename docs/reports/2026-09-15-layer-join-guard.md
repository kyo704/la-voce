# 2つの 層を 混ぜない ための 見張り（★3つの 面）
全176行 / 末尾は「　「if the guard flags any of these, it is wrong. fix the guard」」

★2026-09-15 ／ ★裁定 その55・その57（★Opus・坂本さん 承認）
★この 文は tools/layer_join_guard.py が 書き出しました。

## なぜ 要るか

★★弁護士の 確認を **取らない** と お決めに なりました（★その55）。
★★これは、その **代わりの 守り** です。
　★もし 突合（Q&A A7-41）の 読み方が 誤って いても、
　★「★同じ 鍵の 下に 置いて いた」までで 留まります。
　★★「★混ぜて いた」には なりません。
　★直せる 指摘と、★形が 壊れて いる ことの ちがい です。

## ★線 ── ★広すぎては いけません

| | |
|---|---|
| ✕ | ★記録の 層 × 学務の 層 ── ★1つの まとまりの 中で 読む |
| ○ | ★学務どうし ── ★自由。学年別の 出席率・請求人数・空きコマ すべて |
| ○ | ★記録どうし ── ★自由。本人が 登録した 本番 × entries も |
| ○ | ★本人の その他 × 学務 ── ★自由。お名前を 引く など |

★★`org_events` × `entries` は ✕ です。
　★拡張④は、★**学生が 自分で 登録した 本番**だけを 使います。

### ★★1度 広すぎました（★2026-09-15・同日）

★はじめ `profiles` と `link_consents` を 記録の 層に 入れ、★**7件**を ✕ と 数えました。
★★7件 とも 誤り です ──

| 関数 | 何を つないで いたか | なぜ ○ か |
|---|---|---|
| `get_org_member_names` | memberships × profiles | ★お名前を 引くだけ |
| `get_invitation_teacher` | teacher_invitations × profiles | ★同じ |
| `get_my_teacher_names` | teacher_student_links × profiles | ★同じ |
| `accept_teacher_invitation` | teacher_student_links × link_consents | ★つながりの 仕組み そのもの |

★★Opus の 線引きは「★本人の もの」では なく、★「★**記録の 中身**を 持つ もの」です。
　★だから 層を **3つ**に 分けました ── 記録／学務／★本人の その他。

## 表の 一覧（★`tools/layer_tables.py` が 1つだけ 持ちます）

### ① 記録の 層（★危ない 側） ── 9 表

| 表 | わけ |
|---|---|
| `article_notes` | ★本人の 書き込み（★自由記述の 中身） |
| `cycle_periods` | ★周期の 開始日（★本人だけ・先生にも 見せません） |
| `entries` | ★記録そのもの |
| `import_staging` | ★★1年ぶんの 取り込みの 置き場。★列が entries そのものです（throat_condition・voice_quality・voice_memo・meal_notes・weight_kg ほか）。★★2026-09-15、★Opus の 一覧は これを 学務に 置いて いました。　★列を 読むと 記録の 層です。★anon にも authenticated にも 権限が ありません。 |
| `notes` | ★本人の ノート（★自由記述の 中身） |
| `performance_results` | ★その 本番の 出来（★本人が 書いた 中身） |
| `performances` | ★★本人が 自分で 登録した 本番。★Opus の 但し書き ──　★『学生が 自分で 登録した 本番 × entries は ○（同じ 層）』。　★★`org_events` から 日付を 引いた 時点で、★層を またぎます |
| `period_markers` | ★本人が 印を つけた日（★体の こと） |
| `questionnaire_responses` | ★本人の 答え（★中身） |

### ② 学務の 層（★もう 一方） ── 18 表

| 表 | わけ |
|---|---|
| `assignments` | ★先生の 受け持ち |
| `attendance` | ★レッスンの 出欠 |
| `enrollments` | ★生徒の 在籍 |
| `lessons` | ★レッスンの 日程 |
| `memberships` | ★職員の 在籍 |
| `notice_batches` | ★お知らせの 束 |
| `notice_targets` | ★お知らせの 宛先 |
| `org_event_participants` | ★行事の 出欠 |
| `org_events` | ★学校の 行事 |
| `org_invitations` | ★教室への 招待 |
| `org_master` | ★学校の 形（学部・学科・学年） |
| `org_message_reads` | ★連絡を 読んだ 印 |
| `org_messages` | ★学校の 連絡 |
| `org_posts` | ★役職と できること |
| `organizations` | ★教室・学校 |
| `teacher_invitations` | ★先生からの 招待 |
| `teacher_notes` | ★先生が 生徒に ついて 書く もの |
| `teacher_student_links` | ★先生と 生徒の つながり |

### ③ 本人の その他（★学務と つないで よい） ── 23 表

| 表 | わけ |
|---|---|
| `account_deletions` | ★本人の 退会 |
| `age_answer_changes` | ★本人の 年齢の 答えの 変わり |
| `article_progress` | ★本人の 読んだ ところ |
| `chapter_state` | ★本人の 進み |
| `character_inventory` | ★本人の 持ちもの（★羊） |
| `cohort_changes` | ★本人の 群の 変わり |
| `consent_records` | ★本人の 同意 |
| `email_change_log` | ★本人の メールの 変わり |
| `events` | ★本人の 行事（★org_events とは 別の 表） |
| `item_acquisitions` | ★本人が 受け取った もの（★羊） |
| `link_consents` | ★先生と つながる ことへの 同意。★つながりの 仕組みの 一部 |
| `minor_billing_consents` | ★本人（保護者）の 同意 |
| `my_periods` | ★本人の コマ割り |
| `my_timetable` | ★本人の 時間割 |
| `onboarding_counts` | ★数だけ（★人を 指しません） |
| `profiles` | ★本人の 情報（★お名前・職業ほか）。★学務と つないで よい |
| `project_master` | ★本人の 舞台の 一覧 |
| `purchases` | ★本人の 買いもの |
| `recovery_codes` | ★本人の 合いことば |
| `repertoire_tessitura` | ★本人の 曲の 音域 |
| `role_master` | ★本人の 役の 一覧 |
| `subscriptions` | ★本人の 契約 |
| `user_notices` | ★本人に 出した お知らせの 控え |

### ★未決（★お裁きを お願いします） ── 3 表

| 表 | わけ |
|---|---|
| `_a13_policy_backup` | ★決まりの 控え（★仕事の 跡） |
| `feedback` | ★本人が 送った ご意見。★運営が 読みます。★どちらとも 言えます |
| `system_alerts` | ★運営への 知らせ。★人を 指しません |

## 見た 結果

| 面 | 見た もの | 混ざって いる |
|---|---|---|
| ① 倉庫の SQL | `supabase/**/*.sql` の 関数・ビュー | **0** |
| ② 台帳の 関数 | ★**見て いません** | ─ |
| ③ 画面・サーバ（1つの 問い） | `components` `lib` `app` | **0** |
| ③-2 目で 見る 候補 | 1つの 関数の 中で 2つの 層 | 0 |
| ★どの 層にも 無い 表 | | 0 |

## ② 台帳の 関数 ── ★いまの 状態

★★**見て いません。**★書き出しが ありません。

★★「通った」では ありません。★「★見て いない」です。
　★黙って 通すのが、★いちばん 危ない から です。

★手順 ── `supabase/check_layer_join_catalog.sql` を 流し、
★出た JSON を `docs/reports/_catalog-functions.json` へ 貼って ください。

### ★★2026-09-15、★Opus から 結果だけ 届いて います

| | |
|---|---|
| 台帳の 関数 | 66本 |
| entries と 学務を 1つに して いる 関数 | **0本** |
| entries を 読む 関数 | 2本 ── `admin_entry_stats()` ／ `character_unlock_summary(uuid)` |
| どちらも | ★entries だけ。★つないで いません |

★★これは **私が 見た もの では ありません**。★受け取った 結果 です。
　★★道具の ②が「見て いない」と 言い続けるのは、★そのため です。
　★★JSON を 置けば、★私の 側でも 同じ ことを 確かめられます。

★★あわせて 1件、★別の 話として 挙がって います（★層の 話では ありません）──
　★`admin_entry_stats()` は SECURITY DEFINER で、★呼ぶ人の 確かめが 中に ありません。
　★全員ぶんの 数を 返します。★いまは `is_admin` が 48人中 0人 で 届きません。
　★`get_student_entries` と 同じ 形 ですが、★片づけて は いません。
　★★お裁きを お願いします。

## ★この 見張りが 見て いない こと

| | |
|---|---|
| 2つの 問いの 結果を、あとで JavaScript で 結ぶ | ★見えません（★③-2 が 候補） |
| 組み立てて 作る 問い（動的SQL） | ★見えません |
| 台帳の 書き出しが 無い とき | ★②は 見て いません |

## ★校正（★1度も 落ちた ことの ない 見張りは 信じられません）

★`components/tests/layer-join.test.js` が、★毎回 確かめます ──

| | |
|---|---|
| ★わざと 混ぜた SQL を 置く | ★名指しで 出て、★落ちる |
| ★わざと 混ぜた 画面を 置く | ★同じ |
| ★学務どうし・お名前引きを 置く | ★**止めない**（★広すぎない こと） |

★★④が いちばん 大事 です。★Opus の 言葉 ──
　「if the guard flags any of these, it is wrong. fix the guard」
