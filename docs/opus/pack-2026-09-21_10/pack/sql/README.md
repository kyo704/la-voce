# sql/ ── Opus が書いた台帳の移行（Code が当てる）

## ★事前確認の結果（2026-09-22・Opus が本番を読み取りだけで）

```yaml
した:
  - 参照している列 78個が本番に全部あるか → 足りない列 0
  - 呼んでいる関数（has_can・has_can_user・matching_visible・matching_suspended）が同じ引数の形であるか → 4つともある
  - 作る名前（索引6・引き金4・制約3）が既存とぶつからないか → ★制約1つがぶつかった（下の直し①）
  - 消すポリシー（performances_own・3つの _insert）が本番にあるか → 4つともある
  - 一意にする列に今の重複が無いか（purchases の payment_intent・assignments・org_billing）→ 0件
  - 関数・ポリシーの中の select の部分を「行を返さない形（where false）」で本番に流す → 文法・列・型のエラー 0
    （my_entitlements の集計・公開ページの組み立て・performances の条件・請求の変更の列の並べ方・YouTube の正規表現・導入期間の式）
  - 導入期間の式を6通りで流す → 期待どおり（うるう年 2028-02-29 を含む）
  - ★10〜14（2026-09-23 追加）も同じ事前確認: 新しい表の名前11個はぶつからない／引き金を付ける7表の id と org_id の有無を確認（org_invitations に id 無し）／jsonb の差分の取り方を本番で試した
  - ★10・11（2026-09-23 追加）も同じ事前確認: 参照する列 16個すべてあり／新しい表の名前6つはぶつからない／
    my_timetable.weekday は smallint・period_id は uuid（slot_key の作り方をそれに合わせた）／メールの正規表現・日本時間の日付・住所の作り方を本番で流して確認
見つけて直した:
  ⑰ 27: WITH ORDINALITY を列の定義と並べて書いていた（本番で試して 構文エラー）→ ROWS FROM(...) の中に入れる形に直した。
     ★役の一覧に無い名前を場面に書いたときに止まること・場面と役の組み合わせの作り方も、本番で式を流して確認
  ⑯ 21: 型の説明の1件が見本と5文字ちがっていた（t14「使っている楽器の札…」）→ 見本に合わせた。★15型の名前と説明を1件ずつ機械で突き合わせ、残り0件
  ⑮ 24・25 も同じ事前確認: set_config と読み戻し・uuid への変換・jsonb の配列・ON CONFLICT の対象・日本時間の日付を本番で実行して確認。
     ★24 で見つけた本番の穴: koen_session_changes と cohort_changes に、ポリシーが無いのに書ける権限だけが残っていた → revoke を入れた
  ⑭ 23 も同じ事前確認: 新しい表2つの名前はぶつからない／lessons・org_places・koen の列を確認／make_interval・時刻の変換（18:00 JST→09:00 UTC）・epoch の型を本番で実行して確認
  ⑬ 20・21 も同じ事前確認を実施: 新しい表9・索引3・制約6・引き金3の名前はぶつからない（enrollments_status_check だけ既存→作り直す形に）／
     参照する列12個すべて実在／slug・URL・合言葉・並び順の式を本番で流して確認／ON CONFLICT が部分索引の条件と一致することを確認
  ⑨ 18: koen_room_members の主キーに null 可の列を入れていた（null は主キーに入れられないので、1行も入らない）→ id を主キーにし、重複は unique（nulls not distinct・本番 17.6）で
  ⑩ 18: koen_payments.koen_id が「空にできない」のに「公演が消えたら空にする」になっていた（★今日の事故と同じ型）→ 空にできるように
  ⑪ 13: 子どもの枠・公演を消すと「緊急の連絡先を見た記録」も消えていた → 消えないようにし、呼び名と題を写す
  ⑫ 12: 稽古を消すと「変わったもの」の履歴ごと消えていた → 稽古は消せない（取り消しは canceled_at）
  ⑥ 19: enrollments の状態に 'paused'（休会）が本番にあった。私の check はそれを落とすところだった → 4つとも残す
  ⑦ 19: 卒業の日に新しい列を作ろうとしたが、既に left_at がある → それを使う
  ⑧ 18: 600人を超える人数で段が決まらず、何も返さない関数になっていた → 見本と同じ文言で止める
  ⑤ 16（新）: 束0 は「人が退会するとき」だけを直しており、「学校が閉じるとき」は 4つ＋1つの記録が消える設定のままだった（Sonnet の指摘）
     → org_id を SET NULL にし、学校名を写す列と引き金を足した。保存は1年（門下を開いた記録は3年）
  ④ 14: ops_audit_log.org_id に外部キーを付けていた → 学校を閉じるときに、消えた学校の id で記録を書こうとして失敗（Code が本番で発見・戻した）
     → 外部キーを外し、学校の名前を写す列を足した。記録は親より長生きする、が正しい（15 で直す）
  ③ 10: rotate_calendar_token の中で gen_random_bytes が見つからない（pgcrypto が extensions スキーマにあり、関数は search_path='public' で固定しているため）
     → extensions.gen_random_bytes(24) と名指しにした（search_path を広げる㋐は採らない。security definer の関数の search_path は狭いまま保つ）
     ※列の既定値は insert のときの search_path で解けるので動いていた。同じ理由で既定値も名指しに直した
  ① 01: purchases_status_check が本番に既にある（status in ('active','expired')）。if not exists で飛ばされ、'ended_early' を入れると違反になるところだった
     → 作り直して ('active','expired','ended_early')。'expired' は既存の値として残した
  ② 03: date_trunc に date を渡すと timestamptz になり、immutable と書いた関数が本当は immutable でなかった → p_start::timestamp に
できない（Opus は書き込みをしないため）:
  - create table・create function・create trigger・grant をじっさいに通すこと（plpgsql の本文の文法は、作るときに初めて確かめられる）
  → 試しの環境で流すのは Code。エラーは直さず Opus に
```


- 作成: Opus（本番の構造を読み取りで確かめて書いた。2026-09-22）
- 当て方: 試しに当てる → 各ファイルの「確かめ」を実在の試しの利用者で → tools/権限変更の型.md → decision_needed_check.py → 坂本さんの承認 → ★apply_migration（直接の SQL にしない）
- ★Opus の SQL は動かすまで正しいと言えない。エラー・食い違いが出たら、直さずに Opus に返してよい（Opus が直す）
- すべて冪等（if not exists・create or replace・drop policy if exists）

| ファイル | 中身 | 根拠 | 先に確かめること |
|---|---|---|---|
| 01_billing_foundation | subscription_items・stripe_events・purchases の列・my_entitlements() | 裁定166・169・167 A2 | サーバが「使えるか」を my_entitlements に寄せる |
| 02_student_price_consents | 学生の値段の同意の表と関数3本 | 裁定166 R2 | ― |
| 03_org_contracts_free_period | 学校の契約・導入期間の計算 | 裁定156・166 R4 | 36通りの試験を足す |
| 04_profile_consent_guards | LINE の連携・登録日をサーバ専用に／同意の日時を台帳が入れる | 裁定167 A3・A4 | ★画面が line_* ・created_at を直接書いていないか |
| 05_uniques | 有効な担当・学校の請求の重複を止める | 裁定169 | ― |
| 06_logs_written_by_ledger | 役職の変更・請求の変更は引き金で、書き出しは record_export で記録。利用者の直接の insert をやめる／★changed_by の NOT NULL と SET NULL の食い違い（退会が止まる）を直す | 裁定161 FX8 | ★画面・サーバの3表への insert を先に消す |
| 07_ops_alerts | 起きた失敗を全部残す ops_alerts・raise_alert()・契約者の移し替えの知らせの失敗を残す | 裁定168 ★5・F2 | サーバのメールの仕組み（notified_at を入れる） |
| 08_portfolio_performance | 録画は YouTube だけ・公開ページは get_public_portfolio だけ・本番の記録は在籍する学校の行事だけ | 裁定167 B1・B2・C3 | ―（出す列は名指しにした） |
| 09_drop_org_message_reads | 古い表を消す | 裁定159 §8 | リポジトリに呼び出し0件 |

| 10_lesson_allocation（★2026-09-23 修正） | レッスン割：回・希望（◎△×）・だめな日・カレンダーの住所・地図・授業コマの自動× | 裁定139・152 R4 | 見本の「日程を組む」と slot_key の作り方を合わせる。★rotate_calendar_token は extensions.gen_random_bytes に直した（pgcrypto は extensions スキーマ） |
| 11_portfolio_homepage | 節（kind）を15種に・形を「持つ」・選び直しの無料/480円・お問い合わせの受け口 | 裁定127・128・129・146 | 型の鍵（type_key）の名前を見本と揃える |

| 12_productions_core | 公演：公演・出演者と運営・表（行×枠）・稽古と本番・変わったもの | 裁定141〜152 | 見本の枠の作りと突き合わせ |
| 13_production_children | 子ども（保護者が持ち主）・緊急の連絡先は RPC だけ（記録を先に書く）・見た記録 | 裁定147・167 C | 画面は出発の後 |
| 14_ops_audit_log（★2026-09-23 修正） | 学校の管理の操作の記録（列の名前だけ・値は残さない）・★90日で消す（坂本さん 2026-09-23） | 裁定169 #8 | org_invitations に id 列が無い（target_id は null になる）。★org_id に外部キーを付けない（付けると「学校を閉じる」が止まる） |
| 15_fix_ops_audit_fk | ★14 を当てたあとの直し（外部キーを外す・学校の名前を写す） | 2026-09-23 の事故 | 14 を当てていなければ、14（修正版）だけでよい |

| 16_logs_survive_school_close | ★学校を閉じても記録を消さない（5つの記録の表・学校名を写す・保存1年／門下は3年） | 裁定172 | ★束0 の続き。先に当てるほど安全 |

| 18_production_rooms_calls_tiers | 公演の楽屋・入り（呼び出し・子どもは解散が必須）・段と差額（600人超は扱わない） | 裁定143・148・152 R3・155 | 12 のあとに |
| 19_type_keys_and_school_year | 型の鍵の縛り（Web t01〜t15・紙 T1〜T6）／年度の切り替え（進級・卒業は状態だけ） | 裁定146・138 | ★画面が status='left' をどう扱っているか Code が確認 |
| 17_fix_withdrawal_notnull | ★退会が止まる11か所（SET NULL なのに NOT NULL）。名前を写す列と引き金も | 裁定168 ★1 の続き | ★最優先。データは動かさない |

| 20_productions_rest | 公演の残り：出欠・出演料・作品の雛形（場面×役）・合言葉で入る・当日の進行 | 裁定141〜152 | 12・18 のあと |
| 21_homepage_rest | ホームページの残り：住所（slug）の形・節の日付と並び・公開の切り替え・型の一覧を台帳に（15型） | 裁定128・129・146 | 11・19 のあと |
| 22_fix_productions_applied | ★本番に当たっている 12・13 の直し（保護者の退会で子どもが消える／見た記録が消える／稽古を消すと履歴が消える） | 2026-09-23 の見直し | ★12・13 は本番適用済み。この1本で直す |

| 23_productions_calendar_and_events | 公演と学校の行事のつながり・カレンダー（ICS・サーバだけ）・「変わったもの」の既読（通知は出さない） | 裁定87・139・141・152 R1 | 20 のあと |

| 24_actor_id_and_log_writes | 「誰が」を service role でも残す（裁定173）＋記録の表への直接の書き込みを閉じる（FX8 の残り） | 裁定173・161 FX8 | 06 のあと |
| 25_production_screens_functions | 公演の画面の関数（重なり・出欠をまとめて・当日の一枚） | 裁定141〜148 | 18・20 のあと |

| 26_works_catalog | 作品のカタログ（出どころ・揃い方・重複よけ・名前で探す・取り込みの記録） | 裁定174 | 20 のあと。取り込みは試しで先に |

| 27_works_import_functions | 作品を1つの JSON で入れる／まとめて取り込む／取り込みを戻す／名前で探す | 裁定174 | 26 のあと。★サーバだけが呼ぶ |

## まだ書いていない（裁定171 の週の順に Opus が書く）

| 何 | 中身 | いつまでに Opus が出すか |
|---|---|---|
| 本番の試しデータを消す | FX9（坂本さんの判断のあと） | 10/6 |
