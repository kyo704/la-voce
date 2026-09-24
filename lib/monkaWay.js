// ============================================================================
// ★★★門下を 誰が 決めるか ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定186（3通りから 学校が 選ぶ）／ sql/68
//     ★★★見本は **まだ ありません**（2026-09-24 に 確かめ）。
//       ★`SC['担当の先生を選ぶ']` も `SC['門下の決め方']` も ありません。
//       ★★だから 字は **裁定の 本文** から 取って います。
//       ★★★見本が 来たら、★字を 突き合わせ直して ください
//         （`tools/screen_b_compare.py` に 鍵を 足す ところから）。
//
//   ★★★どの 決め方でも、★先生は 学生の 体調の 記録を 見られません（★裁定138）。
//
//   ★★★学生が 選ぶ とき 見えるのは ── ★先生の 名前 と 担当して いる 人数 だけ。
//     ★★「空いて いる／埋まって いる」を 出しません。
//     ★★★多い順に 並べません。★「人気の 先生」を 作らない ため です。
//       ★並べるのは 台帳（`monka_teachers`）── ★名前の 順 です。
//
//   ★★★学生が 自分で 外す ことは できません（★外すのは 事務か 先生）。
//     ★レッスンが 進んで いる 途中で 外れると、★先生の 予定が 崩れます。
// ============================================================================

export const COLS_SETTINGS = "org_id, monka_way, monka_needs_ok, updated_at, updated_by";

/** ★3つの 決め方（★裁定186 §1 の 並びの まま）。 */
export const WAYS = Object.freeze([
  { key: "jimu", label: "事務が 決める", hint: "名簿から 組む。学生も先生も 触らない" },
  { key: "invite", label: "先生が 招く", hint: "先生が 招き、学生が 受ける" },
  { key: "student", label: "学生が 選ぶ", hint: "学生が 一覧から 担当の先生を 選ぶ" }
]);

/** ★既定は「先生が 招く」（★裁定186 §1）。 */
export const DEFAULT_WAY = "invite";
/** ★「学生が 選ぶ」の とき、★承認は **既定で 要ります**（★裁定186 §1・§2）。 */
export const DEFAULT_NEEDS_OK = true;

/** ★いまの 決め方（★行が 無ければ 既定）。 */
export function wayOf(row) {
  const w = row && row.monka_way;
  return WAYS.some((x) => x.key === w) ? w : DEFAULT_WAY;
}

/** ★承認が 要るか（★「学生が 選ぶ」の ときだけ 意味を 持ちます）。 */
export function needsOk(row) {
  if (wayOf(row) !== "student") return false;
  return row && row.monka_needs_ok === false ? false : DEFAULT_NEEDS_OK;
}

/** ★承認の 欄を 出すか。 */
export function showsNeedsOk(way) {
  return way === "student";
}

/** ★学生の 画面に「担当の 先生を 選ぶ」を 出すか（★裁定186 §5）。 */
export function studentCanChoose(row) {
  return wayOf(row) === "student";
}

/**
 * ★先生の 一覧。
 *
 *   ★★★並べ替えません。★台帳が 名前の 順で 返します。
 *     ★担当の 人数で 並べると、★少ない 先生に 集まるか、★多い 先生に 集まります。
 *     ★★どちらも「人気」を 作ります。
 *   ★★「空き」も「埋まり」も 作りません。★人数を そのまま 出す だけ です。
 */
export function teacherRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.teacher_id,
    name: r.name || "（名前なし）",
    students: Number(r.students) || 0
  }));
}

/**
 * ★台帳が 返した わけを、★読める 言葉に します。
 *
 *   ★★理由を 分けない ものは、★分けない まま 返します（★sql/68 の 決め）。
 */
export function requestReason(err) {
  const s = String((err && err.message) || err || "");
  if (s.includes("NOT_ALLOWED")) return "この 学校では、学生が 選ぶ 形に なって いません";
  if (s.includes("NOT_ENROLLED")) return "この 学校に 在籍して いません";
  if (s.includes("ALREADY_HAS_TEACHER")) return "すでに 担当の 先生が います";
  if (s.includes("ALREADY_REQUESTED")) return "すでに お願いを 出して います。お返事を 待って ください";
  // ★★★2026-09-24・裁定192 ── ★2つに 分かれました。
  //   ★`MINOR_NEEDS_GUARDIAN` …… ★15〜17歳。★保護者の ひとことが あれば 通ります。
  //   ★`MINOR_TEACHER_LINK_BLOCKED` … ★年齢が 未回答。★まず お答え いただきます。
  //   ★★同じ 字に しません ── ★次に する ことが ちがいます。
  if (s.includes("MINOR_NEEDS_GUARDIAN")) {
    return "保護者の 方の ひとことが 要ります。お送りする ところから お進み ください。";
  }
  if (s.includes("MINOR_TEACHER_LINK_BLOCKED")) {
    return "年齢を うかがって いません。「もっと」から お答え いただくと、お進みに なれます。";
  }
  return "お願いできませんでした";
}

/** ★お願いの 具合（★待って いる ／ 受けて もらえた ／ 断られた）。 */
export function requestState(rows) {
  const 並 = Array.isArray(rows) ? rows : [];
  const 待 = 並.find((r) => r && r.status === "waiting");
  if (待) return { state: "waiting", row: 待 };
  const 受 = 並.find((r) => r && r.status === "accepted");
  if (受) return { state: "accepted", row: 受 };
  return { state: "none", row: null };
}

/** ★字（★裁定186 の 本文から。★見本が 来たら 突き合わせ直します）。 */
export const WAY_HEAD = "門下の 決め方";
export const WAY_SUB = "この 学校で、担当の 先生を 誰が 決めるかです";
export const WAY_OK_HEAD = "先生の 承認";
export const WAY_OK_ON = "要る";
export const WAY_OK_OFF = "要らない";
export const WAY_OK_HINT = "承認は「拒む」ためでは なく「気づく」ための ものです。1タップで、理由は 聞きません。";
export const WAY_OK_OFF_HINT = "担当が すでに 決まって いる 学校だけ、要らない に して ください。";

// ---- 担当の 先生を 選ぶ（★見本の 字。★1字 も 足しません）----------------

export const PICK_HEAD = "担当の 先生を 選ぶ";
export const PICK_DONE_HEAD = "担当の 先生";
export const PICK_PICK = "えらぶ";
export const PICK_STUDENTS = "担当 ";
export const PICK_UNIT = "人";

/** ★選んだ あと、★確かめる 画面。 */
export const PICK_ASK_HEAD = "この 先生に しますか";
export const PICK_YES = "これで いい";
export const PICK_NO = "えらび直す";

/**
 * ★確かめる ときの 字。★承認が 要るか どうかで 変わります。
 *
 *   ★★要る …… ★お願いが 伝わります。★受けたら 門下に なります。
 *   ★★要らない …… ★その場で 門下に なります（★学校が そう して いる ため）。
 */
export function askLines(teacherName, needs) {
  const 名 = String(teacherName || "");
  return needs
    ? [名 + "先生に お願いします と 伝わります。",
       "先生が 受けたら、門下に なります。",
       "急かしません。待っているあいだも、ほかの ことは いつもどおり 使えます。"]
    : [名 + "先生の 門下に なります。",
       "学校が「担当は もう 決まっている」と している ためです。"];
}

/** ★待って いる あいだ。 */
export const PICK_WAITING = "お返事を 待っています";
export const PICK_WAITING_TAG = "待ち";
export const PICK_CANCEL = "取り消して 選び直す";
export const PICK_CANCELED = "取り消しました";
export const PICK_WAITING_NOTE = Object.freeze([
  "お返事が 来るまで、ふつうに 使えます。",
  "レッスンの 希望も、待っている あいだに 出せます。",
  "こちらからは 急かしません。"
]);

/** ★決まった あと。 */
export const PICK_MINE = "あなたの 担当です";
export const PICK_DONE_NOTE = Object.freeze([
  "変えたいときは、学校か 先生に 言ってください。",
  "ここからは 外せません（レッスンの 途中で 外れると、先生の 予定が 崩れます）。"
]);

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★3行目・4行目が 約束 です ──
 *     「ここに 出るのは お名前と 担当している 人数だけです。」
 *     「空いている・人気などは 出しません。」
 *   ★★1行目・2行目は **急かさない** ための 字 です。
 */
export const PICK_NOTE = Object.freeze([
  "担当の 先生は、もう 知らされているはずです。その先生を 選んでください。",
  "分からないときは、学校に 聞いてからで かまいません。急ぎません。",
  "ここに 出るのは お名前と 担当している 人数だけです。空いている・人気などは 出しません。"
]);
