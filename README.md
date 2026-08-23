# La Voce — 声楽家のための体調記録アプリ（現在：無料実験公開版）

Next.js + Supabase（認証・データベース）で構成された、誰でも会員登録して自分専用のデータを
記録できるWebアプリです。**現在は実験公開期間中につき、全機能を無料で開放しています**
（クレジットカード登録は不要）。登録時に名前・職業（学生の場合は学校名）・メールアドレスを
collectし、どんな機能が求められているかを見ながら育てていくフェーズです。

決済（Stripe）の仕組み自体はコードの中に残してあるので、後で有料化したくなったら
`REQUIRE_SUBSCRIPTION=true` に切り替えるだけで再度有効化できます（詳細は7章）。

---

## 0. 全体像

- **フロントエンド／サーバー**: Next.js（Vercelにデプロイ）
- **会員登録・ログイン・データベース**: Supabase（無料枠あり）
- **決済（今は未使用。後で有料化する時のために温存）**: Stripe
- ユーザーごとのデータは Supabase の Row Level Security（行レベルセキュリティ）により、
  **本人しか読み書きできない**ように設定されています。
- 管理者画面（`/admin`）で、登録者の名前・職業・登録日・記録数が一覧できます。

**今すぐ必要なもの**: Supabaseアカウントと、デプロイ用のVercel/GitHubアカウントだけです。
Stripeのアカウントは今は不要です（2章は有料化する時に読んでください）。

**費用の目安**（2026年時点の一般的な料金体系。必ず各社の最新情報をご確認ください）
- Supabase: 無料プランで十分始められます。利用者数が増えたら有料プラン（月$25〜）を検討
- Vercel: 個人の無料プランで始められます。アクセスが増えたり商用色が強くなったらProプラン（月$20〜）を検討

---

## 1. Supabaseのセットアップ

1. https://supabase.com でプロジェクトを新規作成
2. 左メニュー「SQL Editor」を開き、`supabase/schema.sql` の中身を全部貼り付けて実行
3. 「Project Settings」→「API」で以下を控える
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`（**絶対に公開しないこと**）
4. 「Authentication」→「Providers」で Email が有効になっていることを確認
5. 「Authentication」→「URL Configuration」で、Site URL とリダイレクトURLに
   デプロイ後のURL（例: `https://your-app.vercel.app/auth/callback`）を追加

---

## 2. Stripeのセットアップ（今はスキップしてOK）

**実験公開期間中はこの章は不要です。** 後で有料化したくなったら戻ってきてください。

1. https://stripe.com でアカウントを作成（本番利用には本人確認が必要です）
2. 「商品」から新しい商品を作成し、価格（月額・サブスクリプション）を設定
   → 作成した価格のIDが `STRIPE_PRICE_ID`
3. 「開発者」→「APIキー」から シークレットキー を控える → `STRIPE_SECRET_KEY`
4. Webhookは手順4（デプロイ後）で設定します
5. すべて設定できたら、環境変数 `REQUIRE_SUBSCRIPTION` を `true` にして再デプロイすると、
   ダッシュボードと`/billing`が有料プラン必須の元の挙動に戻ります

---

## 3. ローカルでの動作確認

```bash
cp .env.local.example .env.local
# .env.local に上記で控えた値を記入する

npm install
npm run dev
```

`http://localhost:3000` で表示を確認できます。
Stripe Webhookをローカルで試す場合は Stripe CLI（`stripe listen --forward-to localhost:3000/api/stripe/webhook`）を使うと、
表示された `whsec_...` を `STRIPE_WEBHOOK_SECRET` に設定できます。

---

## 4. Vercelへのデプロイ

1. このプロジェクトをGitHubリポジトリにpush
2. https://vercel.com で「Add New Project」→ そのリポジトリを選択
3. 環境変数（`.env.local` の中身すべて）をVercelの「Environment Variables」に設定
   - `NEXT_PUBLIC_SITE_URL` は実際のデプロイURL（例: `https://your-app.vercel.app`）にする
4. デプロイ完了後、そのURLをコピーし、Stripeダッシュボードの「開発者」→「Webhook」で
   エンドポイント `https://your-app.vercel.app/api/stripe/webhook` を追加。
   購読するイベントは以下：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 発行された署名シークレット（`whsec_...`）を `STRIPE_WEBHOOK_SECRET` としてVercelの環境変数に追加し、再デプロイ
6. Supabaseの「URL Configuration」にも本番URLを追加（手順1参照）

---

## 5. 独自ドメインをつける場合

Vercelの「Settings」→「Domains」から追加できます。追加後、`NEXT_PUBLIC_SITE_URL` と
SupabaseのURL設定、Stripe Webhookのエンドポイントも新しいドメインに合わせて更新してください。

---

## 6. 管理者画面

`/admin` に、全ユーザーの名前・メール・職業（または学校名）・登録日・記録数を一覧できる
管理者専用ページがあります。今回の実験公開の目的（どんな人が使い、どんな機能を求めているか
把握する）に直接役立つはずです。

1. 自分のアカウントで一度サインアップ・ログインする
2. SupabaseのTable Editorで `profiles` テーブルを開き、自分の行の `is_admin` を `true` に変更
3. `/admin` にアクセスすると一覧が表示されます

管理者への昇格は、セキュリティのためあえてアプリ内UIを用意せず、
SupabaseのTable Editorから直接行う設計にしています。

---

## 7. AIアドバイス機能

「AIアドバイス」タブでは、直近2週間の記録（食事メモ・自由メモの文章を含む）をAnthropic API（Claude）に渡し、
傾向を踏まえたアドバイスを生成します。

1. https://console.anthropic.com でAPIキーを発行
2. `.env.local`（およびVercelの環境変数）に `ANTHROPIC_API_KEY` を設定
3. 利用のたびにAnthropic APIの従量課金が発生します（ユーザーが「アドバイスを生成する」ボタンを押した時のみ実行されるので、コストはコントロールしやすい設計です）
4. `app/api/advice/route.js` の `SYSTEM_PROMPT` を編集すると、アドバイスのトーンや注意事項を調整できます
5. 医学的判断は行わない・服薬指導はしない、という制約をプロンプトに入れていますが、AIの出力を完全に制御できるわけではない点はご留意ください

---

## 8. iOSアプリ化してApp Storeに掲載する（Capacitor）

このプロジェクトには [Capacitor](https://capacitorjs.com) の設定が含まれており、
デプロイ済みのWebアプリをそのままiOSアプリとして包んで配信できます。

**方針**: Appleの規約上、日本を含む多くの国では「アプリ内で完結する購読の販売」はApple純正の
In-App Purchaseが必須です。それを避けるため、このアプリは **ネイティブアプリ内では新規登録・決済を一切表示せず、
「すでにウェブサイトで登録した人がログインするだけ」の形にしています**（Netflixなどと同じ、
Appleの「Multiplatform Services」例外＝Guideline 3.1.3(b) に沿ったパターンです）。
これはCapacitorが付与する専用のUser-Agentをサーバー側（`lib/isNativeApp.js`）で検知し、
サインアップ画面や「お試しを始める」ボタンを自動的に非表示にすることで実現しています。

### 手順（Xcodeが使えるMacが必要です）

1. まず本番環境にデプロイし、確定したURL（例: `https://la-voce.vercel.app`）を用意する
2. `capacitor.config.json` を編集する
   - `appId`: 逆ドメイン形式の一意なID（例: `com.yourname.lavoce`）
   - `appName`: アプリ名
   - `server.url`: 手順1のURL
3. ターミナルで:
   ```bash
   npm install
   npx cap add ios
   npx cap sync
   npx cap open ios
   ```
   これでXcodeが開きます。
4. Xcodeで: Signing & Capabilities に自分のApple Developerチームを設定、アプリアイコン（1024×1024のPNGが必要）を追加
5. [Apple Developer Program](https://developer.apple.com/programs/)（年$99）に登録していなければ登録
6. [App Store Connect](https://appstoreconnect.apple.com) でアプリのレコードを作成
   - プライバシーポリシーURL: `https://your-domain/legal/privacy`
   - サポートURL、カテゴリ、年齢レーティング等を入力
7. シミュレーターまたは実機で動作確認（`npx cap run ios` またはXcodeの実行ボタン）
8. Xcodeで Product → Archive → Organizerからアップロード
9. App Store Connectの審査情報欄に、**「本アプリはウェブサイトで登録済みのユーザーがログインして利用するアプリです。新規登録・購読はアプリ内では行いません」という趣旨の説明と、審査用のテストアカウント（メール・パスワード）を必ず記載**してください。アプリ内に登録手段がないため、これがないと審査担当者がログインできず差し戻されます。
10. 審査に提出

### 注意点（正直な所感）

- WebViewでリモートURLを読み込む方式のため、**通信環境がないと動作しません**（オフライン対応は別途実装が必要）
- Appleの審査基準はガイドライン文面と実際の運用に幅があり、「ウェブサイトでの登録が前提」という説明がしっかり審査ノートに書かれていても、機能不足（Guideline 4.2）を理由に差し戻されるケースも報告されています。1回で通らない前提で臨むことをおすすめします
- Androidも同じ設定でほぼそのまま `npx cap add android` で対応できます（Google Playは審査・規約がAppleほど厳しくないため、比較的通りやすい傾向があります）
- これは法的な確定情報ではありません。本格的な商用リリースの前に、App Store申請の経験がある方に一度レビューしてもらうと安心です

---

## 9. 公開前にやっておくこと（法務まわり）

- `app/legal/tokushoho/page.js`（特定商取引法に基づく表記）
- `app/legal/privacy/page.js`（プライバシーポリシー）
- `app/legal/terms/page.js`（利用規約）

いずれも `［ ］` の部分を実情に合わせて埋めてください。これらは草案であり法的助言ではないため、
実際の公開前に一度、専門家（弁護士・行政書士等）に確認することをおすすめします。
特に、個人で運営する場合の特定商取引法上の表記義務（住所・電話番号の扱いなど）は、
消費者庁のガイドラインを確認するか専門家に相談してください。

---

## 10. ディレクトリ構成

```
app/
  page.js                 ランディングページ
  signup/page.js          会員登録（氏名・メール・生年月日・パスワード）
  login/page.js           ログイン
  auth/callback/route.js  メール確認リンクの受け口
  billing/page.js         プラン状況の表示・お試し開始・解約導線
  dashboard/layout.js     ログイン＆サブスク状態のガード
  dashboard/page.js       アプリ本体を表示
  api/stripe/checkout     Stripe Checkoutセッション作成
  api/stripe/portal       Stripeカスタマーポータル作成
  api/stripe/webhook      Stripe Webhook受信（サブスク状態をDBに反映）
  api/advice              AIアドバイス生成（Anthropic APIを呼び出す）
  admin/page.js           管理者専用：全ユーザー一覧
  legal/*                 特商法表記・プライバシーポリシー・利用規約
components/
  VocalTracker.jsx        アプリ本体（記録・履歴・分析・AIアドバイス）
  SignupForm.jsx          会員登録フォーム（ネイティブアプリでは非表示）
  CheckoutButton.jsx / PortalButton.jsx
lib/
  isNativeApp.js           Capacitorアプリからのリクエストかどうかを判定
capacitor.config.json      Capacitorの設定（iOS/Androidアプリ化）
capacitor-www/              Capacitor用の最小プレースホルダー
lib/
  supabase/client.js      ブラウザ用Supabaseクライアント
  supabase/server.js      サーバー用（Cookie経由で認証）
  supabase/admin.js       サービスロール用（Webhook等、信頼できるサーバー処理専用）
  stripe.js               Stripe SDK
  tokens.js               配色などのデザイントークン
supabase/schema.sql        データベーススキーマ（Supabase SQL Editorで実行）
```

---

## 11. 動作の流れ（現在：無料実験公開版）

1. `/signup` で登録（名前・メール・職業または学校名・パスワード）→ 確認メールのリンクをクリック
2. `/auth/callback` を経由して `/billing` へ。実験公開中は「無料でご利用いただけます」という
   案内が出るだけで、カード登録は求められない
3. 「アプリを開く」から `/dashboard` へ進み、そのまま全機能が使える

（有料化した場合の流れは、`REQUIRE_SUBSCRIPTION=true` にした後は元のREADME 2章の手順に従ってください）

---

## 12. 動作確認できていない点について

このコードはこの場では実行・ビルドテストができない環境で作成しているため、
`npm install` 後に初回ビルド（`npm run build`）でエラーが出る可能性があります。
エラーメッセージを共有いただければ、一緒に修正します。
