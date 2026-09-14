# 外へ 出る 道 ── Opus の 3つの 問いへの 答え（2026-09-14）
全316行 / 末尾は「　★使わない のであれば、route ごと 消すのが いちばん 正直な 形です。」

★この 文は tools/outbound_routes_report.py が 書き出しました。
★中の 数と 一覧は、すべて リポジトリを 走査した 結果です。手で 書いていません。

★この 道具が 見られない もの ── Vercel の 管理画面、Supabase の 管理画面、
　各社の DPA の 本文、実際の 通信ログ。★これらは すべて「不明」と 書いています。

---

## Q1 ── それぞれの 道が、実際に 送っている 欄

### ★★答え ── 記録（entries）は、★出る 道が 1本 あります。★いまは 閉じています。

Opus の ご指摘は 正しいです。`app/api/advice/route.js` の `buildSummary` は、
★entries の 欄を そのまま 文に して、api.anthropic.com へ 送る 形に なっています。

★組み立てている 欄（★コードから 読みました。説明文からでは ありません）：

| # | 欄 | entries の 列か |
|---|---|---|
| 1 | `date` | いいえ（date） |
| 2 | `throat_condition` | ★はい |
| 3 | `voice_quality` | ★はい |
| 4 | `sleep_hours` | ★はい |
| 5 | `sleep_quality` | ★はい |
| 6 | `water_intake` | ★はい |
| 7 | `temperature` | ★はい |
| 8 | `humidity` | ★はい |
| 9 | `activity_type` | ★はい |
| 10 | `performance_quality` | ★はい |
| 11 | `ease` | ★はい |
| 12 | `throat_symptoms` | ★はい |
| 13 | `meal_notes` | ★はい |
| 14 | `notes` | ★はい |

★14 欄の うち 13 欄が entries の 列です。★残る 1つは `date` です。
★`meal_notes` と `notes` は 自由記述です。本人が 名前や 病名を 書けば、それも 渡ります。

### ★それでも「出ている」とは 言えません ── 門が 2つ あります

| | 門 | 場所 | いまの 状態 |
|---|---|---|---|
| ① | `AI_ADVICE_ENABLED === "true"` でなければ 403 | route.js:65-71 | ★未設定 → 閉 |
| ② | `ANTHROPIC_API_KEY` が 無ければ 500 | route.js:105-110 | ★一度も 設定されて いない |

★①は 認証より 前に あります。閉じているとき、entries を ★1行も 読みません。
★②は `lib/anthropic.js:4` の fetch より 前に あります。通信そのものが 起きません。

★『一度も 送っていない』の 裏づけは 2つ、★互いに 独立しています（2026-09-03 確認）。
　① 送り手側 ── Vercel の 環境変数に ANTHROPIC_API_KEY が 一度も 無い
　② 受け手側 ── Anthropic Console の 使用額 $0.00・過去7日 活動なし

★★ただし、★『読んでいない』とは 言えません。
　`route.js:88-93` の entries の 読み出しは、★鍵を 見る 前に あります。
　門①が 開いていて 門②が 閉じている間は、★読んで、サーバの 中に 留まります。
　いまは 門①も 閉じているので、その 状態にも なりません。

### ★STOP_AND_REPORT の 判断

| 問い | 答え |
|---|---|
| 要配慮個人情報が 国外へ 出る コードが あるか | ★あります |
| いま 開いているか | ★いいえ。2つの 門が 閉じています |
| これまでに 出たことが あるか | ★いいえ（送り手・受け手の 両側から 確認） |
| 法28条の 同意は 要るか | ★いま 開ける なら 要ります。開けない なら 要りません |

★ですので「止めて 報告」の 条件は、★半分だけ 当たります。
　★出ては いません。★出せる 形が 残っています。
　★大学へ 渡す 一覧に どう 書くかは、★運営者と Opus の ご判断です（下の ㋐）。

### ほかの 5つの 道の 欄

**supabase（Supabase（契約主体は 未確認））**
- ★entries の 全列（16欄）
- profiles の 全列
- そのほか 約20表の 全列
- ★entries 由来：throat_condition・voice_quality・throat_symptoms・sleep_hours ほか

**line（LINEヤフー株式会社（LY Corporation））**
- line_user_id（LINE の 利用者ID）
- 決まった 文面（呼びかけ）
- absoluteUrl('/')（アプリの 入口の URL）
- ★entries 由来の 欄：★ありません

**resend（Plus Five Five, Inc.）**
- user.email（送信者・返信先）
- ご意見の 本文（自由記述）
- category（ご意見の 種類）
- 宛先の メールアドレス
- 変更前／変更後の メールアドレス（★伏せ字）
- 知らせの 本文（定型）
- ★entries 由来の 欄：★ありません

**stripe（Stripe Japan, Inc.）**
- email
- metadata.supabase_user_id
- 支払いの 手続きに 要る 情報
- ★entries 由来の 欄：★ありません

**google-calendar（（契約なし。★利用者ご自身が 渡します））**
- レッスンの 題名
- 日時
- メモ（note・自由記述）
- ★entries 由来の 欄：★ありません

★`line` について 1つ 注記します。★中身は 送りませんが、
　`app/api/cron/line-reminder/route.js:108` が entries の `date` を 読み、
　★記録した 人には 送らない、という 判断に 使っています。
　★送られた という 事実じたいが「その日 記録していない」を 意味します。
　★中身では ありませんが、★記録の 有無は 相手に 伝わる 形です。

---

## Q2 ── Vercel は 一覧から 漏れているか

### ★★答え ── ★漏れています。

`lib/outboundRoutes.js` の 6件に Vercel は ありません。
Opus の お見立てどおり、★『送る先』の 台帳なので 載っていません。
★しかし 大学へ 渡す 委託先の 一覧には 要ります。★処理は そこで 起きています。

| 調べたこと | 結果 |
|---|---|
| vercel.json に regions の 指定 | ★ありません |
| route.js の preferredRegion | ★1つも ありません |
| cron の 本数 | 5 |
| 本番の ドメイン | https://woolsong.app（lib/baseUrl.js:12） |

### ★Opus が お求めの 3点 ── ★どれも この 道具では 読めません

| 求められた もの | 状態 | 理由 |
|---|---|---|
| 関数の 実行地域 | ★不明 | vercel.json に `regions` が ありません。★管理画面の 既定が 効きます |
| ログの 保管地域 | ★不明 | リポジトリに 手がかりが ありません |
| ビルド成果物の 置き場所 | ★不明 | 同上 |

★★推し量りません。ただし、★調べ方は はっきり しています。

　**実行地域** Vercel → Project → Settings → Functions → *Function Region*
　**ログ** Vercel → Project → Settings → *Log Drains* / Observability の 保管期間
　**契約主体** 請求書の ★発行元（★請求先では ありません。Stripe で 一度 つまずいた 所です）

★★ここが 大きい 点です。
　`app/api/advice/route.js` も `app/api/cron/*` も、★entries を 読むのは Vercel の 関数の 中です。
　保管が 東京でも、★読み出しと 処理が 起きる 場所は 関数の 地域です。
　★`regions` が 指定されて いないので、★そこが どこかを コードからは 言えません。

---

## Q3 ── 6件で 足りているか

### ★★答え ── ★相手は 6件で 合っています。★ただし 2つ、書き落としが あります。

**㋐ Vercel（Q2）** ── 相手として 1件 足りません。

**㋑ Resend の 送信箇所が 4 に 増えています** ── 台帳は 1つしか 書いて いません。

台帳の where：`app/api/feedback/route.js:51`

| # | 実際の 送信箇所 | 何を 送るか |
|---|---|---|
| 1 | `app/api/feedback/route.js:51` | ご意見の 本文・送信者の メール |
| 2 | `app/api/cron/pricing-notice/route.js:127` | お知らせの 定型文・宛先の メール |
| 3 | `lib/securityMail.js:50` | メール変更の お知らせ（★伏せ字）・変更前後の 宛先 |
| 4 | `lib/systemAlert.js:89` | 不具合の 知らせ（定型）・運営の 宛先 |

★相手（Plus Five Five, Inc.）は 変わりません。★国も 変わりません。
★変わるのは「何を 送るか」です。★台帳の `what` は ご意見だけを 書いています。

### ★調べて、★無かった もの

★『調べていない』と 区別して 残します。

| 種類 | 見つかった 数 |
|---|---|
| 解析（アクセス解析） | ★0 |
| 誤りの 追跡 | ★0 |
| 行動の 記録 | ★0 |
| 押し通知 | ★0 |
| SMS・電話 | ★0 |
| 画像の 配信 | ★0 |
| 地図 | ★0 |
| 控え（バックアップ）の 外部保管 | ★0 |
| Vercel の 解析 | ★0 |

★見張りが 2本、★これを 守って います。
　`components/tests/onboarding-counts.test.js:53`
　`components/tests/events.test.js:132`
★どちらも 解析の 取り込みを 禁じて います。★足すと 落ちます。

### ★そのほか、★調べて 外への 通信では なかった もの

| もの | なぜ 通信では ないか |
|---|---|
| `next/font/google`（app/layout.js:1） | ★ビルドのときに 取り込み、自分の ところから 配ります |
| `public/sw.js` | ★caches のみ。外部の host は 1つも ありません |
| 気温・湿度 | ★気象サービスからは 取りません。★本人の 入力です |
| 地図 | ★呼び出しが 1つも ありません |

### ★まだ 確かめて いない もの（★正直に 残します）

| もの | なぜ 不明か |
|---|---|
| Supabase Auth の メール送信 | ★登録確認・再設定の メールは Supabase が 送ります。|
| | ★独自 SMTP を 設定されて いるかは 管理画面でしか 分かりません |
| Supabase の 控え（バックアップ）の 置き場所 | ★管理画面でしか 分かりません |
| Vercel の 3点（Q2） | ★同上 |

---

## 整形した 一覧（★お決めの 形）

★`DPA_NO_ACCESS_CLAUSE` と `DPA_ACCESS_CONTROL` は、★各社の DPA の 本文を
　読まなければ 埋まりません。★この 道具は 読めないので、★全件 unknown です。
★★推し量って 埋めて いません（Opus の 決まり）。

```
VENDOR: Supabase（契約主体は 未確認）
REGION: 日本（東京・ap-northeast-1）
SOURCE: 運営者による 管理画面の 確認（2026-09-14 再確認）
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: ★entries の 全列（16欄）、profiles の 全列、そのほか 約20表の 全列
  ★entries 由来： 全列
PERSONAL_DATA: yes
NOTE: 本体の 保管先。A型（預かるだけ）。サーバは 東京。契約している 法人名は 未確認。
```

```
VENDOR: Anthropic Ireland, Limited
REGION: アイルランド（EU・EEA）／サーバの 所在は 未確認
SOURCE: Commercial Terms of Service（2025-06-17）の 定義条項。★居住地に 連動。
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: date、★throat_condition、★voice_quality、★sleep_hours、★sleep_quality、★water_intake、★temperature、★humidity、★activity_type、★performance_quality、★ease、★throat_symptoms、★meal_notes、★notes
  ★印は entries の 列（13 / 14）
PERSONAL_DATA: yes
NOTE: ★記録の 中身が 出る 唯一の サーバ側の 道。★2つの 門で 閉じています。
```

```
VENDOR: LINEヤフー株式会社（LY Corporation）
REGION: 日本
SOURCE: LINE開発者契約（2025-02-03）§1.3・§14.6
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: line_user_id（LINE の 利用者ID）、決まった 文面（呼びかけ）、absoluteUrl('/')（アプリの 入口の URL）
  ★entries 由来の 欄： なし
PERSONAL_DATA: yes
NOTE: ★記録の 中身は 送りません。★ただし entries を 読んで 送る／送らないを 決めます。
```

```
VENDOR: Plus Five Five, Inc.
REGION: アメリカ合衆国（カリフォルニア州法）
SOURCE: Terms of Service（2026-08-27）§1・§23
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: user.email（送信者・返信先）、ご意見の 本文（自由記述）、category（ご意見の 種類）、宛先の メールアドレス、変更前／変更後の メールアドレス（★伏せ字）、知らせの 本文（定型）
  ★entries 由来の 欄： なし
PERSONAL_DATA: yes
NOTE: ★送信箇所が 4つに 増えています。★台帳は 1つしか 書いていません（下の ㋑）。
```

```
VENDOR: Stripe Japan, Inc.
REGION: 日本
SOURCE: Stripe Services Agreement（2025-11-18）§12 Definitions
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: email、metadata.supabase_user_id、支払いの 手続きに 要る 情報
  ★entries 由来の 欄： なし
PERSONAL_DATA: yes
NOTE: ★2026-09-03 に 3つの 門を 入れて 閉じました。★門の 前に 通った 分は 不明。
```

```
VENDOR: （契約なし。★利用者ご自身が 渡します）
REGION: 不明（契約が ないので 書けません）
SOURCE: ─
DPA_NO_ACCESS_CLAUSE: no
DPA_ACCESS_CONTROL: no
FIELDS_SENT: レッスンの 題名、日時、メモ（note・自由記述）
  ★entries 由来の 欄： なし
PERSONAL_DATA: maybe
NOTE: ★<a href> です。fetch の 検索では 出てきません。★lessons 表であって entries では ありません。
```

```
VENDOR: Vercel Inc.（★契約主体 未確認）
REGION: ★不明（vercel.json に regions の 指定が ありません）
SOURCE: ★ありません。★管理画面でしか 分かりません
DPA_NO_ACCESS_CLAUSE: unknown
DPA_ACCESS_CONTROL: unknown
FIELDS_SENT: ★entries を 含む すべて（★関数の 中を 通ります）
PERSONAL_DATA: yes
NOTE: ★台帳に ありません。★大学向けの 一覧には 要ります。★Q2 の 3点が 未確認
```

---

## 決めて いただきたい こと

| | こと | 私の 見立て |
|---|---|---|
| ㋐ | advice の 道を どうするか | ★経路ごと 消す（④）。★門が 2つ ある 形を 残すより、|
| | | ★無い ほうが 大学へ 説明しやすいです。★UI は 既に ありません |
| ㋑ | Vercel を 台帳に 足すか | ★足す。★kind を 1つ 増やす 形に なります（infrastructure） |
| ㋒ | Resend の what を 直すか | ★直す。★いま 書いて あることが 事実と 違います |
| ㋓ | DPA 2条項を 誰が 読むか | ★私は 規約の 本文を 取れません。★運営者か Opus の お手で |

★㋐だけは、★私では 決められません。
　`AI_ADVICE_ENABLED` を 将来 使う お考えが あるかを 存じません。
　★使わない のであれば、route ごと 消すのが いちばん 正直な 形です。
