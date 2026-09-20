// ============================================================================
// ★読み込む（★校務システム → うち）── ★見本 `stImport`・裁定 その97 C群
//
//   ★★★つなぐのでは ありません。★書き出した ファイルを 入れる だけ です。
//     ★★人が 入れた ときだけ 動きます。★自動で 動きません。
//
//   ★★★入れない ものが あります。★一覧に すら ありません。
//     ★健康・声・体調 …… ★入れる 先が ありません（★`IMPORT_TARGETS`）。
//     ★メールアドレス …… ★既定で 入れません（★招待に 使う ため、人が 決めます）。
//     ★門下・役職 …… ★動かしません。★うちで 決める ものです。
//
//   ★★★消しません。★ファイルに 無い 方を、★勝手に 退会に しません。
//     ★★一覧に 出す だけ です。★どうするかは 人が 決めます。
//
//   ★★ここは 読むだけ の 蔵 です。★台帳には 触りません。
//
//   ★見張り components/tests/ops-import.test.js
// ============================================================================

/** ★読める もの（★見本の「読めるもの」）。 */
export const READABLE = Object.freeze([
  { name: "CSV", note: "Shift_JIS・UTF-8　／　自動で 見分けます", ok: true },
  { name: "タブ区切り（.txt）", note: "—", ok: true },
  { name: "Excel（.xlsx）", note: "まだ 読めません", ok: false },
  { name: "PDF", note: "読めません（表が こわれます）", ok: false }
]);

/**
 * ★うちの どこに 入れるか（★見本 `IMP_TO`）。
 *
 *   ★★★健康・声・体調の 行き先は、★この 一覧に 1つも ありません。
 *     ★★作って いません。★だから 選べません。
 *   ★★`col` … ★`enrollments` の 列。★`null` は 入れない もの です。
 */
export const IMPORT_TARGETS = Object.freeze([
  { label: "（取り込みません）", col: null },
  { label: "番号", col: "student_number" },
  { label: "お名前", col: "__name" },
  { label: "よみ", col: "__kana" },
  { label: "学年", col: "grade_label" },
  { label: "所属（学科・コース）", col: "__division" },
  { label: "在籍の 様子", col: "status" }
]);

/** ★もとの システム（★見本 `IMP_PRE`）。 */
export const SOURCE_PRESETS = Object.freeze({
  "そのまま": {},
  "BLEND": { "学籍番号": "番号", "氏名": "お名前" },
  "賢者クラウド": { "学籍番号": "番号", "氏名": "お名前", "氏名カナ": "よみ" },
  "EDUCOM": { "学籍番号": "番号", "氏名": "お名前" },
  "システムディ": { "学籍番号": "番号", "氏名": "お名前" }
});

/** ★見出しから、★当たりを つけます（★見本 `IMP_DEF`）。 */
export const HEADER_GUESS = Object.freeze({
  "学籍番号": "番号", "学籍№": "番号", "生徒コード": "番号", "生徒ID": "番号",
  "氏名": "お名前", "学生氏名": "お名前", "生徒氏名": "お名前", "名前": "お名前",
  "氏名カナ": "よみ", "カナ": "よみ", "ふりがな": "よみ",
  "学年": "学年", "学科": "所属（学科・コース）", "学科・コース": "所属（学科・コース）",
  "コース名": "所属（学科・コース）", "専攻": "所属（学科・コース）",
  "状態": "在籍の 様子", "在籍区分": "在籍の 様子"
});

/** ★どれで 同じ人と 見分けるか。 */
export const MATCH_KEYS = Object.freeze([
  { key: "number", label: "学籍番号", note: "一番 確かです（おすすめ）", ok: true },
  { key: "name_grade", label: "お名前 と 学年", note: "学籍番号が 無い ファイルのとき", ok: true },
  { key: "email", label: "メールアドレス", note: "入れていないので 使えません", ok: false }
]);

// ---------------------------------------------------------------------------
// ★読む
// ---------------------------------------------------------------------------

/**
 * ★文字コードを 見分けます。
 *
 *   ★★BOM が あれば UTF-8。
 *   ★★UTF-8 として 読んで、★化けが 出たら Shift_JIS と 見ます。
 *     ★★`TextDecoder` は「読む」方は Shift_JIS も できます。
 *       ★★（★「書く」方は できません ── ★`lib/opsExport.js` の 註）。
 */
export function sniffEncoding(bytes) {
  const b = bytes || [];
  if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return "UTF-8";
  // ★★UTF-8 として 筋が 通るか だけ を 見ます。★表は 持ちません。
  let i = 0;
  while (i < b.length) {
    const c = b[i];
    if (c < 0x80) { i += 1; continue; }
    const n = c >= 0xF0 ? 3 : c >= 0xE0 ? 2 : c >= 0xC0 ? 1 : -1;
    if (n < 0) return "Shift_JIS";
    for (let k = 1; k <= n; k += 1) {
      if (i + k >= b.length || (b[i + k] & 0xC0) !== 0x80) return "Shift_JIS";
    }
    i += n + 1;
  }
  return "UTF-8";
}

/**
 * ★CSV を ほどきます（★引用符の 中の 読点と 改行も 見ます）。
 *
 *   ★★タブ区切りも 読みます。★1行目の 数で 決めます。
 */
export function parseTable(text) {
  const s = String(text || "").replace(/^﻿/, "");
  if (!s.trim()) return [];
  const 頭の行 = s.split(/\r?\n/)[0] || "";
  const 区切り = (頭の行.match(/\t/g) || []).length > (頭の行.match(/,/g) || []).length
    ? "\t" : ",";
  const 出 = [];
  let 行 = [], 桝 = "", 中 = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (中) {
      if (c === '"') {
        if (s[i + 1] === '"') { 桝 += '"'; i += 1; } else 中 = false;
      } else 桝 += c;
      continue;
    }
    if (c === '"') { 中 = true; continue; }
    if (c === 区切り) { 行.push(桝); 桝 = ""; continue; }
    if (c === "\n") { 行.push(桝); 出.push(行); 行 = []; 桝 = ""; continue; }
    if (c === "\r") continue;
    桝 += c;
  }
  if (桝 !== "" || 行.length) { 行.push(桝); 出.push(行); }
  return 出.filter((r) => r.some((x) => String(x).trim() !== ""));
}

/** ★見出しから、★つなぎの 当たりを 作ります。 */
export function guessMapping(headers, preset) {
  const 前 = SOURCE_PRESETS[preset] || {};
  const 出 = {};
  (headers || []).forEach((h) => {
    const k = String(h || "").trim();
    出[k] = 前[k] || HEADER_GUESS[k] || "（取り込みません）";
  });
  return 出;
}

/** ★同じ 行き先に 2つ 以上 つないで いないか。★お名前は 要ります。 */
export function mappingProblems(mapping) {
  const 値 = Object.values(mapping || {});
  const 重 = [...new Set(値.filter((v) => v !== "（取り込みません）"
    && 値.filter((x) => x === v).length > 1))];
  const 名なし = !値.includes("お名前");
  return { duplicated: 重, noName: 名なし };
}

// ---------------------------------------------------------------------------
// ★何が 起きるか（★まだ 何も 変えません）
// ---------------------------------------------------------------------------

/** ★1行 ぶんを、★うちの 言葉に 直します。 */
export function toRecord(headers, row, mapping) {
  const 出 = {};
  (headers || []).forEach((h, i) => {
    const 先 = (mapping || {})[String(h || "").trim()];
    const 的 = IMPORT_TARGETS.find((t) => t.label === 先);
    if (!的 || !的.col) return;
    出[的.col] = String(row[i] === undefined ? "" : row[i]).trim();
  });
  return 出;
}

/** ★在籍の 様子の 字を、★台帳の 値に します。★分からなければ null。 */
export function statusOf(word) {
  const w = String(word || "").trim();
  if (!w) return null;
  if (/在籍|在学|active/i.test(w)) return "active";
  if (/休学/.test(w)) return "active";
  if (/退学|卒業|除籍|left/i.test(w)) return "left";
  return null;
}

/**
 * ★下見（★見本 ④「何が 起きるか」）。
 *
 *   ★★★1行も 変えません。★数えて、★並べる だけ です。
 *   ★★`current` … ★いまの 在籍（`enrollments` に 名前を 添えた もの）
 *   ★★返す もの ──
 *     `add`      ★うちに 居ない 方（★いまは 入れられません。★下の 註）
 *     `change`   ★直る 方（★どの 列が どう 変わるか まで）
 *     `same`     ★変わらない 方
 *     `odd`      ★あやしい 行（★入れません）
 *     `missing`  ★ファイルに 居ない 方（★消しません）
 */
export function planImport({ headers, rows, mapping, current, matchKey }) {
  const 素 = (rows || []).map((r, i) => ({ 行: i + 2, rec: toRecord(headers, r, mapping) }));
  const 見分け = (rec) => (matchKey === "name_grade"
    ? `${rec.__name || ""}｜${rec.grade_label || ""}`
    : String(rec.student_number || ""));
  const いま = new Map((current || []).map((c) => [
    matchKey === "name_grade" ? `${c.name || ""}｜${c.grade_label || ""}`
      : String(c.student_number || ""), c]));

  const add = [], change = [], same = [], odd = [], 見た = new Set();
  const 鍵の数 = new Map();
  素.forEach((x) => {
    const k = 見分け(x.rec);
    鍵の数.set(k, (鍵の数.get(k) || 0) + 1);
  });

  素.forEach(({ 行, rec }) => {
    const k = 見分け(rec);
    if (!rec.__name) {
      odd.push({ line: 行, what: "お名前が 空です", how: "取り込みません" });
      return;
    }
    if (!k || k === "｜" || k === "") {
      odd.push({ line: 行, what: "見分ける ものが 空です", how: "取り込みません" });
      return;
    }
    if (鍵の数.get(k) > 1) {
      odd.push({ line: 行, what: `同じ ${matchKey === "name_grade" ? "お名前と 学年" : "学籍番号"}が 2つ あります（${k}）`,
        how: "どちらも 取り込みません" });
      return;
    }
    const 今 = いま.get(k);
    if (!今) { add.push({ line: 行, rec }); return; }
    見た.add(k);
    const 差 = [];
    ["student_number", "grade_label"].forEach((col) => {
      const 新 = rec[col];
      if (新 !== undefined && 新 !== "" && String(今[col] || "") !== 新) {
        差.push({ col, from: 今[col] || "", to: 新 });
      }
    });
    if (rec.__division && String(今.division || "") !== rec.__division) {
      差.push({ col: "__division", from: 今.division || "", to: rec.__division });
    }
    if (差.length) change.push({ line: 行, id: 今.id, name: 今.name, diff: 差 });
    else same.push({ id: 今.id, name: 今.name });
  });

  const missing = (current || []).filter((c) => {
    const k = matchKey === "name_grade" ? `${c.name || ""}｜${c.grade_label || ""}`
      : String(c.student_number || "");
    return !見た.has(k) && !素.some((x) => 見分け(x.rec) === k);
  }).map((c) => ({ id: c.id, name: c.name, student_number: c.student_number || "" }));

  return { add, change, same, odd, missing };
}

/** ★直る 中身の 内わけ（★見本「直る 31人の 中身」）。 */
export function changeBreakdown(change) {
  const 数 = { grade_label: 0, __division: 0, student_number: 0 };
  (change || []).forEach((c) => (c.diff || []).forEach((d) => {
    if (数[d.col] !== undefined) 数[d.col] += 1;
  }));
  return [
    { label: "学年が 変わった", n: 数.grade_label },
    { label: "所属が 変わった", n: 数.__division },
    { label: "学籍番号が 変わった", n: 数.student_number }
  ].filter((x) => x.n > 0);
}

// ---------------------------------------------------------------------------
// ★字
// ---------------------------------------------------------------------------

export const IMPORT_HEAD = "読み込む（校務システム → うち）";
export const IMPORT_WARN = Object.freeze([
  "つなぐのでは ありません。校務システムから 書き出した ファイルを、ここに 入れます。",
  "自動で つながりません。入れた ときだけ 動きます。",
  "消しません。ファイルに 無い方を、勝手に 退会に しません。",
  "招待を 自動で 送りません。",
  "健康の 記録は 1つも 入りません。（入れる 列が ありません）"
]);
export const STEPS = Object.freeze(["ファイルを 選ぶ", "列を つなぐ", "下読み", "何が 起きるか", "取り込む"]);
export const PICK_FILE = "パソコンから 選ぶ";
export const HEADLINE_NOTE = "1行目を 見出しとして 読みます。見出しが 無い ファイルは 受け取れません。";
export const NOTHING_CHANGED = "ここまで、何も 変わって いません。読んで 見せて いるだけです。";
export const MISSING_HEAD = "ファイルに いない方";
export const MISSING_LINES = Object.freeze([
  "この方たちを、消しません。退会にも しません。",
  "一覧に 出すだけです。どうするかは、人が 名簿で 決めてください。"
]);
export const ODD_HEAD = "あやしい";
export const ODD_SUB = "この 行だけ 取り込みません。ほかは 入ります";
export const IMPORT_NOTES = Object.freeze([
  { text: "先に 見せてから 取り込みます。押すまで、何も 変わりません。",
    bold: "先に 見せてから 取り込みます。" },
  { text: "担当の 先生は 変えません。門下は うちで 決めます。", bold: "担当の 先生は 変えません。" },
  { text: "役職は 変えません。", bold: "役職は 変えません。" },
  { text: "健康の 記録は 1つも 動きません。入る 先が ありません。", bold: "" }
]);

// ---------------------------------------------------------------------------
// ★まだ の もの
// ---------------------------------------------------------------------------
//   ★★引き金 ── ★下の それぞれに 書いた 日。
//     ★★台帳 docs/ledgers/08-保留している決め.md 08-30

export const IMPORT_NOT_YET = Object.freeze([
  {
    key: "add",
    line: "新しく 入る 方を、名簿に 足す",
    why: "うちの 名簿は、お1人ずつ の 口（アカウント）に つながって います。"
      + "まだ 口の 無い 方を しまう ところが ありません",
    needs: "口の 無い 方の 下書き（お名前・番号・学年）を しまう 表、という お決め"
  },
  {
    key: "xlsx",
    line: "Excel（.xlsx）を 読む",
    why: "xlsx を ほどく 道具を 入れて いません",
    needs: "道具を 1つ 増やす、という お決め"
  },
  {
    key: "undo",
    line: "取り消す（1回だけ）",
    why: "前の 値を しまう ところが ありません",
    needs: "読み込みの 束（batch）と、前の 値 を しまう 表、という お決め"
  },
  {
    key: "remember",
    line: "つなぎ方を 覚える",
    why: "覚える ところが ありません",
    needs: "その 表、という お決め"
  }
]);
