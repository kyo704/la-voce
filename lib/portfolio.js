// ============================================================================
// ★経歴（ポートフォリオ）── ★何を 載せ、★誰が 見られるか
//
//   ★出どころ 見本 `SC['経歴']` ／ `SC['公開の範囲']`
//            裁定 その94 §7（★出す もの・出さない もの）
//            裁定 その95 §5（★有料の 中核に する なら 何が 足りないか）
//
//   ★★★この 蔵は、★決めを 1か所に 置きます。★画面で 判じません。
//
//   ★★★出さない と 決めた もの（★裁定 その94 §7）
//     ★住所 ／ 電話 ／ 生年月日
//     ★通って いる 教室 ／ 時間割
//     ★★年齢 ／ 学年 ／ 入学年 ── ★**若いと 分かる もの**
//       ★★わけ ── ★狙う 側は、★若い 方を 探して います。
//         ★★「芸大おじさん」は 実在の ご本人 です。★本人確認で 止まりません。
//         ★★年齢の 制限でも 止まりません（★40代でも 通ります）。
//         ★★★止められるのは、★**入れる 場所を 所属で 限る** こと だけ です。
//
//   ★★住む ところ では なく、★**よく 演奏する ところ** を 出します。
//     ★★住む 県は 広く、★市区町村は 特定に 近づきます。
//     ★★演奏家は、★住む 県と 演奏する 県が ちがう ことが よく あります。
//
//   ★見張り components/tests/portfolio.test.js
// ============================================================================

import { ageBandOf, AGE_BANDS } from "@/lib/ageGate";

/** ★題（★見本の h2）。 */
// ★★★2026-09-24・裁定129 P1（裁定131）── ★名を 改めました。
//   ★前 …「経歴」。★いま …「あなたの ページ」。
//   ★★わけ（★裁定の 字） ── ★「経歴」だと 書類に 見える。
//     ★「ポートフォリオ」だと 意味が 伝わらない 方が いる。
//     ★★「あなたの ページ」なら、★何で あるかが 分かる。
//   ★★もっとの 行は 2026-09-24 に 直しました。★画面の 題が 残って いました。
export const HEAD = "あなたの ページ";
export const SCOPE_HEAD = "だれが 見られますか";

/** ★いちばん 上の 1行（★見本の warn）。 */
export const LEAD =
  "ポートフォリオに 載せる ものです。書かなくても、録画だけで 成り立ちます。";

/** ★自分の ことば の 長さ（★見本 ──「400字まで」）。 */
export const BIO_MAX = 400;

/**
 * ★公開の 範囲（★見本 `SC['公開の範囲']` の 3つ）。
 *
 *   ★★★はじめは「自分だけ」です。★既定で 開けません。
 *   ★★`link`（URLを 知って いる 人だけ）は、★18歳未満の 方に 出しません。
 *     ★★★裁定 その94 §3 ── ★学校の 中と 外を、★絶対に 混ぜません。
 */
// ★★★鍵を 直しました（★2026-09-25）── `school`／`link` は **保存できません** でした。
//
//   ★★見つけ方 ── ★C群 束2 の「紙をたしかめる」を 作る 前に 台帳を 見ました。
//     ★`portfolios_visibility_check` が 通すのは `self`／`org`／`public` の 3つ です
//       （★2026-09-25 の sql/78 で 2つ → 3つ に 広げました）。
//     ★★ここに あった `school`／`link` は **どちらも 通りません**。
//       ★★試しの 台帳で 実際に 入れて みました ── ★`check_violation` で 落ちました。
//     ★★★sql/78 の 前は もっと 悪かった です ── ★通るのは `self`／`public` の 2つ で、
//       ★`school` も `link` も 落ちて いました。★2つの 選びが 保存できない 状態 でした。
//       ★★エラーは 画面に 出て いました が、★誰も 3つ目を 選んで いなかった ので
//         ★（★`portfolios` は 1行・`self`）★気づかれて いませんでした。
//
//   ★★字は 見本『出す』に 合わせます ── 自分だけ ／ 同じ学校の方 ／ どなたでも。
//     ★★Opus が sql/78 で こう 書いて います ──
//       「★見本も ばらついて いました。★裁定が 正（裁定179・M20d）→ ★台帳を 3つに 広げ、
//         ★見本の「公開の範囲」を そろえます」
//     ★★だから 『公開の範囲』の 古い 字（「URLを 知っている人だけ」）は 使いません。
//
//   ★★18歳未満の 方に 出さないのは `public`（どなたでも）です。
//     ★★見本『出す』も そこに「18歳以上」の 錠を かけて います。
export const SCOPES = Object.freeze([
  { key: "self", label: "自分だけ", note: "誰にも 見えません。" },
  { key: "org", label: "同じ学校の方", note: "その学校に いま 在る 方だけです。" },
  { key: "public", label: "どなたでも", note: "検索にも 出ます。" }
]);
export const DEFAULT_SCOPE = "self";

/**
 * ★18歳未満の 方には `public`（どなたでも）を 出しません。
 *
 *   ★★2026-09-25 まで 鍵は `link` でした。★台帳が 通さない 鍵 でした。
 *   ★★見本『出す』は「どなたでも」に「18歳以上」と 出して、★押せなく して います。
 */
export const MINOR_NO_PUBLIC =
  "18歳未満の 方には、「どなたでも」は 出ません。";

export function scopesFor(profile) {
  const 大人 = ageBandOf(profile) === AGE_BANDS.ADULT;
  return SCOPES.filter((s) => 大人 || s.key !== "public");
}

/** ★その 範囲を 選べるか（★画面で 判じません）。 */
export function mayUseScope(profile, key) {
  return scopesFor(profile).some((s) => s.key === key);
}

/**
 * ★経歴の 箇条（★見本 ──「学んだところ」「賞・コンクール」「師事」）。
 *
 *   ★★★賞の 有無で 並べ替えたり、★数えたり しません（★見本の note）。
 *     ★★並べ替えると、★人の 間に 順位が できます。
 */
// ★★★どの 種が ある か ── ★1か所 です（★2026-09-25・Opus の 同意）。
//
//   ★★見本 `PF_KINDS` は **分野ごと** に 種を 変えます ── music／voice／stage。
//     ★`portfolios.field` が どの 分野か を 持ちます。
//   ★★台帳（`portfolio_entries.kind`）は 17種を 通します（★2026-09-25・本番で 確かめました）──
//     ★school award teacher education performance repertoire recording role
//     ★skill physical news press lesson faq management link
//   ★★だから 見本の 種は ぜんぶ しまえます。
//
//   ★★★`enabledAt` ── ★**入れる 形が できた 日** です。
//     ★`null` の ものは 画面に 出しません。
//     ★★★これで、★種を 並べて も 38名の 画面は 1文字も 変わりません
//       （★Opus の 同意・2026-09-25）。
//     ★★出す 日が 来たら、★その 行に 日付を 書きます。★それだけ です。
//   ★★★数を 書きません。★「あと◯種」を 出しません。
export const KINDS_BY_FIELD = Object.freeze({
  music: Object.freeze([
    { key: "school", label: "学んだところ", hint: "学校・研究科の 名と、いた 年",
      enabledAt: "2026-09-19" },
    { key: "teacher", label: "師事した方", hint: "お名前", enabledAt: "2026-09-19" },
    { key: "award", label: "賞・コンクール", hint: "賞の 名と、受けた 年",
      enabledAt: "2026-09-19" },
    { key: "performance", label: "演奏・出演", hint: "曲・会場と、その 年", enabledAt: null },
    { key: "repertoire", label: "レパートリー", hint: "曲の 名", enabledAt: null },
    { key: "recording", label: "録画・音源", hint: "曲名・役名など", enabledAt: null },
    { key: "press", label: "批評", hint: "出どころと ひとこと", enabledAt: null },
    { key: "management", label: "所属", hint: "事務所・団体の 名", enabledAt: null },
    { key: "link", label: "リンク", hint: "お持ちの ページ", enabledAt: null }
  ]),
  voice: Object.freeze([
    { key: "school", label: "学んだところ", hint: "学校・養成所の 名と、いた 年",
      enabledAt: "2026-09-19" },
    { key: "management", label: "所属・養成所", hint: "事務所・養成所の 名", enabledAt: null },
    { key: "performance", label: "持ち役", hint: "役名と 作品", enabledAt: null },
    { key: "physical", label: "声質・音域・方言", hint: "れい：中〜高　A3–E5", enabledAt: null },
    { key: "recording", label: "声の サンプル", hint: "曲名・役名など", enabledAt: null },
    { key: "award", label: "賞・コンクール", hint: "賞の 名と、受けた 年",
      enabledAt: "2026-09-19" },
    { key: "link", label: "リンク", hint: "お持ちの ページ", enabledAt: null }
  ]),
  stage: Object.freeze([
    { key: "school", label: "学んだところ", hint: "学校・研究科の 名と、いた 年",
      enabledAt: "2026-09-19" },
    { key: "management", label: "所属", hint: "事務所・団体の 名", enabledAt: null },
    { key: "performance", label: "舞台・映像", hint: "作品と 役、その 年", enabledAt: null },
    { key: "physical", label: "身長・靴・髪", hint: "れい：168cm", enabledAt: null },
    { key: "skill", label: "できること", hint: "れい：殺陣", enabledAt: null },
    { key: "award", label: "賞・コンクール", hint: "賞の 名と、受けた 年",
      enabledAt: "2026-09-19" },
    { key: "press", label: "批評", hint: "出どころと ひとこと", enabledAt: null },
    { key: "link", label: "リンク", hint: "お持ちの ページ", enabledAt: null }
  ])
});

/** ★分野が 分からない ときは music に 倒します（★見本の `PF_KINDS[FIELD] || music`）。 */
export function kindsOfField(field) {
  return KINDS_BY_FIELD[String(field || "")] || KINDS_BY_FIELD.music;
}

/** ★出して よい 種 だけ（★`enabledAt` が 入って いる もの）。 */
export function enabledKinds(field) {
  return kindsOfField(field).filter((k) => !!k.enabledAt);
}

/**
 * ★いまの 経歴の 欄（★入れる 形が できて いる もの だけ）。
 *
 *   ★★★`KINDS_BY_FIELD` から 出します。★別に 並べません。
 *     ★★2026-09-25 まで ここに 3つを 書いて いました。
 *       ★★見本の 種は 9つ で、★2つの 一覧が できかけて いました。
 *   ★★分野を 見ません ── ★経歴の 画面は まだ 分野を 受け取って いません。
 *     ★★★`music` の うち 入れる 形の ある もの ＝ いままでと 同じ 3つ です。
 *       ★★38名の 画面は 1文字も 変わりません。
 */
export const ENTRY_KINDS = Object.freeze(enabledKinds("music"));

/**
 * ★録画（★裁定 その94 §4f・2026-09-19 の 追補）。
 *
 *   ★★★URL だけ です。★預かりません。★アプリの 中で 再生しません。
 *     ★★ご本人が すでに 公開して いる ところへの 道しるべ です。
 *     ★★★押すと、★外（YouTube 等）へ 移ります。
 *       ★★どこへ 行くかを、★押す 前に お見せします（★下の `hostOf`）。
 *
 *   ★★応募の ときは **既定で 入** です（★写真は 既定 切）。
 *     ★★わけ ── ★すでに 公開されて いる もの だから です。
 *     ★★ご本人が 消せば、★道しるべが 切れる だけ です。
 */
export const RECORDING_HEAD = "録画";
export const RECORDING_HINT = "曲名・役名など";
export const RECORDING_URL_HINT = "YouTube などの リンク（https で 始まる もの）";
export const RECORDING_NOTES = Object.freeze([
  "動画は お預かりしません。ご自分の 置いた ところへの 道しるべ です。",
  "押すと、そのまま 外の ところへ 移ります。",
  "消しても、向こうの 動画は 消えません。道しるべが 無くなる だけです。"
]);

/** ★どこへ 行くか（★押す 前に お見せします）。 */
export function hostOf(url) {
  const m = String(url || "").match(/^https:\/\/([^/?#\s]+)/);
  return m ? m[1] : "";
}

/**
 * ★通す 先（★裁定157 T6・2026-09-21）。
 *
 *   ★★★YouTube だけ です。★ほかの ところは 通しません。
 *     ★★Vimeo は 外しました ── ★音楽の 権利の 扱いが 確かめられて いません。
 *     ★★ほかの ところを 足す ときは、★そこの 権利の 扱いを 先に 確かめます。
 *   ★★★`youtu.be` も 同じ ところ です。★短い 形で 貼る 方が います。
 *   ★★`m.youtube.com` は 携帯から 貼った ときの 形 です。
 */
export const ALLOWED_HOSTS = Object.freeze([
  "www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be"
]);
export const HOST_NG =
  "いまは YouTube の リンクだけ お預かりします。";

/** ★通す のは `https` の YouTube だけ です（★台帳にも 同じ 縛りを 置いて います）。 */
export function urlOk(url) {
  const u = String(url || "").trim();
  if (!/^https:\/\/[^\s]+$/.test(u)) return false;
  return ALLOWED_HOSTS.indexOf(hostOf(u)) >= 0;
}

/**
 * ★埋める 前に たずねる 4つ（★裁定157 T6）。
 *
 *   ★★★答えは **記録しません**。★どこにも しまいません。
 *     ★★しまうと、★あとで「本人が はい と 答えた」を 争う 材料に なります。
 *     ★★★たずねる のは、★思い出して いただく ため です。
 *   ★★4つ とも「はい」の ときだけ 足せます。
 */
// ★★★見本『録画を足す』の 字に そろえました（★2026-09-25・C群 束5）。
//
//   ★★前は 短い 4つ でした ──「共演された方の 了解を いただいて いますか。」など。
//   ★★★見本の ほうは **誰に・何を** を 名指しして います ──
//     ★「共演者（伴奏・合唱・オーケストラ）の 全員に」
//     ★「会場（ホール・学校）の 撮影・公開の 決まり」
//     ★「著作権の 切れて いない 外国の 作品（作曲・訳詞・編曲）」
//     ★「有料の 公演・出演料の ある 公演」
//   ★★これは 短く する ところでは ありません ──
//     ★★★短いと、★何を 確かめれば よいか 分かりません。
//       ★「会場の 決まり」だけでは、★学校の 決まりを 思い出しません。
//       ★「外国の 作品」だけでは、★訳詞や 編曲を 思い出しません。
//     ★★確かめる ための 問い です。★思い出させるのが 仕事 です。
//   ★★3つ目の 括弧（「無ければ『済み』で かまいません」）も 残します ──
//     ★★無い 人を 止めない ため です。★書かないと、★みな 止まります。
export const RECORDING_ASKS = Object.freeze([
  "共演者（伴奏・合唱・オーケストラ）の 全員に、ネットに 載せることを 伝えて、了解を もらいましたか",
  "会場（ホール・学校）の 撮影・公開の 決まりを 確かめましたか",
  "著作権の 切れていない 外国の 作品（作曲・訳詞・編曲）が ある ときは、YouTube 側の 手続きは 済んでいますか（無ければ「済み」で かまいません）",
  "有料の 公演・出演料の ある 公演なら、主催者の 許可を もらいましたか"
]);
export const RECORDING_ASKS_NOTE =
  "この お答えは どこにも 残りません。お確かめの ための ものです。";

/** ★4つ とも「はい」か。★答えは 受け取るだけ で、★返しません。 */
export function mayAddRecording(answers) {
  const a = answers || [];
  return RECORDING_ASKS.every((_, i) => a[i] === true);
}



/** ★渡された 順の まま 返します。★数の 多い 少ないで 並べません。 */
export function inGivenOrder(rows) {
  return (rows || []).slice();
}

/**
 * ★台帳に 置かない もの（★裁定 その94 §7）。
 *
 *   ★★★この 一覧は、★見張りが 読みます。
 *     ★★表に この 名の 列を 足した 日に、★見張りが 止まります。
 */
export const NEVER_STORED = Object.freeze([
  "address", "phone", "birthdate", "birth_date",
  "age", "grade", "grade_label", "enrollment_year", "school_year",
  "timetable", "classroom_id"
]);

/** ★画面に 出す 但し書き（★見本の note そのまま）。 */
export const NOTES = Object.freeze([
  "ここに 書いたことは、公開の 範囲に 従います。「自分だけ」に していれば、誰にも 見えません。",
  "「じぶんのことば」は、何を 書いても かまいません。こちらで 直したり、言い換えたり しません。",
  "賞の 有無で 並べ替えたり、数えたり しません。",
  "ここに 書いたことは、伴奏さがしには 出ません。別のものです。"
]);

export const SCOPE_NOTES = Object.freeze([
  "はじめは「自分だけ」です。",
  MINOR_NO_PUBLIC,
  "見た目を 選ぶ 機能は、いまは ありません。ひとつの 決まった 見た目で 出します。"
]);

/**
 * ★まだ 作って いない もの（★台帳 08-15 の 引き金）。
 *
 *   ★★★録画 ── ★置き場（Supabase Storage）を まだ 使って いません。
 *   ★★宣材写真 ── ★同じ 置き場が 要ります。★撮った 場所の 情報を 消す 手も 要ります。
 *   ★★公開ページ（URL）── ★外に 出す 道 です。★裁定 その95 の ③ です。
 *   ★★紙・PDF ── ★同上。
 */
//   ★★★「★」は 紙の 中の 印 です。★画面に 出しません（★Opus・2026-09-15）。
//     ★★`needs` は 画面に 出うる 字 です。★印を 入れません。
export const NOT_YET = Object.freeze([
  // ★★★録画は できる ように なりました（★2026-09-19・裁定 その94 §4f）。
  //   ★★URL だけ に なった ので、★置き場が 要りません。
  { key: "photo", label: "宣材写真", needs: "置き場と、撮った場所の 情報を 消す 手" },
  { key: "public_page", label: "公開ページ（URL）", needs: "外に 出す 道（裁定 その95 ③）" },
  { key: "paper", label: "紙・PDF", needs: "組版（裁定 その95 §5）" }
]);

/** ★書けて いるか（★空の ままでも かまいません）。 */
export function isEmpty(p) {
  if (!p) return true;
  return !String(p.display_name || "").trim()
    && !String(p.instrument || "").trim()
    && !String(p.bio || "").trim();
}

/** ★長さを 超えて いないか。★切りません。★出すだけ です。 */
export function bioTooLong(bio) {
  return String(bio || "").length > BIO_MAX;
}
