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
 */
export const OUTBOUND_ROUTES = [
  {
    id: "supabase",
    host: "(NEXT_PUBLIC_SUPABASE_URL)",
    where: "lib/supabase/{client,server,admin}.js",
    direction: "both",
    what: "お預かりしている記録のすべて（entries・profiles ほか）",
    identifying: true,
    country: null,
    note:
      "★本体の保管先です。ここが空欄のままでは、プライバシーポリシーが書けません。" +
      "管理画面の Project Settings → General → Region で確かめてください。" +
      "★profiles.data_region に入れている値とは別物です。あれは本人の申告です。"
  },
  {
    id: "anthropic",
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
      "★いまは AI_ADVICE_ENABLED が未設定なので、この道は閉じています（route.js:60-71）。"
  },
  {
    id: "line",
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
    host: "api.resend.com",
    where: "app/api/feedback/route.js:51",
    direction: "send",
    what: "ご意見の本文と、返信先のメールアドレス",
    identifying: true,
    country: null,
    note: "★本人が書いた文がそのまま渡ります。先に feedback 表へ保存してから送ります。"
  },
  {
    id: "stripe",
    host: "api.stripe.com",
    where: "lib/stripe.js:1（app/api/stripe/{checkout,portal,webhook}）",
    direction: "both",
    what: "メールアドレスと、支払いの手続きに要る情報",
    identifying: true,
    country: null,
    note:
      "★いまは使っていません（REQUIRE_SUBSCRIPTION が有効でないため、" +
      "決済の入口が画面にありません）。★ただしコードは生きています。" +
      "台帳には載せます。「使っていない」は「無い」ではありません。"
  },
  {
    id: "google-calendar",
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

/**
 * ★国がまだ空欄の道。
 *   プライバシーポリシー（B-3）を書く前に、これが空になっている必要があります。
 */
export function routesMissingCountry() {
  return OUTBOUND_ROUTES.filter((r) => !r.country);
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
