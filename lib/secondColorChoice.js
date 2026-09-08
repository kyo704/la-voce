import table from "@/docs/assets/second-color-table.json";
import { CLOTH_COLORS } from "@/lib/clothColors";
import { mayChooseSecondColorByTier } from "@/lib/tiers";

// ============================================================================
// 柄の 2色目を 選び直す（2026-09-08 夜）
//
//   ★出どころ second-color-table.json（second-color-2026-09-08-final2）の override
//
//   ★★既定は、★全員 同じです。★1色目から 表を引いて 決めます。
//     ★★例外は 1件も ありません（★2026-09-08・坂本さん確定）。
//   ★★そのうえで、★¥1,280「よそおい ぜんぶ」の方だけ、
//     ★★2色目を 24色から 選び直せます。★選ばなければ 既定の ままです。
//
//   ★★絵は 作り直しません。★light／dark／mask は そのままです。
//     ★式の 色2 を 差し替えるだけです。
//       out = dark + (light − dark)/255 × 色1 ＋ mask/255 × 色2
//
//   ★★押せない色が あります。
//     ★1色目との 明るさの対比（WCAG）が 2.2 未満の色は、★柄が 消えます。
//     ★★消さずに、★押せない灰色に します。★あることは 見えたままです。
//
//   ★★どなたが 選べるか（★2026-09-08 夜・段が 入りました）。
//     ★★正は 段（tier）です。★¥1,280「よそおい ぜんぶ」の方だけ。
//       ★決めは lib/tiers.js が 持ちます。
//     ★★門の名簿（NEXT_PUBLIC_SECOND_COLOR_USER_IDS）も 残します。
//       ★試していただくための 道です。★消すと、お金を お払いいただかないと
//       ★見られなくなります。★名簿が 空なら、★段だけで 決まります。
//
//   ★見張り components/tests/second-color-choice.test.js
// ============================================================================

/** ★表の 版。★差し替えたら、ここが 変わります。 */
export const TABLE_VERSION = table.version;

/** ★色の 名前 → 鍵。 */
const KEY_BY_NAME = Object.freeze(
  Object.fromEntries(CLOTH_COLORS.map((c) => [c.name, c.key]))
);

/** ★1色目の鍵 → 選び直せる 2色目の鍵（★override.allowed）。 */
export const SECOND_ALLOWED = Object.freeze(
  Object.fromEntries(
    Object.entries((table.override && table.override.allowed) || {}).map(
      ([name, list]) => [
        KEY_BY_NAME[name],
        Object.freeze((list || []).map((n) => KEY_BY_NAME[n]).filter(Boolean))
      ]
    ).filter(([k]) => k)
  )
);

/**
 * ★その1色目のとき、★選び直せる 2色目の鍵。
 *
 *   ★★表に無い1色目なら、★空を 返します。★勝手に 広げません。
 */
export function allowedSecondKeys(firstKey) {
  if (!firstKey) return [];
  return SECOND_ALLOWED[firstKey] || [];
}

/** ★その2色目を、選べるか。 */
export function isSecondAllowed(firstKey, secondKey) {
  return allowedSecondKeys(firstKey).includes(secondKey);
}

/**
 * ★2色目を 選び直せる方か。
 *
 *   ★★段（¥580 と ¥1,280）を 見分ける手がかりが、★まだ ありません。
 *     ★だから、★門の名簿で 出し入れします。
 *   ★★名簿が 空なら、★どなたにも 出しません。★勝手に 開けません。
 */
export function mayChooseSecondColor(userId, env, subscription) {
  // ★★段（tier）が 入りました（★2026-09-08 夜・SQL 実行ずみ）。
  //   ★★これが 正です。★¥1,280「よそおい ぜんぶ」の方だけです。
  if (mayChooseSecondColorByTier(subscription)) return true;
  // ★★門の名簿は、★残します。★試していただくための 道です。
  //   ★★段が 入っても、★試す方には 出せるように しておきます。
  //     ★消すと、★お金を お払いいただかないと 見られなくなります。
  //   ★名簿が 空なら、★段だけで 決まります。
  const raw = (env && env.NEXT_PUBLIC_SECOND_COLOR_USER_IDS) || "";
  const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return false;
  return ids.includes(String(userId || ""));
}

/** ★2色目を 選び直した記録の、置き場所（★character_equipped の中）。 */
export const SECOND_FIELD = "clothColors2";

/** ★いま 選び直している 2色目（★選んでいなければ null）。 */
export function chosenSecond(equipped, itemKey) {
  const m = (equipped && equipped[SECOND_FIELD]) || {};
  return m[itemKey] || null;
}

/**
 * ★2色目を 選び直します。★同じものを もう一度なら、★既定に 戻します。
 *
 *   ★★消しません。★「もとにもどす」は、★選び直しを 外すだけです。
 *     ★1色目も、★着ているものも、★1つも 触りません。
 */
export function setSecond(equipped, itemKey, colorKey) {
  const prev = (equipped && equipped[SECOND_FIELD]) || {};
  const next = { ...prev };
  if (!colorKey || prev[itemKey] === colorKey) delete next[itemKey];
  else next[itemKey] = colorKey;
  return { ...(equipped || {}), [SECOND_FIELD]: next };
}

/** ★既定に 戻します（★「もとにもどす」）。 */
export function clearSecond(equipped, itemKey) {
  return setSecond(equipped, itemKey, null);
}
