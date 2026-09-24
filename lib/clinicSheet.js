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
  { key: "job", label: "仕事（声を使う仕事）" },
  // ★★★`history` は 見本の `JU_OPT` に ありません。★実装だけの ものです。
  //   ★★節（既往・服薬）は 前から 画面に ありましたが、★この 一覧に 無く、
  //     ★`normalizePick` が 鍵を 落として いたので **誰も 開けません** でした
  //     （★2026-09-25 に 見つかりました）。
  //   ★★坂本さんが「選ぶ一覧に追加します」と 決めました。★だから 足します。
  //     ★★並びは いちばん 後ろ です ── ★見本に ある 10個の 順を 崩しません。
  //   ★既定は ほかと 同じく「載せない」です（`CLINIC_DEFAULT = []`）。
  { key: "history", label: "既往・服薬" }
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
 * ★期間の 札（★見本 nJushin の `.pills`）。
 *
 *   ★★見本は「この3か月 ／ この1年 ／ 選ぶ」の 3つです。
 *     ★★暦を いきなり 出しません。★多くの 人は 3か月で 足ります。
 *   ★★`days` が null の ものは、★暦を 開きます。
 */
export const CLINIC_PERIODS = Object.freeze([
  { key: "3m", label: "この3か月", days: 90 },
  { key: "1y", label: "この1年", days: 365 },
  { key: "pick", label: "選ぶ", days: null }
]);

/**
 * ★札から 期間を 出します。
 *
 *   ★★`todayISO` の 日を 終わりに、★`days` 日 さかのぼります。
 *   ★★「選ぶ」の ときは null を 返します（★暦で 決めます）。
 */
export function periodRange(key, todayISO) {
  const p = CLINIC_PERIODS.find((x) => x.key === key);
  if (!p || p.days == null || !todayISO) return null;
  const end = new Date(todayISO + "T00:00:00Z");
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date(end.getTime() - (p.days - 1) * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/**
 * ★行の 右に 出す 字（★見本 nJushin の `<s>`）。
 *
 *   ★★見本は 3通りです。★1つの ところで 決めます。
 *     ★① 外せない　… 緑の「✓」だけ。★押せません
 *     ★② 載せる　　… 緑の「✓ 載せる」
 *     ★③ 載せない　… 薄い字の「載せない」
 *
 *   ★★色に ついて。
 *     ★★見本は 薄い ほうに `--ink3`（#7C6C5E）を 使って います。
 *       ★この アプリに `--ink3` は ありません。
 *       ★`tokens.md §1-2` は「--ink3 を 文字に 使わない」と 決めて います。
 *       ★★そこで `C.inkSoft` に します。★新しい 色を 作りません。
 */
export function rowMark(state) {
  if (state === "always") return { text: "✓", tone: "on" };
  return state ? { text: "✓ 載せる", tone: "on" } : { text: "載せない", tone: "off" };
}

/**
 * ★行に 添える 小さな 字（★見本の `<span class="usu">`）。★2つ だけ です。
 */
export const CLINIC_ROW_NOTES = Object.freeze({
  name: "入れなくても 使えます。窓口で ご自分で 書き足せます",
  ownWords: "書いた文が そのまま 載ります"
});

/**
 * ★★★紙に 載せる お約束（★2026-09-25・★坂本さんの 決め）。
 *
 *   ★★これは `CLINIC_NOTICE` とも `CLINIC_FOOT` とも 別 です。
 *     ★あの 2つは **選ぶ 人** に 出します。★選ぶ ところは 印刷しません。
 *     ★★だから、★印刷の ときに 消える ところに しか お約束が 無い、
 *       ★という 形に なって いました。
 *   ★★★紙は 人の 手を 離れて お医者さんに 渡ります。
 *     ★渡る 紙の 上に 書いて いないなら、★書いて いないのと 同じ です。
 *
 *   ★決めの ことば ──
 *     「医師に渡す紙こそ、最も誤解を招いてはいけない場面です。
 *       画面上でのみ約束を示し、実際に第三者に渡る紙で省略するのは不誠実です」
 *
 *   ★ここに 置く 理由は、★画面が 2つに 分かれても 文が 1つで 済む から です。
 */

/** ★紙の あたま（★見本の `.paper` の 1つめ）。 */
export const CLINIC_PAPER_HEAD = Object.freeze([
  "本人が 毎日 つけた 記録から 作りました。診断では ありません。",
  "点数・尺度・他人との くらべは 使っていません。実数だけです。"
]);

/** ★名前を 載せない ときに、★載せない と 紙に 書きます（★空欄は 書き忘れに 見えます）。 */
export const CLINIC_PAPER_NONAME = "氏名は 入れていません";

/**
 * ★節ごとの 断り。
 *
 *   ★★`chart` は 見本では「1マス＝1日」です。★実装は 週ごとの 棒 です。
 *     ★★見本の 字を そのまま 写すと、★紙の 上で 嘘に なります。
 *       ★お約束の ところ（「点数では ありません」）だけ 残しました。
 *   ★★★2026-09-25、★坂本さんが これで いくと 決めました ──
 *     ★「見本の日次マス表示に合わせて作り直すコストを考慮し、正確な代替文言での
 *       対応を継続してください」
 *     ★★もう たずねません。★日ごとの マスを 作る 話は 閉じて います。
 */
export const CLINIC_PAPER_SECTION = Object.freeze({
  concerns: "病名では ありません。本人が 選んだ ことばです。",
  chart: "週ごとの 実数です。点数では ありません。"
});

/** ★紙の おわりの 箱（★見本 `この紙について`）。 */
export const CLINIC_PAPER_ABOUT_TITLE = "この紙について";
export const CLINIC_PAPER_ABOUT = Object.freeze([
  "本人が つけた 記録を、そのまま 数えたものです",
  "診断・重症度の 判定では ありません",
  "質問票（尺度）の 点数は 使っていません",
  "載せる項目は 本人が 選びました。選ばなかったものは 載っていません",
  "元の記録は、本人の 端末から CSV で お出しできます",
  "アプリの中から、医療機関へ 送る道は ありません",
  "数えただけです。原因かどうかは 分かりません。検定は かけていません"
]);

/** ★いちばん 下（★見本 `.note`）。★渡す 相手は ご本人が 決めます。 */
export const CLINIC_PAPER_FOOT = Object.freeze([
  "はじめは 少ないほうから 始まります。足すのは ご本人です。",
  "病名・尺度名を 1つも 使っていません。点数も 出していません。",
  "この紙は 要配慮個人情報です。渡す相手を、ご自分で 決めてください。"
]);

/**
 * ★下の 3行（★見本 `.note`）。
 *
 *   ★★「これは 無料です」まで 見本の とおりです。
 *     ★安全に かかわる ものに 値段を 付けない、という 決めを 画面で 言って います。
 */
export const CLINIC_FOOT = Object.freeze([
  "載せる項目は あなたが 決めます。最初から 多くを 出しません。",
  "病名・尺度の 名前・点数は、どの項目にも 入りません。",
  "安全に かかわるものなので、これは 無料です。"
]);

/**
 * ★はじめの 3行（★見本 `.warn`）。
 */
export const CLINIC_INTRO = Object.freeze([
  "お医者さんに 見せる 1枚を 作ります。",
  "はじめは 一番少ない ところだけが 入っています。",
  "足したいものが あれば、ご自分で 入れてください。"
]);

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

/**
 * ★いま 何項目 載るか（★見本「N項目で 1枚に する」）。
 *
 *   ★★外せない 2つを 数に 入れます。★見本の n が そうです。
 *   ★★これは 減って いく 数では ありません。★足りない、と 読ませないこと。
 */
export function pickCount(list) {
  return CLINIC_ALWAYS.length + normalizePick(list).length;
}

// ============================================================================
// ★レッスンに 持っていく 1枚（★見本 `nLesson`）
//
//   ★★受診用とは **別の 画面**です。★札で 切り替えます。
//     ★★2026-09-14 まで、★札を 押しても 中身が 変わりませんでした。
//       ★「お医者さんに 見せる 1枚を 作ります」と 出た ままでした。
//
//   ★★受診用との 違い。
//     ★① 期間の 札が 違う（★この2週間 ／ この1か月 ／ この3か月）
//     ★② 外せない 行が 無い。★ぜんぶ 選べます
//     ★③ 既定で 2つ 入って います（★日数と 本人の ことば）
//     ★④ 本人の ことばは いつも 書けます（★見本に 入力欄が あります）
//     ★⑤ 断りの 中身が 違う（★「先生に 届く道は ありません」）
// ============================================================================

/** ★覚え場所の 名前（★受診用とは 別に します）。 */
export const LESSON_PICK_KEY = "woolsong-lesson-pick";

/** ★期間の 札（★受診用より 短い ほうに 寄せて います）。 */
export const LESSON_PERIODS = Object.freeze([
  { key: "2w", label: "この2週間", days: 14 },
  { key: "1m", label: "この1か月", days: 30 },
  { key: "3m", label: "この3か月", days: 90 }
]);

/**
 * ★載せるもの。★`on` が 既定です。
 *
 *   ★★外せない ものは ありません。★ぜんぶ 外せます。
 *     ★★見本の 断り ──「選べるということは、載せないと 選べるということです」。
 */
export const LESSON_ITEMS = Object.freeze([
  { key: "days", label: "この期間に 記録した日数", on: true },
  { key: "hardDays", label: "声が 出づらかった日（数）", on: false },
  { key: "hours", label: "よく 使った 時間帯", on: false },
  { key: "stageDays", label: "本番・レッスンが あった日", on: false },
  { key: "practiceNote", label: "稽古ノートから 1つ（自分で 選ぶ）", on: false },
  { key: "maybeNote", label: "たぶんこれかも メモから 1つ", on: false },
  { key: "ownWords", label: "本人の ことば（自由に 書く）", on: true }
]);

const LESSON_KEYS = LESSON_ITEMS.map((x) => x.key);

/** ★はじめの 選び（★見本の 既定）。 */
export const LESSON_DEFAULT = Object.freeze(
  LESSON_ITEMS.filter((x) => x.on).map((x) => x.key));

/** ★はじめの 2行（★見本 `.warn`）。 */
export const LESSON_INTRO = Object.freeze([
  "レッスンに 持っていく 1枚を 作ります。",
  "載せるものは、自分で 1つずつ 選びます。まとめて 全部は 載りません。"
]);

/** ★見出し。 */
export const LESSON_HEADINGS = Object.freeze({
  period: "期間",
  items: "載せるもの（選んだものだけ 載ります）",
  ownWords: "本人の ことば"
});

/** ★この1枚に ついて（★見本の クリーム色の 1枚）。 */
export const LESSON_NOTICE = Object.freeze([
  "アプリの中から、先生に 届く道は ありません。端末に 出すだけです",
  "「先生に 送る」「共有」の ボタンは 作りません",
  "載せるものは 自分で 選びます。選べるということは、載せないと 選べるということです",
  "出来ばえ・点数・順位は、どの項目にも 入りません"
]);

/** ★下の 2行（★見本 `.note`）。 */
export const LESSON_FOOT = Object.freeze([
  "先生に 見せるかどうかも、どこまで 見せるかも、あなたが 決めます。",
  "アプリは 見せろとも 見せるなとも 言いません。"
]);

/** ★知らない 名前は 落とします。 */
export function normalizeLessonPick(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach((k) => { if (LESSON_KEYS.includes(k) && !out.includes(k)) out.push(k); });
  return out;
}

/** ★押したときの、★次の 一覧。 */
export function toggleLessonPick(list, key) {
  const cur = normalizeLessonPick(list);
  return cur.includes(key)
    ? cur.filter((k) => k !== key) : normalizeLessonPick([...cur, key]);
}

/** ★いま 何項目 載るか。★外せない ものが 無いので、選んだ 数 そのままです。 */
export function lessonCount(list) {
  return normalizeLessonPick(list).length;
}

/** ★端末から 読みます。★はじめては 見本の 既定を 返します。 */
export function readLessonPick() {
  if (typeof window === "undefined") return [...LESSON_DEFAULT];
  try {
    const raw = window.localStorage.getItem(LESSON_PICK_KEY);
    return raw == null ? [...LESSON_DEFAULT] : normalizeLessonPick(JSON.parse(raw));
  } catch (e) {
    return [...LESSON_DEFAULT];
  }
}

/** ★端末に 覚えます。★覚えられなくても 落ちません。 */
export function writeLessonPick(list) {
  const v = normalizeLessonPick(list);
  if (typeof window === "undefined") return v;
  try {
    window.localStorage.setItem(LESSON_PICK_KEY, JSON.stringify(v));
  } catch (e) { /* ★そのままで 効きます */ }
  return v;
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
