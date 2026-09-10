// ============================================================================
// ★受診用の 1枚 ── ★何を 載せるか（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月11日の12点… §14
//     「★ご指摘のとおりです。個人情報の 塊を、既定で 出していました」
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化…）.md §4
//     「★✕『これが 無いと、紙の 意味が ありません』←★強すぎました。消しました
//       ★◯『この 2つだけで、1枚に できます』
//       ★見出しも『かならず 入るもの』→『はじめから 入っているもの』に」
//
//   ★★いちばん 大事な 決め。
//     ★★足すものは、★ぜんぶ 既定が「載せない」です。
//     ★★氏名も 既定で 載せません（★窓口で ご自分で 書き足せます）。
//     ★★病名・尺度の 名前・点数は、★どの項目にも 入りません。
//
//   ★★「2項目のままでも、それで 完成です」。
//     ★足りない、と 読ませないこと。★数えないこと。
//
//   ★見張り components/tests/clinic-sheet.test.js
// ============================================================================

/** ★覚え場所の 名前（★端末ごと。★サーバに 送りません）。 */
export const CLINIC_PICK_KEY = "woolsong-clinic-pick";

/**
 * ★はじめから 入っているもの（★外せません）。
 *
 *   ★★見出しは「かならず 入るもの」では ありません。
 *     ★「★かならず」は、★足さないと 意味が ない、と 読まれます。
 */
export const CLINIC_ALWAYS = Object.freeze([
  { key: "period", label: "期間と 記録した日数" },
  { key: "hardDays", label: "声が 出づらかった日（数と 経過）" }
]);

/**
 * ★足すなら（★ぜんぶ 既定は「載せない」）。
 *
 *   ★★並びも 見本の とおりです。
 */
export const CLINIC_OPTIONAL = Object.freeze([
  { key: "concerns", label: "のど・からだで 気になったこと（日数）" },
  { key: "sleep", label: "昨夜の 睡眠" },
  { key: "speech", label: "声を 使った 時間" },
  { key: "dinnerToBed", label: "食べ終えてから 寝るまで" },
  { key: "nightMeal", label: "寝る前に 食べたもの" },
  { key: "stageDays", label: "本番・レッスンの あった日数" },
  { key: "prevDay", label: "出づらかった日の「前の日」" },
  { key: "ownWords", label: "本人の ことば" },
  { key: "name", label: "名前を 入れる" },
  { key: "job", label: "仕事（声を使う仕事）" }
]);

const OPT_KEYS = CLINIC_OPTIONAL.map((x) => x.key);

/**
 * ★選ぶ画面に、★いつも 出す 5行（★見本の とおり・1文字も 変えないこと）。
 *
 *   ★★5行目が いちばん 大事です ──「迷ったら、少ないほうを 選んでください」。
 */
export const CLINIC_NOTICE = Object.freeze([
  "この紙は 要配慮個人情報です。落とすと 取り返せません",
  "アプリの中から 医療機関へ 送る道は ありません",
  "学校にも 先生にも 運営にも 届きません",
  "多く 載せるほど、渡した相手に 分かることが 増えます",
  "迷ったら、少ないほうを 選んでください"
]);

/** ★見出し（★「かならず」と 書かないこと）。 */
export const CLINIC_HEADINGS = Object.freeze({
  always: "はじめから 入っているもの",
  optional: "足すなら",
  enough: "この 2つだけで、1枚に できます。"
});

/**
 * ★既定は「1つも 足さない」。
 *
 *   ★★空の 一覧です。★「おすすめ」を 用意しません。
 *     ★用意した とたん、★それが 既定に なります。
 */
export const CLINIC_DEFAULT = Object.freeze([]);

/** ★知らない 名前は 落とします。★同じ ものは 1つに します。 */
export function normalizePick(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach((k) => { if (OPT_KEYS.includes(k) && !out.includes(k)) out.push(k); });
  return out;
}

/** ★押したときの、★次の 一覧。 */
export function togglePick(list, key) {
  const cur = normalizePick(list);
  return cur.includes(key) ? cur.filter((k) => k !== key) : normalizePick([...cur, key]);
}

/** ★その項目を 載せるか。★はじめから 入っているものは、いつも true。 */
export function isOn(list, key) {
  if (CLINIC_ALWAYS.some((x) => x.key === key)) return true;
  return normalizePick(list).includes(key);
}

/** ★端末から 読みます。★読めなくても 落ちません。 */
export function readPick() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CLINIC_PICK_KEY);
    return raw == null ? [] : normalizePick(JSON.parse(raw));
  } catch (e) {
    return [];
  }
}

/** ★端末に 覚えます。★覚えられなくても 落ちません。 */
export function writePick(list) {
  const v = normalizePick(list);
  if (typeof window === "undefined") return v;
  try { window.localStorage.setItem(CLINIC_PICK_KEY, JSON.stringify(v)); } catch (e) { /* ★そのままで 効きます */ }
  return v;
}
