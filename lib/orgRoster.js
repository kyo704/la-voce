// ============================================================================
// 名簿と、そのご請求（2026-09-09・第3便・見本③⑦）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §10
//     「★名簿1人あたり 月 ¥400　★月額の下限 ¥12,800
//      ★名簿100人以上 1人 ¥350　★名簿300人以上 1人 ¥250
//      ★初期費用 ★名簿50人以上のときだけ ¥100,000
//      ★年の一括前払い ★2か月分を引く」
//
//   ★★「名簿の人数」＝ その教室に 在籍している 生徒・学生の数。
//     ★★休会中は 数えません。
//     ★★先生・事務は 何人いても 数えません。
//     ★掛け持ちの先生・複数教室の生徒は 教室ごとに1
//       （★「掛け持ちだから半額」を 作らない）。
//
//   ★★「2つの計算のうち、★安いほうを 当てます」（★§10）。
//     ★★これは、★段の 境目で 損をさせない ための 決めです。
//     ★95人が 38,000円で、★100人が 35,000円 だとしたら、
//       ★★人数が 少ないほうが 高くなります。★それを 起こさせません。
//     ★だから、★どの段の 式でも 数えて、★いちばん 安いものを 当てます。
//
//   ★★用語（★§10-1）。★「席」とは 呼びません。★「名簿の人数」です。
//     ★教室が 買っているのは「生徒のアクセス」では なく「事務」だからです。
//     ★生徒本人の 記録と 利用は、★名簿に 載っていても いなくても 無料です。
//
//   ★見張り components/tests/org-roster.test.js
// ============================================================================

/** ★数えない 役割。★何人 いても 数えません（★§10）。 */
export const NOT_COUNTED_ROLES = Object.freeze(["teacher", "staff", "owner", "admin"]);

/** ★数える ようす。★休会中は 数えません。 */
export const COUNTED_STATUSES = Object.freeze(["enrolled"]);

/** ★名簿の ようす（★見本③の「ようす」の 欄）。 */
export const STATUSES = Object.freeze([
  { key: "enrolled", label: "在籍中", counted: true },
  { key: "paused", label: "休会中", counted: false },
  { key: "invited", label: "招待中", counted: false, note: "返事まち" }
]);

export function statusLabel(key) {
  const s = STATUSES.find((x) => x.key === key);
  return s ? s.label : "在籍中";
}

/** ★数える 1人か。 */
export function isCounted(member) {
  if (!member) return false;
  if (NOT_COUNTED_ROLES.includes(member.role)) return false;
  return COUNTED_STATUSES.includes(member.status || "enrolled");
}

/**
 * ★名簿の 人数（★ご請求の 人数）。
 *
 *   ★★先生・事務は 数えません。★休会中も 数えません。
 */
export function rosterCount(members) {
  return (members || []).filter(isCounted).length;
}

/** ★ようす ごとの 数（★見本③の 下の 帯）。 */
export function countsByStatus(members) {
  const out = { counted: 0, paused: 0, invited: 0, notCounted: 0 };
  (members || []).forEach((m) => {
    if (!m) return;
    if (NOT_COUNTED_ROLES.includes(m.role)) { out.notCounted += 1; return; }
    const st = m.status || "enrolled";
    if (st === "paused") out.paused += 1;
    else if (st === "invited") out.invited += 1;
    else out.counted += 1;
  });
  return out;
}

// ---------------------------------------------------------------------------
// しぼり込み（★見本 G07 ／ G02 の 上の 札）
//
//   ★出どころ docs/design/pack-final/screens/G07-しぼり込み.html
//            docs/design/pack-final/screens/G02-名簿.html
//
//   ★★2つ あります。
//     ① ようす の 札 ── すべて／数えます／休会／返事まち（★上に 並ぶ）
//     ② 担当の先生で しぼる ── 下から 上がる 1枚（★G07）
//
//   ★★どちらも「絞る」だけです。★消しません。★数も 変えません。
//     ★下の 帯の ご請求の 人数は、★しぼっても 動きません。
//     ★★動かすと、★絞った ぶんだけ 安く 見えます。
// ---------------------------------------------------------------------------

/** ★ようす の 札。★すべてが いちばん 先（★見本のとおり）。 */
export const ROSTER_CHIPS = Object.freeze([
  { key: "all", label: "すべて" },
  { key: "enrolled", label: "数えます" },
  { key: "paused", label: "休会" },
  { key: "invited", label: "返事まち" }
]);

/**
 * ★札ごとの 数。
 *
 *   ★★「すべて」は、★先生・事務を 抜いた 数です。
 *     ★見本の「すべて 54」＝ 52＋1＋1 です。
 *     ★★先生6・事務2 を 足した 62 では ありません。
 *       ★この 画面は 生徒の 名簿だからです。
 */
export function chipCounts(members) {
  const by = countsByStatus(members);
  return {
    all: by.counted + by.paused + by.invited,
    enrolled: by.counted,
    paused: by.paused,
    invited: by.invited
  };
}

/** ★その札で 残る 1人か。 */
export function matchesChip(member, chipKey) {
  if (!member) return false;
  if (NOT_COUNTED_ROLES.includes(member.role)) return false;
  if (!chipKey || chipKey === "all") return true;
  return (member.status || "enrolled") === chipKey;
}

/** ★「すべて」を いちばん 先に した、★先生の 一覧（★G07 の 1枚）。 */
export const TEACHER_FILTER_ALL = "all";

/**
 * ★担当の先生ごとの 人数。
 *
 *   ★★1人の 生徒が 2人の 先生に つくことが あります（★見本「三浦・小林」）。
 *     ★その 生徒は、★どちらの 先生の 数にも 入ります。
 *     ★★足すと 名簿の 人数を 超えます。★それで 正しいです。
 *       ★「先生ごとに 何人 見ているか」を 数えているからです。
 *   ★★先生・事務は、★数えられる 側には 立ちません。
 *
 * @param {object[]} members
 * @param {(id:string)=>string} nameOf  ★先生の 名前
 * @returns [{ id, label, count }]  ★すべてが 先頭
 */
export function teacherFilterOptions(members, nameOf) {
  const count = new Map();
  (members || []).forEach((m) => {
    if (!m || NOT_COUNTED_ROLES.includes(m.role)) return;
    (m.teacher_ids || []).forEach((id) => {
      if (!id) return;
      count.set(id, (count.get(id) || 0) + 1);
    });
  });
  const rest = [...count.entries()]
    .map(([id, n]) => ({ id, label: nameOf ? (nameOf(id) || "") : "", count: n }))
    .filter((o) => o.label !== "")
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label, "ja"));
  return [{ id: TEACHER_FILTER_ALL, label: "すべて", count: null }, ...rest];
}

/** ★その先生の しぼりで 残る 1人か。 */
export function matchesTeacher(member, teacherId) {
  if (!member) return false;
  if (!teacherId || teacherId === TEACHER_FILTER_ALL) return true;
  return (member.teacher_ids || []).includes(teacherId);
}

/**
 * ★学年で しぼる（★2026-09-11・新しい 動く見本の shiboru）。
 *
 *   ★★学年は、★学校が 決める ものです（★見本の「学校の 形」）。
 *     ★1年〜4年 と 決め打ちに しません。★修士・博士・研究生・専攻科が あります。
 *     ★★名簿に 実際に 入っている 値から 作ります。
 *   ★★1つも 入っていなければ、★空を 返します。
 *     ★呼ぶ 側は、★空なら 札を 出しません。★押せない 札を 置かない ためです。
 */
export const GRADE_FILTER_ALL = "all";

export function gradeFilterOptions(members) {
  const count = new Map();
  (members || []).forEach((m) => {
    if (!m || NOT_COUNTED_ROLES.includes(m.role)) return;
    const g = typeof m.grade_label === "string" ? m.grade_label.trim() : "";
    if (!g) return;
    count.set(g, (count.get(g) || 0) + 1);
  });
  if (count.size === 0) return [];
  const rest = [...count.entries()]
    .map(([label, n]) => ({ id: label, label, count: n }))
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
  return [{ id: GRADE_FILTER_ALL, label: "すべて", count: null }, ...rest];
}

/** ★その学年の しぼりで 残る 1人か。 */
export function matchesGrade(member, grade) {
  if (!member) return false;
  if (!grade || grade === GRADE_FILTER_ALL) return true;
  return (typeof member.grade_label === "string" ? member.grade_label.trim() : "") === grade;
}

// ---------------------------------------------------------------------------
// ★お金（★§10）
//
//   ★★ここは「いくらに なるか」を 数えるだけです。
//     ★★お支払いを 受け取る 仕組みは、★まだ ありません。
//     ★数えたものを、★お見積りに 使います。
// ---------------------------------------------------------------------------

/** ★段。★min は「その段が 当たりはじめる 人数」です。 */
export const TIERS = Object.freeze([
  { min: 1, rate: 400 },
  { min: 100, rate: 350 },
  { min: 300, rate: 250 }
]);

/** ★月額の 下限。 */
export const MONTHLY_FLOOR = 12800;

/** ★初期費用。★名簿50人以上の ときだけ。 */
export const SETUP_FEE = 100000;
export const SETUP_FEE_FROM = 50;

/** ★年の 一括前払いで 引く 月数。 */
export const YEARLY_FREE_MONTHS = 2;

/**
 * ★月々の ご請求（円）。
 *
 *   ★★どの段の 式でも 数えて、★いちばん 安いものを 当てます（★§10）。
 *     ★段の 境目で、★人数が 少ないほうが 高くなる、を 起こさせません。
 *   ★★そのうえで、★下限を 当てます。
 *   ★5人以下なら 0円。★下限を 当てません。★小規模な 教室に 請求しません。
 */
export function monthlyFee(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 5) return 0;
  const candidates = TIERS.map((t) => Math.max(n, t.min) * t.rate);
  return Math.max(Math.min(...candidates), MONTHLY_FLOOR);
}

/** ★初期費用。★名簿50人以上の ときだけ。 */
export function setupFee(count) {
  const n = Number(count);
  return Number.isFinite(n) && n >= SETUP_FEE_FROM ? SETUP_FEE : 0;
}

/** ★年の 一括前払い（★2か月分を 引く）。 */
export function yearlyFee(count) {
  return monthlyFee(count) * (12 - YEARLY_FREE_MONTHS);
}

/** ★1人あたり（★見本⑤の「1人あたり」）。★割り切れないときは 丸めます。 */
export function perHead(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(monthlyFee(n) / n);
}

/** ★円を 読みやすく。★「20,800」。 */
export function yen(n) {
  return Number(n || 0).toLocaleString("ja-JP");
}
