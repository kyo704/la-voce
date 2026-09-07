// ============================================================================
// 寝るときの姿勢と、締めつけ（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜）§3-3・§5-2
//            docs/lavoce-食事と就寝の設計.md §13-1・§14
//
//   ★★これは、★要配慮個人情報にあたります。
//     ★「逆流性食道炎は病名なので、病歴として明確に要配慮個人情報です」
//     ★頭の側を上げて寝るのは、★逆流に対して★することです。
//     ★だから、★記録そのものが、★病歴に近づきます。
//
//   ★★守ること（★周期の記録と、同じ構造にします）
//     ・★既定オフ
//     ・★オンにする前に、★専用の同意画面（consent.js の health.reflux_care）
//     ・★同意が無ければ、★記録させない
//     ・★先生からは、★完全に隔離（shareScope の対象外）
//     ・★病名を、★画面のどこにも書かない（§14-1）
//     ・★「逆流の疑いがあります」と書かない（§14-2）
//     ・★「受診してください」と書かない（§14-3）
//     ・★閾値・判定・色分けを、付けない（§14-4）
//
//   ★見張り components/tests/reflux-care.test.js
// ============================================================================

/**
 * ★寝るときの向き。
 *
 *   ★★「左向きが良い」と、★書きません。★書けば、それは助言です。
 *     ★文献はありますが、★このアプリは、★記録を返すだけです。
 *   ★「覚えていない」を、★必ず置きます。★思い出せない日があります。
 */
export const SLEEP_SIDES = Object.freeze([
  { key: "left", label: "左を下に" },
  { key: "right", label: "右を下に" },
  { key: "back", label: "あおむけ" },
  { key: "front", label: "うつぶせ" },
  { key: "unknown", label: "覚えていない" }
]);

export const SLEEP_SIDE_KEYS = Object.freeze(SLEEP_SIDES.map((s) => s.key));

/**
 * ★頭の側を上げたか。
 *
 *   ★高さ（cm）を聞きません。★測っておられません。
 *   ★「した／しない／覚えていない」の3つだけです。
 */
export const HEAD_RAISED = Object.freeze([
  { key: "yes", label: "上げた" },
  { key: "no", label: "上げなかった" },
  { key: "unknown", label: "覚えていない" }
]);

/**
 * ★おなかを締めつけていたか。
 *
 *   ★★声を使う方には、★これが起こります。
 *     ★帯、コルセット、きつい衣装、ベルト。
 *   ★どれで締めたかは、★聞きません。★衣装の話は、別に記録があります。
 */
export const BELLY_TIGHT = Object.freeze([
  { key: "yes", label: "締めていた" },
  { key: "no", label: "締めていない" },
  { key: "unknown", label: "覚えていない" }
]);

export function sideLabel(key) {
  const s = SLEEP_SIDES.find((x) => x.key === key);
  return s ? s.label : "";
}

/**
 * ★この機能が、その方に出てよいか。
 *
 *   ★★同意が無ければ、★出しません。★これが、いちばん外側の門です。
 *   ★★2か所で判定しないこと。★画面は、この関数だけを呼びます。
 *
 * @param {Array} consentRows  consents の行
 * @param {function} isGranted lib/consent.js の isGranted
 */
export function refluxCareApplies(consentRows, isGranted) {
  if (typeof isGranted !== "function") return false;
  return isGranted(consentRows, "health.reflux_care") === true;
}

/**
 * ★保存してよい形か。
 *
 *   ★★同意が無ければ、★空を返します。★記録を作らせません。
 *     ★「consentAt が null のまま記録を作らせない」（§13-1）。
 *   ★知らない値は、★落とします。★画面から何が来ても、ここで揃えます。
 *
 * @returns {{sleepSide:string|null, headRaised:string|null, bellyTight:string|null}}
 */
export function sanitize(input, allowed) {
  const empty = { sleepSide: null, headRaised: null, bellyTight: null };
  if (!allowed) return empty;
  const v = input || {};
  const pick = (val, list) => (list.some((x) => x.key === val) ? val : null);
  return {
    sleepSide: pick(v.sleepSide, SLEEP_SIDES),
    headRaised: pick(v.headRaised, HEAD_RAISED),
    bellyTight: pick(v.bellyTight, BELLY_TIGHT)
  };
}

/** ★その日に、1つでも書かれているか。 */
export function hasAny(entry) {
  const e = entry || {};
  return !!(e.sleepSide || e.headRaised || e.bellyTight);
}

/**
 * ★列の名前。★1か所で持ちます。
 *
 *   ★★shareScope の「先生に渡さない列」に、★3つとも入れること。
 *     ★入れ忘れると、★先生の画面に、★病歴が渡ります。
 *   ★見張りが、そろっているかを見ています。
 */
export const REFLUX_CARE_COLUMNS = Object.freeze([
  "sleep_side",
  "head_raised",
  "belly_tight"
]);

/**
 * ★書いてはいけない言葉。★見張りが、この一覧で画面を調べます。
 *
 *   ★出どころ docs/lavoce-食事と就寝の設計.md §14
 *   ★★病名を、機能名・画面名・設定名に使わないこと（§14-1）。
 */
export const FORBIDDEN_WORDS = Object.freeze([
  "逆流性食道炎",
  "咽喉頭逆流",
  "LPR",
  "疑いがあります",
  "受診してください",
  "治療"
]);
