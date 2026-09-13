// ============================================================================
// 名簿と、そのご請求（2026-09-09・第3便・見本③⑦）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §10
//     「★名簿1人あたり 月 ¥400　★月額の下限 ¥12,800 ★← 2026-09-13 に ¥9,800 へ
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

/**
 * ★数えない 役割。★何人 いても 数えません（★§10）。
 *
 *   ★★2026-09-13 以降、★名簿は enrollments（生徒）を 読みます。
 *     ★enrollments の 行に role は ありません。★この 一覧は 当たりません。
 *   ★★残して あるのは、★memberships を 渡して いる 古い 呼び手の ため です。
 */
export const NOT_COUNTED_ROLES = Object.freeze(["teacher", "staff", "owner", "admin"]);

/**
 * ★名簿の ようす。
 *
 *   ★★台帳が 許すのは 2つ だけ です（★enrollments_status_check）──
 *     ★active ／ left
 *   ★★2026-09-13 まで、★ここには enrolled／paused／invited と 書いて ありました。
 *     ★★その 3つは **台帳に 1つも ありません**。★見本の 言葉でした。
 *     ★★だから 名簿は どの 学校でも 空で、★ご請求の 人数も 0 でした。
 *   ★★見本には 休会・招待中も ありますが、★しまう ところが ありません。
 *     ★★無い ものを 在る ように 見せません。★出しません。
 *     ★★入れる ことに なったら、★先に 台帳の 側を 作ります。
 */
export const COUNTED_STATUSES = Object.freeze(["active"]);

export const STATUSES = Object.freeze([
  { key: "active", label: "在籍中", counted: true },
  // ★★`left` は 終わった ようす です。★戻れる「休会」では ありません
  //   （★坂本さんの お決め・2026-09-13）。
  { key: "left", label: "退会", counted: false }
]);

export function statusLabel(key) {
  const s = STATUSES.find((x) => x.key === key);
  return s ? s.label : "在籍中";
}

/**
 * ★数える 1人か。
 *
 *   ★★行が 無ければ 数えません。
 *   ★★ようすが 空の ときは active と 見ます（★台帳の 既定と 同じ）。
 *   ★★role が 付いて いる 行（★memberships）は、★これまでどおり 数えません。
 */
export function isCounted(member) {
  if (!member) return false;
  if (member.role && NOT_COUNTED_ROLES.includes(member.role)) return false;
  return COUNTED_STATUSES.includes(member.status || "active");
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
  // ★★台帳の ようすは active／left の 2つ だけ です（★2026-09-13）。
  //   ★★paused／invited は 台帳に ありません。★数えません。
  const out = { counted: 0, left: 0, notCounted: 0 };
  (members || []).forEach((m) => {
    if (!m) return;
    if (m.role && NOT_COUNTED_ROLES.includes(m.role)) { out.notCounted += 1; return; }
    const st = m.status || "active";
    if (st === "left") out.left += 1;
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

/**
 * ★ようす の 札。★すべてが いちばん 先（★見本のとおり）。
 *
 *   ★★休会・返事まちは 外しました（★2026-09-13）。
 *     ★★台帳に その ようすが ありません。★押しても 0人に なるだけ です。
 */
export const ROSTER_CHIPS = Object.freeze([
  { key: "all", label: "すべて" },
  { key: "active", label: "数えます" },
  { key: "left", label: "退会" }
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
    all: by.counted + by.left,
    active: by.counted,
    left: by.left
  };
}

/**
 * ★名簿の 行を 組み立てる（★2026-09-13・裁定 その21）。
 *
 *   ★★生徒は enrollments に 居ます。★memberships では ありません。
 *     ★★memberships は「学校で 働く 方」です。★4つの 役割は 仕事の 束です。
 *     ★★生徒は その どれでも ないので、★別の 表に 居ます。
 *
 *   ★★画面（OpsRoster）が 使う 名前に 合わせます ──
 *     student_id  → user_id
 *     enrolled_at → joined_on
 *     status      → そのまま（★active／left）
 *     grade_label → そのまま（★enrollments に 足しました）
 *     teacher_ids → assignments から 組み立て
 *     post_id     → ★付けません。生徒は 役職を 持ちません
 *
 *   ★★役職を 付けない ので、★名簿の 画面に 役職の 行は 出ません。
 *     ★★`posts` を 渡さなければ 出ない 作りに なって います。
 *
 *   @param enrollments ★その学校の enrollments の 行
 *   @param assignments ★その学校の assignments の 行（★ended_at が 空の もの）
 */
export function toRosterRows(enrollments, assignments) {
  const byStudent = {};
  (assignments || []).forEach((a) => {
    if (!a || !a.student_id || !a.teacher_id) return;
    if (a.ended_at) return;
    (byStudent[a.student_id] = byStudent[a.student_id] || []).push(a.teacher_id);
  });
  return (enrollments || []).map((e) => ({
    id: e.id,
    user_id: e.student_id,
    status: e.status || "active",
    grade_label: e.grade_label != null ? e.grade_label : null,
    joined_on: e.enrolled_at || null,
    left_on: e.left_at || null,
    teacher_ids: byStudent[e.student_id] || []
    // ★post_id は 入れません。★生徒は 役職を 持ちません。
  }));
}

/** ★その札で 残る 1人か。 */
export function matchesChip(member, chipKey) {
  if (!member) return false;
  // ★★2026-09-13、★ここで 役割を 見て いました。
  //   ★★台帳が 許す 役割は owner／admin／teacher／staff の 4つ だけ で、
  //     ★★その 4つ とも ここで 落ちて いました。
  //   ★★だから 名簿は **どの 学校でも 1行も 出ません**でした。
  //   ★★生徒は enrollments に 居ます（★裁定 その21）。★役割を 持ちません。
  if (member.role && NOT_COUNTED_ROLES.includes(member.role)) return false;
  if (!chipKey || chipKey === "all") return true;
  return (member.status || "active") === chipKey;
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

/**
 * ★月額の 下限。
 *
 *   ★★2026年9月13日、★12,800円 → **9,800円** に 改めました（★案A）。
 *     ★出どころ Opus の 裁定 その20（★坂本さん ご確認・2026-09-13）。
 *   ★★12,800円は 消しません。★いつ どう 変わったかを 残します ──
 *     ★2026年9月9日〜9月13日　★12,800円（★案B）
 *     ★2026年9月13日〜　　　 ★ 9,800円（★案A）
 *
 *   ★★変えたのは この 1つ だけ です。
 *     ★★段の 式（400円／350円／250円）は 1文字も 触って いません。
 *     ★★5人以下は 0円、という 決めも そのままです。
 *
 *   ★★お気を つけ ください ── ★12,800円には **2つの 意味**が あります。
 *     ★① 学校の 月額の 下限　　　　　★← ★これ。★9,800円に なりました
 *     ★② 個人の「一年の よそおい」（年額）★← ★**別の もの。触って いません**
 */
export const MONTHLY_FLOOR = 9800;

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
