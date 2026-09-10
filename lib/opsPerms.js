// ============================================================================
// 役職と「できること」── 決めごと 1か所（★権限の 作り直し・2段目）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化ほか）.md §7
//            見本 00-動く見本（さわれる・全画面）.html の var PERM / var POSTS
//            docs/opus/引き継ぎ-最終稿として作るときの注意（9月10日）.md §3
//
//   ★★裁定 §7-1 ── ★「役割」を なくしました。
//     ✕ 役割　代表 ／ 教室の責任者 ／ 先生 ／ 事務
//     ✕ 役職　学長 ／ 学部長 …（★ただの 呼び名でした）
//     ◯ ★役職が そのまま「できること」です。★2つ あった ものを 1つに しました
//
//   ★★引き継ぎ §「最も 重要な 実装原則」
//     「★画面の 出し分けは 権限から 導いてください。★役職名で 分岐しないでください」
//
//   ★★ここに 書いた 14 と 10 は、★見本と 同じで なければ なりません。
//     ★components/tests/ops-perms.test.js が、★見本の HTML と 突き合わせます。
//     ★★ずれたら 落ちます。★書き写しの ずれを、そこで 止めます。
//
//   ★見張り components/tests/ops-perms.test.js
// ============================================================================

/**
 * ★できること（★14）。
 *
 *   ★schoolWide が true … ★学校ぜんぶに かかる もの
 *   ★schoolWide が false … ★その方 自身にだけ かかる もの
 *
 *   ★★この ちがいが、★渡せる／渡せないを 決めます（★下の mayGrant）。
 */
export const PERMS = Object.freeze([
  { key: "bill", label: "ご請求を 見る", schoolWide: true },
  { key: "bill_pay", label: "ご請求を 払う・支払い方法を 変える", schoolWide: true },
  { key: "meibo", label: "学校全部の 名簿を 見る・直す", schoolWide: true },
  { key: "sched_all", label: "学校全部の 日程を 見る・直す", schoolWide: true },
  { key: "gyoji", label: "行事を 出す・直す", schoolWide: true },
  { key: "renraku_all", label: "学校全部へ お知らせを 出す", schoolWide: true },
  { key: "monka_read", label: "事故のときに 門下を 読む（普段は 切ってあります）", schoolWide: true },
  { key: "master", label: "学校の 形（学部・学科・学年・分野）を 直す", schoolWide: true },
  { key: "post", label: "ひとの 役職を 変える", schoolWide: true },
  { key: "sched_mine", label: "自分の レッスンの 日程を 組む", schoolWide: false },
  { key: "monka_write", label: "自分の 門下に 書く", schoolWide: false },
  { key: "shukketsu", label: "レッスンの 出席を つける", schoolWide: false },
  { key: "koma", label: "学校の 時間の 割り方・場所を 直す", schoolWide: true },
  { key: "koma_mine", label: "自分の コマを 決める（学校の コマの 中で）", schoolWide: false }
]);

export const PERM_KEYS = Object.freeze(PERMS.map((p) => p.key));

export function permLabel(key) {
  const p = PERMS.find((x) => x.key === key);
  return p ? p.label : key;
}

export function isSchoolWide(key) {
  const p = PERMS.find((x) => x.key === key);
  return p ? p.schoolWide : false;
}

/**
 * ★はじめの ひな型（★10）。★裁定 §7-5。
 *
 *   ★★決まりでは ありません。★学校が 自分で 足したり 消したり します。
 *   ★★器（SQL）には 1行も 入れていません。
 *     ★画面で、その学校の 方が 押したときに 作ります。
 *     ★こちらで 勝手に 作ると、★消していいのか 分からなく なります。
 */
export const TEMPLATE_POSTS = Object.freeze([
  { name: "学長", perms: ["bill", "bill_pay", "meibo", "sched_all", "gyoji", "renraku_all", "shukketsu", "koma", "master", "post"] },
  { name: "副学長", perms: ["bill", "meibo", "sched_all", "gyoji", "renraku_all", "shukketsu", "koma", "master", "post"] },
  { name: "事務長", perms: ["bill", "meibo", "sched_all", "gyoji", "renraku_all", "shukketsu", "koma", "master", "post"] },
  { name: "学部長", perms: ["bill", "meibo", "sched_all", "gyoji", "renraku_all", "shukketsu", "koma", "master"] },
  { name: "学科長", perms: ["meibo", "sched_all", "gyoji", "shukketsu", "koma"] },
  { name: "教授", perms: ["sched_mine", "monka_write", "shukketsu", "koma_mine"] },
  { name: "准教授", perms: ["sched_mine", "monka_write", "shukketsu", "koma_mine"] },
  { name: "講師", perms: ["sched_mine", "monka_write", "shukketsu", "koma_mine"] },
  { name: "課長", perms: ["bill", "sched_all", "shukketsu", "koma", "post"] },
  { name: "職員", perms: ["sched_all", "shukketsu", "koma"] }
]);

// ---------------------------------------------------------------------------
// ★タブは「できること」から 決まります（★裁定 §7-3）
//
//   ★★役職の 名前で 分けません。★1つも 分けません。
//   ★★つまみを 切ると、★その場で タブが 変わります。
// ---------------------------------------------------------------------------

/**
 * ★タブと、★それを 開ける できること（★裁定 §7-3 そのまま）。
 *
 *   ホーム　　名簿 or 日程 or ご請求 の どれかが ある
 *   日程　　　日程（ぜんぶ or 自分の）が ある
 *   名簿　　　学校ぜんぶの 名簿が ある
 *   門下　　　自分の 門下に 書ける
 *   行事　　　行事が ある
 *   連絡　　　おしらせ or 門下を 読む or 門下に 書く の どれか
 *   設定　　　時間 or かたち or 役職 or ご請求 の どれか
 */
export const TAB_RULES = Object.freeze([
  { key: "home", label: "ホーム", any: ["meibo", "sched_all", "sched_mine", "bill"] },
  { key: "schedule", label: "日程", any: ["sched_all", "sched_mine"] },
  { key: "roster", label: "名簿", any: ["meibo"] },
  { key: "monka", label: "門下", any: ["monka_write"] },
  { key: "events", label: "行事", any: ["gyoji"] },
  { key: "threads", label: "連絡", any: ["renraku_all", "monka_read", "monka_write"] },
  // ★★2026-09-11、★koma_mine を 外しました（★総当たりが 捕まえました）。
  //   ★裁定 §7-3 は「設定　★時間 or かたち or 役職 or ご請求」です。
  //   ★「時間」は koma（★学校の 時間の 割り方・場所）です。
  //   ★★koma_mine（★自分の コマ）は、★学校の 設定では ありません。
  //     ★入れると、★教授に 学校の 設定が 開きます。★漏れです。
  { key: "settings", label: "設定", any: ["koma", "master", "post", "bill"] }
]);

/** ★持っている できことを、★Set に します。 */
export function permSet(perms) {
  if (perms instanceof Set) return perms;
  if (Array.isArray(perms)) return new Set(perms.filter(Boolean));
  if (perms && typeof perms === "object") {
    return new Set(Object.keys(perms).filter((k) => perms[k] === true));
  }
  return new Set();
}

/** ★その できことを 持っているか。 */
export function can(perms, key) {
  return permSet(perms).has(key);
}

/** ★その できことで 出る タブ。★名前で 分けません。 */
export function tabsForPerms(perms) {
  const s = permSet(perms);
  return TAB_RULES.filter((t) => t.any.some((k) => s.has(k)))
    .map((t) => ({ key: t.key, label: t.label }));
}

/** ★運営の 画面に 入れるか。★1つでも タブが 出れば 入れます。 */
export function mayEnterOpsByPerms(perms) {
  return tabsForPerms(perms).length > 0;
}

/**
 * ★その できことを、★人に 渡せるか（★裁定 §7-4）。
 *
 *   ★★決まりは 1つだけです。
 *     「学校ぜんぶに かかる ことは、★自分が 持っていないと 渡せません」
 *   ★★その方 自身にだけ かかる ものは、★持っていなくても 渡せます。
 *     ★学長は 教えなくても、★教授に「自分の 日程を 組む」を 渡せます。
 *
 *   ★★これ 1本で、★権限の 持ち上げが 起きません。
 *     ★学科長は「ご請求」を 持っていないので、★誰にも 渡せません。
 */
export function mayGrant(myPerms, key) {
  if (!PERM_KEYS.includes(key)) return false;
  if (!isSchoolWide(key)) return true;
  return can(myPerms, key);
}

/**
 * ★お金の できことは、★2つに 分かれています。
 *
 *   ★bill　　　… ★ご請求を **見る**
 *   ★bill_pay … ★ご請求を **払う**・支払い方法を 変える
 *
 *   ★★1つに まとめると、★見るだけの 方が 支払い方法を 変えられます。
 *     ★総当たりが 捕まえました（★2026-09-11・副学長・事務長・学部長・課長）。
 *   ★★見本も 2つに 分けています。★まとめないこと。
 */
export function maySeeBill(perms) { return can(perms, "bill"); }
export function mayPay(perms) { return can(perms, "bill_pay"); }

/**
 * ★その 役職を、★人に 付けられるか（★見本の canBecome）。
 *
 *   ★★その 役職が 持つ「学校ぜんぶに かかる」ことを、
 *     ★自分が ぜんぶ 持っていなければ 付けられません。
 *   ★★そうしないと、★自分より 強い 人を 作れて しまいます。
 */
export function mayGrantPost(myPerms, post) {
  const s = permSet(post && post.perms);
  return [...s].every((k) => mayGrant(myPerms, k));
}

/**
 * ★その 方の 役職を、★変えられるか（★見本の canChange）。
 *
 *   ★★いま 付いている 役職の「学校ぜんぶに かかる」ことを、
 *     ★自分が ぜんぶ 持っていなければ 触れません。
 *   ★★そうしないと、★自分より 強い 人を 降ろせて しまいます。
 *   ★★役職の 無い 方は、★誰でも 触れます（★まだ 何も 持っていません）。
 */
export function mayChangePerson(myPerms, theirPost) {
  if (!theirPost) return true;
  return mayGrantPost(myPerms, theirPost);
}

/** ★人の 役職を 変えられない ときの わけ。★隠しません。 */
export const CANNOT_CHANGE_REASON =
  "あなたが 持っていない できことは、渡せません。";

/** ★渡せない わけ。★画面に 出します。★隠しません（★裁定 §7-4）。 */
export const CANNOT_GRANT_REASON =
  "学校全部に かかる ことは、自分が 持っていないと 渡せません。";
