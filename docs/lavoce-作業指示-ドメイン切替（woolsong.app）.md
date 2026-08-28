# 作業指示｜ドメイン切替 la-voce.vercel.app → woolsong.app

**Claude Sonnet 5 へ。ブランド名の改名（別紙）とは別に、URLの切替を行います。**

**★G2（15〜20人への配布）を通過済みです。つまり、
すでに他人の端末にインストールされたPWAと、配ったリンクが存在します。**
**一度に切り替えてはいけません。**

読む順番：作業指示-Woolsongへの改名.md → 本書。

---

## 0. 決まっている事実

```
新   woolsong.app          apex＝本番（Production）
     www.woolsong.app      308 で apex へ転送
旧   la-voce.vercel.app    ★削除しない。最終的に308で woolsong.app へ転送
Supabase Auth の Redirect URLs には★新旧の両方を残す
```

---

## 1. 原則

```
① ★段階を分ける。5つのフェーズに分け、間に実機確認のゲートを置く。
② ★外部サービスの向き先を先に変える。転送は最後。
   （LINE の Webhook は 308 を追いません。先に変えないと届かなくなります）
③ ★絶対URLの出どころを1か所にまとめる。各所に散らさない。
④ ★旧オリジンの Service Worker を先に無効化する。転送より前。
⑤ ★テスターは一度ログアウトされる。避けられないので、先に伝える。
```

### なぜ⑤が避けられないか

```
la-voce.vercel.app と woolsong.app は★別のオリジンです。
Cookie はオリジンをまたげません（登録可能ドメインが違うため
Domain 属性でも共有できません）。
```

**したがって全員が再ログインします。** 隠さず、先に案内してください。

---

## 2. 影響マップ（先に全部洗い出す）

```
壊れうる    Supabase Auth の Site URL / Redirect URLs
壊れうる    確認メール・パスワード再設定メールのリンク
壊れうる    ★LINE Messaging API の Webhook URL（308を追わない）
壊れうる    LINE Login / LIFF のコールバック（使っていれば）
壊れうる    ★旧オリジンの Service Worker とキャッシュ
壊れうる    PWA の manifest（id / start_url / scope）
壊れうる    ★インストール済みPWA（テスターの端末）
確認要      OG画像（@vercel/og）と metadataBase
              ★この案件には OG画像がありません（2026-08-28 確認）。
                openGraph / og:image / ImageResponse は app・lib・components の
                どこにも1件もなく、metadata を宣言しているのは
                app/layout.js（metadataBase・title・description・icons）と
                app/start/page.js（title のみ）の2つだけです。
                共有カードを作らないことは guard-leak.test.js が検査しており、
                以前からの判断だと読めます。
                したがってゲートAの「OG画像のURLが新ドメインで出る」は、
                確かめる対象がありません。metadataBase の設定だけが該当し、
                その値は /start が画面に出す住所で確認できます
                （getBaseUrl() の戻り値をそのまま表示しているため）。
確認要      招待コードのリンク生成
確認要      ICS フィードの URL と PRODID
確認要      cron（keep-alive が旧URLを叩いていないか）
確認要      9言語のコピー文言にURLが直書きされていないか
影響なし    テーブル名・列名・バケット名・環境変数の★名前
影響なし    LINE の友だち追加URL（line.me のため）
```

---

## ★進捗（2026-08-28 時点）

```
Phase 0   ✅ 完了・確認済み
ゲートA   ✅ 通過（Production）／★Preview だけ未確認
Phase 1   ✅ 完了・確認済み（ゲートB 通過）
Phase 2   ⬜ これから
Phase 3   ⛔ ★配信と更新の確認.md §3・§5 が終わるまで着手しない
Phase 4   ⬜ Phase 3 のあと、数日置いてから
```

**Phase 0（0006999 ほか）**
`lib/baseUrl.js` に集約。`metadataBase` もここから。
2026-08-28 に OG と canonical を追加（03ed0a0）。それまで OG タグが
1つも出ておらず、★ゲートAの「OG画像のURLが woolsong.app で出る」を
確かめる対象そのものがありませんでした。いまは出ています。

  <meta property="og:url" content="https://woolsong.app"/>
  <meta property="og:image" content="https://woolsong.app/icons/icon-1024.png"/>
  <link rel="canonical" href="https://woolsong.app"/>

★これは `NEXT_PUBLIC_SITE_URL` が Production に正しく入っている
　証拠でもあります（未設定なら *.vercel.app が出ます）。
★共有画像は暫定（正方形のアイコン流用）。横長1200×630は別の作業。
★Preview デプロイでの確認だけ、まだ行っていません。

**Phase 1（コードの変更なし・1ad454e）**
§5-3 を監査した結果、★変えないと決めました。

  emailRedirectTo / redirectTo   window.location.origin 由来のまま
  OAuth                          使っていない（該当なし）
  Cookie の Domain 属性          付いていない（§16-6 のとおり）

理由: 新旧2つのドメインが同時に生きている期間があります。
window.location.origin は、その人がいま見ているドメインを返すので、
旧URLから登録した人には旧URLの確認リンクが届き、完了できます。
getBaseUrl() に固定すると、旧URLにいる人に新URLのリンクを送ることに
なり、転送がまだ無い期間は手続きの途中で行き止まります。
★寄せてよいのは Phase 4 のあと。理由ごとテストに固定しました。

**ゲートB（2026-08-28・坂本さんが実機で確認）**
新旧の両方のURLで、登録→確認メール→リンク→ログイン、
パスワード再設定→メール→再設定、ログアウト→再ログイン。
★どちらのドメインでも問題なし。

---

## 3. Phase 0｜絶対URLの出どころを1か所にする

**先にこれをやらないと、以降の作業が総当たりになります。**

```ts
// lib/baseUrl.ts
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
```

```
Vercel の環境変数
  Production  NEXT_PUBLIC_SITE_URL = https://woolsong.app
  Preview     ★設定しない（VERCEL_URL を使う）
  Development ★設定しない
```

**やること**

```
□ 絶対URLを組み立てている箇所を全部洗う
     grep -rn "vercel.app\|la-voce\|VERCEL_URL\|https://" --include=*.ts --include=*.tsx
□ すべて getBaseUrl() 経由に置き換える
□ ★metadataBase を getBaseUrl() から設定する（Next.js の Metadata）
□ 招待リンク・ICS・OG画像・メール本文のリンクを、すべてここ経由に
```

**★この時点では、まだ何も切り替えません。**

---

## 4. ★ゲートA（実機・ここで一度止まる）

```
□ Preview デプロイで、招待リンクが preview の URL で生成される
□ Production デプロイで、招待リンクが https://woolsong.app で生成される
□ OG画像のURLが https://woolsong.app で出る
□ ★旧URLでも新URLでも、アプリが同じように動く（まだ転送していない）
```

**両方のURLが生きている状態で、両方から確認してください。**

---

## 5. Phase 1｜Supabase 認証

### 5-1｜設定

```
Supabase → Authentication → URL Configuration

Site URL       https://woolsong.app        ★ここを新に変える
Redirect URLs  https://woolsong.app/**
               https://www.woolsong.app/**
               https://la-voce.vercel.app/**   ★★消さない
               http://localhost:3000/**
               https://*-<team>.vercel.app/**  （Preview を使うなら）
```

**★旧URLを Redirect URLs に残す理由**

```
すでに送った確認メール・招待メールの中に、旧URLのリンクが生きています。
消すと、それを踏んだ人のログインが失敗します。
★一般公開から3か月後に、改めて外します（それまでは残す）。
```

### 5-2｜メールテンプレート

Supabase の Auth メール（確認・招待・マジックリンク・パスワード再設定）は
`{{ .SiteURL }}` / `{{ .ConfirmationURL }}` を使っています。

```
□ Site URL を変えた時点で、★以後のメールは新URLになる
□ すでに送信済みのメールは旧URLのまま → §5-1 の残置で救う
□ テンプレート内に★ドメインを直書きしている箇所がないか確認
□ 差出人名の「La Voce」は、改名手順の側で直す
```

### 5-3｜コード側

```
□ signInWithOtp / signUp の emailRedirectTo が getBaseUrl() 由来か
□ resetPasswordForEmail の redirectTo が同上か
□ OAuth を使っている場合、各プロバイダのコールバックURLに新URLを追加
     ★プロバイダ側（Google など）の設定は Supabase とは別に必要です
□ @supabase/ssr の Cookie に★Domain 属性を付けない（ホスト限定のまま）
```

---

## 6. ★ゲートB（実機・ログインの通し確認）

**新URLで、認証の全経路を1回ずつ通してください。**

```
□ 新規登録 → 確認メール → リンクを踏む → ログインできる
□ パスワード再設定 → メール → 再設定できる
□ マジックリンク（使っていれば）
□ ログアウト → 再ログイン
□ 教室の招待コード → 参加できる
□ ★旧URLからも、まだ同じことができる（転送前なので）
```

**1つでも落ちたら、次に進まないでください。**

---

## 7. Phase 2｜外部サービス（★転送より前）

### 7-1｜LINE

```
□ Messaging API → Webhook URL
     https://la-voce.vercel.app/api/line/webhook
     → https://woolsong.app/api/line/webhook
□ 「検証」ボタンで 200 が返ることを確認
□ LIFF を使っていれば、エンドポイントURLを変更
□ LINE Login を使っていれば、コールバックURLに新URLを追加
□ リッチメニュー・定型文の中のリンク
□ 友だち追加URL（line.me）は★変更不要
```

**★Webhook は 308 を追いません。** 転送を有効にする前に、必ずここを変えてください。
変える前に転送すると、**LINEからの通知が全部届かなくなります。**

### 7-2｜Resend（メール）

```
□ 送信元を @woolsong.app にする場合、★Resend でドメイン認証が必要
     SPF / DKIM / DMARC の DNS レコードを Vercel の DNS に追加
□ ★認証が完了するまで、送信元は変えない
     （変えた瞬間、全メールが届かなくなります）
□ 本文中のリンクは getBaseUrl() 経由に（Phase 0 で済んでいるはず）
```

**送信元の変更は、急ぎません。リンクの更新が先です。**

---

## 8. Phase 3｜★旧オリジンの後始末（いちばん見落とされる）

**テスターの端末には、旧オリジンの Service Worker が生きています。**

```
旧オリジンをいきなり 308 転送にすると──
  ・SW が古いキャッシュを返し続け、転送に気づかない端末が出ます
  ・「アプリが古いまま」「更新されない」という報告になります
```

### 8-1｜順番

```
① 旧オリジン（la-voce.vercel.app）に、★最後のデプロイを1回行う
     ・SW を unregister する
     ・caches を全削除する
     ・「新しいURLに移動しました」+ woolsong.app への大きなボタン
     ・★自動転送も入れる（location.replace）
② これが行き渡るまで★数日置く
③ そのあとで、Vercel のドメイン設定を 308 に切り替える
```

**②を飛ばさないでください。** ①のデプロイを取りに来られるのは、
**旧オリジンがまだ通常配信されている間だけ**です。

### 8-2｜PWA（インストール済みのもの）

```
manifest の id が変わると、★別のアプリとして扱われます。
```

```
□ 新しい id を決めて、★今後は二度と変えない
□ start_url / scope を woolsong.app に
□ ★テスターには「ホーム画面のアイコンを一度消して、入れ直してください」と伝える
□ 案内の紙（はじめかた1枚）を、新URLとQRで作り直す
```

---

## 9. ★ゲートC（実機・端末を2台使う）

```
□ 旧アプリをインストール済みの端末で、
     ①のデプロイ後に開く → 案内が出て、新URLへ移動できる
□ 新URLでホーム画面に追加できる
□ 追加したアイコンから開いて、ログイン済みの状態が保たれる
□ オフラインで開いたときに、新しい方が表示される
```

**古い端末を1台、この確認のために残しておいてください。**

---

## 10. Phase 4｜旧ドメインを308に切り替える

```
Vercel → プロジェクト → Settings → Domains
  la-voce.vercel.app → Edit → Redirect to Another Domain
                     → 308 Permanent Redirect → woolsong.app
```

```
□ ★woolsong.app が Production になっていること（先に確認）
□ Preview デプロイのURLは★転送しない（開発が止まります）
□ 切り替え後、旧URLの深いパスが正しく転送されるか
     https://la-voce.vercel.app/learn/xxx
     → https://woolsong.app/learn/xxx  ★パスが保持されること
```

**パスが落ちて全部トップに飛ぶ設定になっていないか、必ず見てください。**
配った招待リンクが死にます。

---

## 11. コピー文言の監査（9言語）

```
□ messages/*.json をすべて grep
     "la-voce" "vercel.app" "La Voce" "https://"
□ 利用規約・プライバシーポリシー・特商法表記の中のURL
□ 同意画面の本文（★textHash が変わります。改名手順 §3 と同じ扱い）
□ 「学ぶ」の記事本文
□ ★URLは翻訳しない。9言語すべてで同じ文字列
```

---

## 12. その他の生成物

```
□ OG画像（@vercel/og）  og:url / og:image が新ドメインで絶対URL
□ 招待コードのリンク     getBaseUrl() 経由
□ ICS フィード           URL と PRODID（-//Woolsong//JA// など）
□ 法定エクスポートの中に旧URLが入っていないか
□ QRコード               ★作り直す
```

---

## 13. cron

```
□ vercel.json の crons はパス指定なので★影響なし
□ ただし keep-alive が★絶対URLで自分を叩いていたら、新URLに
□ CRON_SECRET は変更不要
□ purge-deleted など、URLを含まないものは触らない
```

---

## 14. 受け入れ条件

```
□ https://woolsong.app が本番として動く
□ https://www.woolsong.app が 308 で apex へ
□ https://la-voce.vercel.app/任意のパス が 308 で新URLの同じパスへ
□ 新規登録・確認メール・パスワード再設定が新URLで完結する
□ ★すでに送信済みの旧URLのメールリンクでも、ログインできる
□ LINE の Webhook 検証が 200
□ LINE から届いた通知のリンクが新URLを指す
□ 招待コードのリンクが新URLで生成される
□ OG画像が新URLで表示される（SNSに貼って実機確認）
□ 9言語のどこにも旧URLが残っていない（grepで0件）
□ 旧オリジンの SW が無効化され、インストール済みPWAから移行できる
□ ★Supabase の Redirect URLs に旧URLが残っている
```

---

## 15. ロールバック

```
Phase 0〜2   環境変数と設定を戻すだけ。★数分で戻せる
Phase 3      SW の無効化は★戻せません（戻す必要もありません）
Phase 4      Vercel の転送設定を解除すれば戻る
```

**戻せないのは Phase 3 だけです。** そこに入る前に、ゲートA・Bを必ず通してください。

---

## 16. ★禁止事項

```
1.  ★LINE の Webhook を変える前に、旧ドメインを転送にしない
2.  ★Supabase の Redirect URLs から旧URLを消さない
3.  ★Resend のドメイン認証が終わる前に、送信元を変えない
4.  ★旧オリジンの SW を無効化する前に、転送に切り替えない
5.  ★Preview のURLを転送しない
6.  ★Cookie に Domain 属性を付けて共有しようとしない（できません）
7.  ★manifest の id を、切替後に再び変えない
8.  ★環境変数・テーブル・バケットの名前を変えない
9.  ★転送でパスを落とさない
10. ★ゲートA〜Cを飛ばさない
```

---

## 17. テスターへの連絡文（そのまま使えます）

```
アプリの名前とURLが変わります。

　新しいURL   https://woolsong.app

お手数ですが、次の2つをお願いします。

　① ホーム画面のアイコンを一度削除して、新しいURLから入れ直す
　② 一度ログアウトされるので、もう一度ログインする

★記録したデータは、すべてそのまま残っています。消えません。

古いURLもしばらく生きていて、開くと自動で新しいほうへ移ります。
ただし、ホーム画面のアイコンだけは入れ直しが必要です。
```

**「データは消えません」を必ず入れてください。** ここがいちばん不安になる点です。

---

## 18. 実装順（3日＋待ち）

```
Day 1  Phase 0（getBaseUrl と置換）→ ★ゲートA
Day 2  Phase 1（Supabase）→ ★ゲートB ／ Phase 2（LINE・Resend）
Day 3  Phase 3（旧オリジンの最終デプロイ）→ ★ゲートC
待ち   ★2〜3日（SWの入れ替えが行き渡るのを待つ）
Day 4  Phase 4（308へ切替）→ §14 の受け入れ条件
```

**差し込み位置：G3 の前。★G3.2（課金）より必ず前に終わらせること。**
決済の設定にURLが入るので、そのあとに変えると二度手間になります。
