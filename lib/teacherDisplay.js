// ============================================================================
// 先生の名前を、画面にどう出すか
//
//   ★退会した先生の行は、lessons.teacher_id が null になります
//     （lib/accountDeletion.js。過ぎた事実の記録は残し、名前だけ外す）。
//
//   ★null のときに何も出さない、をしてはいけません。
//     「誰とのレッスンか」の欄が、ある日から急に空白になります。
//     生徒には、消えたのか壊れたのかが分かりません。
//     ★「退会した先生」と、はっきり書きます。
//
//   ★これが唯一の正です。呼ぶ側で `teacher_id && …` と書かないでください。
//     その書き方だと、null のときに何も出ません。
// ============================================================================

/** 退会した先生の行に出す名前。★空文字にしないこと。 */
export const DEPARTED_TEACHER_LABEL = "退会した先生";

/** 名前が分からない（まだ読めていない）ときの呼び名。 */
export const UNKNOWN_TEACHER_LABEL = "先生";

/**
 * レッスンの行に出す、先生の呼び名。
 *
 * @param {string|null} teacherId  null なら退会した先生
 * @param {(id:string)=>string} resolve  IDから名前を引く関数
 * @returns {string} ★必ず何かを返します。空文字は返しません。
 */
export function teacherDisplayName(teacherId, resolve) {
  if (!teacherId) return DEPARTED_TEACHER_LABEL;
  if (typeof resolve !== "function") return UNKNOWN_TEACHER_LABEL;
  const name = resolve(teacherId);
  return name && String(name).trim() ? name : UNKNOWN_TEACHER_LABEL;
}

/**
 * 「◯◯先生」の形。退会した先生には「先生」を重ねません。
 * ★「退会した先生先生」にならないようにするため。
 */
export function teacherWithHonorific(teacherId, resolve) {
  if (!teacherId) return DEPARTED_TEACHER_LABEL;
  const name = teacherDisplayName(teacherId, resolve);
  // ★「先生」を二重に付けないこと。名前がまだ読めていないときの
  //   呼び名は「先生」そのものなので、そこへ足すと「先生先生」になります。
  if (name === UNKNOWN_TEACHER_LABEL) return UNKNOWN_TEACHER_LABEL;
  return `${name}先生`;
}

/**
 * teacher_id ごとにまとめるとき、null をどう扱うか。
 *
 * ★null を捨てないこと。捨てると、退会した先生とのレッスンが
 *   集計から消え、合計が合わなくなります。
 * ★1人にまとめること。退会した先生が複数いても、区別できません
 *   （名前が消えているので、区別する手立てがそもそもありません）。
 */
export const DEPARTED_TEACHER_KEY = "__departed__";

export function teacherGroupKey(teacherId) {
  return teacherId || DEPARTED_TEACHER_KEY;
}

export function isDepartedKey(key) {
  return key === DEPARTED_TEACHER_KEY;
}

/**
 * teacher_id で件数をまとめる。★null も1つの群として数えます。
 * @returns {Array<{key:string, teacherId:string|null, count:number, departed:boolean}>}
 */
export function groupByTeacher(rows, getTeacherId) {
  const by = new Map();
  (rows || []).forEach((r) => {
    const id = getTeacherId ? getTeacherId(r) : (r && r.teacher_id);
    const key = teacherGroupKey(id);
    const cur = by.get(key) || { key, teacherId: id || null, count: 0, departed: !id };
    cur.count += 1;
    by.set(key, cur);
  });
  return [...by.values()];
}
