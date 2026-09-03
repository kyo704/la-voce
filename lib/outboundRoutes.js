// ============================================================================
// 外へ出る道の台帳（5番目の台帳・2026-09-03）
//
//   ★ほかの4つの台帳と並びます。
//     lib/accountDeletion.js     … 消すときに触る表
//     lib/backupTables.js        … 控えを取る表
//     lib/authUserReferences.js  … auth.users を指している列
//     lib/exportData.js          … 本人が持ち出せる中身
//     lib/outboundRoutes.js      … ★ここ。データが外の会社へ渡る先
//
//   ★なぜ国を書くか
//     外国にある会社へお預かりした記録を渡すときは、
//     ★どの国かをプライバシーポリシーに書く必要があります（個人情報保護法）。
//     「外部に渡ることはありません」と書けない以上、
//     ★渡る先を一覧で示すほうが、正確で、確かめられます。
//
//   ★コードから確かめられること／確かめられないこと
//     ・接続先のホスト名 … コードに書いてあります。★確かめました。
//     ・何を送っているか … コードに書いてあります。★確かめました。
//     ・その会社のサーバがどの国にあるか
//       … ★コードからは分かりません。各社の資料と、
//         Supabase の管理画面（Project Settings → General → Region）で
//         確かめる必要があります。country が null の行が、それです。
//       ★憶測で国名を書きません。書いた瞬間に、公開文書の嘘になります。
// ============================================================================

/**
 * 外の会社へつながる道。★1件ずつ、コードの場所を添えます。
 *
 * direction:
 *   "send"    … こちらから送ります
 *   "receive" … 向こうから届きます（送ってはいません）
 *   "both"    … 両方
 *
 * identifying:
 *   true      … 誰のものか分かる情報が混ざります
 *   false     … 値だけで、誰のものかは分かりません
 *   "maybe"   … ★自由記述が含まれるため、本人が名前を書けば混ざります
 *
 * country:
 *   null      … ★まだ確かめていません。確かめてから書きます。
 *
 * kind:
 *   "custodial" … 預かるだけ（A型）。中身を扱う約束になっていません。
 *                 ★サーバの置き場所は「外的環境の把握」として書きます。
 *   "processing"… 中身を処理します（B型）。
 *                 ★書くべきは、サーバの場所ではなく★契約している相手の国です。
 *                 東京にサーバがあっても、契約の相手が外国の法人なら、
 *                 それは外国への提供です。★リージョンで代用できません。
 *
 * entity / entityCountry:
 *   ★契約している相手そのもの。各社の規約・DPA と、
 *     ★運営者あての請求書の宛先で確かめます。
 *     私はコードからは分かりません。null は「まだ確かめていない」です。
 *
 * origin:
 *   "server"  … こちらのサーバから出ます。利用者は関与しません。
 *   "client"  … ★利用者の画面から出ます。押したときだけ飛びます。
 *
 *   ★この区別は、私の言い方の誤りを正すために入れました（2026-09-03）。
 *     「記録が外部へ出る唯一の経路は /api/advice です」と書きましたが、
 *     正しくは★「サーバから記録の中身が出うる唯一の経路」です。
 *     Google カレンダーは、利用者の画面からレッスンの題名とメモが渡ります。
 *     ★経路の性質は違いますが、外へ出ることに変わりはありません。
 *     origin を持たせずに一覧にすると、この違いが消えて、
 *     また同じ言い間違いが起きます。
 */
export const OUTBOUND_ROUTES = [
  {
    id: "supabase",
    kind: "custodial",
    entity: null,
    entityCountry: null,
    origin: "server",
    host: "(NEXT_PUBLIC_SUPABASE_URL)",
    where: "lib/supabase/{client,server,admin}.js",
    direction: "both",
    what: "お預かりしている記録のすべて（entries・profiles ほか）",
    identifying: true,
    // ★確かめました（2026-09-03・運営者による管理画面の確認）。
    country: "日本（東京・ap-northeast-1）",
    note:
      "★本体の保管先です。サーバは東京にあります。" +
      "★ただし A型（預かるだけ）としての記載です。Supabase の契約主体が" +
      "どこの法人かは別問題で、まだ確かめていません（entity が null）。" +
      "★profiles.data_region に入れている値とは別物です。あれは本人の申告です。"
  },
  {
    id: "anthropic",
    kind: "processing",
    entity: null,
    entityCountry: null,
    origin: "server",
    host: "api.anthropic.com",
    where: "lib/anthropic.js:4（app/api/advice/route.js から）",
    direction: "send",
    what:
      "直近14日の記録を1行にまとめた文。" +
      "喉・声・睡眠時間・睡眠の質・水分・気温・湿度・活動・公演の出来・" +
      "心の余裕・喉の症状・食事メモ・メモ",
    identifying: "maybe",
    country: null,
    note:
      "★user_id もメールも名前も送っていません（route.js:19-38 で組み立てている項目がすべて）。" +
      "★ただし食事メモとメモは自由記述です。本人が名前や場所を書けば、それも渡ります。" +
      "★いまは AI_ADVICE_ENABLED が未設定なので、この道は閉じています（route.js:60-71）。",
    // ------------------------------------------------------------------
    // ★これまでに、この道を通ったものはありません（2026-09-03 確認）
    //
    //   本番の Vercel に ANTHROPIC_API_KEY が★一度も設定されたことがない、と
    //   運営者が管理画面（Settings → Environment Variables）で確かめました。
    //
    //   ★「呼び出しが失敗した」ではなく、★「一度も送っていない」です。
    //     route.js:105-110 が、鍵の有無を★fetch より前に見て 500 を返します。
    //     lib/anthropic.js:4 の fetch には★到達しません。
    //     つまり api.anthropic.com への通信そのものが発生していません。
    //
    //   ★ただし、記録は読まれています。
    //     entries の読み出し（route.js:88-93）は、鍵を見る★前にあります。
    //     読んだものはサーバの中に留まり、外へは出ていません。
    //     ★「読んでいない」と言うと嘘になります。「外へ出していない」が正確です。
    //
    //   ★この事実を、利用者向けの文には書きません。
    //     「外部に渡ったことはありません」という言い方は、
    //     読んだ人に確かめようがありません（Opus の裁定）。
    //     利用者には、渡る先の一覧を示します。ここは監査のための記録です。
    // ------------------------------------------------------------------
    history: {
      everTransmitted: false,
      confirmedOn: "2026-09-03",
      confirmedBy: "運営者による Vercel の環境変数の確認",
      why: "ANTHROPIC_API_KEY が本番に一度も設定されていないため、route.js:105 で止まる"
    }
  },
  {
    id: "line",
    kind: "processing",
    entity: null,
    entityCountry: null,
    origin: "server",
    host: "api.line.me",
    where: "app/api/cron/line-reminder/route.js:23／app/api/line-webhook/route.js:28",
    direction: "both",
    what: "LINE の利用者ID と、決まった文面の呼びかけ。★記録の中身は送っていません。",
    identifying: true,
    country: null,
    note: "★LINE の利用者IDは、その人を指す番号です。記録は送っていませんが、識別子は渡ります。"
  },
  {
    id: "resend",
    kind: "processing",
    entity: null,
    entityCountry: null,
    origin: "server",
    host: "api.resend.com",
    where: "app/api/feedback/route.js:51",
    direction: "send",
    what: "ご意見の本文と、返信先のメールアドレス",
    identifying: true,
    country: null,
    note:
      "★本人が書いた文がそのまま渡ります。先に feedback 表へ保存してから送ります。" +
      "★お知らせ（notice_batches / notice_targets・TASK A）を配信するときも、" +
      "この道を通ります。いまはまだ配信の仕組みがありませんが、" +
      "★台帳には先に書いておきます。作ってから足すと、書き忘れます。"
  },
  {
    id: "stripe",
    kind: "processing",
    entity: null,
    entityCountry: null,
    origin: "server",
    host: "api.stripe.com",
    where: "lib/stripe.js:1（app/api/stripe/{checkout,portal,webhook}）",
    direction: "both",
    what: "メールアドレスと、支払いの手続きに要る情報",
    identifying: true,
    country: null,
    note:
      "★『使っていない』ではありませんでした（2026-09-03 に確かめました）。" +
      "★画面の入口について、私は2度まちがえました（2026-09-03）。" +
      "1度目『入口は無い』→ CheckoutButton を見て『全員に出る』と訂正→ " +
      "★2度目も誤りでした。app/billing/page.js:25 に早期 return があり、" +
      "REQUIRE_SUBSCRIPTION が有効でなければ、案内だけを出して戻ります。" +
      "★<CheckoutButton />（138行）には到達しません。" +
      "つまり今日この経路へ届く道は、ログイン済みの人が URL を直に叩く場合だけです。" +
      "★ファイルの一部だけを読んで話を組み立てたのが原因です。" +
      "早期 return は、下の行を全部無効にします。下から読むと見えません。",
    history: {
      everTransmitted: "★不明（advice とは違います）",
      confirmedOn: "2026-09-03",
      why:
        "new Stripe(undefined) は投げません。読み込みは通り、★呼んだときに " +
        "StripeAuthenticationError になります。つまり鍵が無くても" +
        "★通信そのものは起きます。鍵の見張りがどこにも無かったため、" +
        "stripe.customers.create({ email, metadata: { supabase_user_id } }) が" +
        "★そのまま api.stripe.com へ届き、そのあと拒否されていました。" +
        "★メールアドレスと利用者IDが外へ出てから拒否される形です。" +
        "2026-09-03 に3つのルートすべてへ見張りを入れ、閉じました。" +
        "★経路は理論上のものではなく、画面に出ていました。" +
        "押した方がいれば、そのたびに外へ出ています。"
    }
  },
  {
    id: "google-calendar",
    kind: "processing",
    entity: null,
    entityCountry: null,
    origin: "client",
    host: "calendar.google.com",
    where: "components/VocalTracker.jsx:2559-2568（2600行のリンク）",
    direction: "send",
    what: "レッスンの題名・日時・メモ（note）",
    identifying: "maybe",
    country: null,
    note:
      "★サーバは送りません。利用者がリンクを押したときだけ、" +
      "その人の画面から Google へ飛びます。" +
      "★題名とメモは自由記述なので、名前が入っていれば一緒に渡ります。" +
      "★見落としやすい道です。fetch ではなく <a href> なので、" +
      "通信の検索では出てきません。"
  }
];

/** A型（預かるだけ）。★サーバの場所を書けば足ります。 */
export function custodialRoutes() {
  return OUTBOUND_ROUTES.filter((r) => r.kind === "custodial");
}

/**
 * B型（中身を処理する）。
 * ★契約している相手の国を書く必要があります。サーバの場所では足りません。
 */
export function processingRoutes() {
  return OUTBOUND_ROUTES.filter((r) => r.kind === "processing");
}

/**
 * ★B型なのに、契約の相手をまだ確かめていない道。
 *   プライバシーポリシー（B-3）を書く前に、これが空になっている必要があります。
 */
export function processingRoutesMissingEntity() {
  return processingRoutes().filter((r) => !r.entity || !r.entityCountry);
}

/**
 * ★国がまだ空欄の道。
 *   プライバシーポリシー（B-3）を書く前に、これが空になっている必要があります。
 */
export function routesMissingCountry() {
  return OUTBOUND_ROUTES.filter((r) => !r.country);
}

/**
 * ★サーバから出る道だけ。
 *   「サーバから記録が出る唯一の経路」と言えるのは、この中の話です。
 *   ★画面から出る道（Google カレンダー）を数え落とさないために分けます。
 */
export function serverOriginRoutes() {
  return OUTBOUND_ROUTES.filter((r) => r.origin === "server");
}

/** ★利用者の画面から出る道。押したときだけ飛びます。 */
export function clientOriginRoutes() {
  return OUTBOUND_ROUTES.filter((r) => r.origin === "client");
}

/** こちらから送っている道だけ（受け取るだけのものを除く）。 */
export function sendingRoutes() {
  return OUTBOUND_ROUTES.filter((r) => r.direction === "send" || r.direction === "both");
}

/**
 * ★調べたが、外への通信ではなかったもの。
 *   「調べていない」と「調べて、無かった」を区別するために残します。
 */
export const CHECKED_NOT_OUTBOUND = [
  {
    what: "next/font/google（app/layout.js:1）",
    why: "ビルドのときに取り込んで、自分のところから配ります。実行時に Google へは行きません。"
  },
  {
    what: "気温・湿度",
    why: "★外の気象サービスからは取っていません。本人が入力した値です。"
  },
  {
    what: "地図",
    why: "★使っていません。地図の呼び出しは1つもありません。"
  }
];
