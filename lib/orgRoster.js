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

/**
 * ★2026-09-19 ── ★休会（`paused`）を 足しました。
 *
 *   ★★台帳の 縛りも 同じ 日に 直しました
 *     （★`supabase/migration_enrollment_shape_and_pause.sql`）。
 *   ★★★お金に かかります。★休会の 方は 数える 人数に 入りません。
 *     ★★見本 `P_sonohito` の 字 ──「数える人数に入りません。日程は止まり、
 *       連絡は届きません」。
 *   ★★`COUNTED_STATUSES` は `active` の まま です。★だから 自動で そう なります。
 */
export const STATUSES = Object.freeze([
  { key: "active", label: "在籍中", counted: true,
    note: "数える 人数に 入ります。日程・出席・連絡が 届きます。" },
  { key: "paused", label: "休会", counted: false,
    note: "数える 人数に 入りません。日程は 止まり、連絡は 届きません。" },
  // ★★`left` は 終わった ようす です。★戻れる「休会」では ありません
  //   （★坂本さんの お決め・2026-09-13）。
  { key: "left", label: "退会", counted: false,
    note: "数える 人数に 入りません。記録は 残ります（消しません）。" }
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
  // ★★★2026-09-19 ── ★`paused`（休会）が 台帳に 入りました。
  //   ★★`invited`（招待中）は まだ ありません。★数えません。
  const out = { counted: 0, left: 0, paused: 0, notCounted: 0 };
  (members || []).forEach((m) => {
    if (!m) return;
    if (m.role && NOT_COUNTED_ROLES.includes(m.role)) { out.notCounted += 1; return; }
    const st = m.status || "active";
    if (st === "left") out.left += 1;
    else if (st === "paused") out.paused += 1;
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
 * ★段の 名前（★裁定155・確定-学校の値段 第3版・2026-09-21）。
 *
 *   ★★★下限が 1つ では なくなりました。★段ごとに ちがいます。
 *     ★無料 …… 先生1人＋生徒5人まで　　　　　0円
 *     ★教室 …… 先生2人・生徒30人まで　　　月 2,980円
 *     ★学校 …… それより 多い　　　　　　　下限 月 12,800円
 *
 *   ★★★9,800円は **無く なりました**。★12,800円に 戻った のでは ありません ──
 *     ★6〜30人は 教室（2,980円）に 分かれ、★31人からが 学校（12,800円）です。
 *     ★★9,800円の ころ、★20人の 教室は 9,800円 でした。★いまは 2,980円 です。
 *   ★★いつ どう 変わったかを 残します ──
 *     ★2026-09-09〜09-13　★下限 12,800円（1本）
 *     ★2026-09-13〜09-21　★下限　9,800円（1本・案A）
 *     ★2026-09-21〜　　　 ★教室 2,980円 ／ 学校 12,800円（2本）
 *
 *   ★★お気を つけ ください ── ★12,800円には **2つの 意味**が あります。
 *     ★① 学校の 月額の 下限　　　　　★← ★これ
 *     ★② 個人の「ぜんぶ（年）」　　　★← ★**別の もの。触って いません**
 */
export const PLAN_FREE = "無料";
export const PLAN_CLASSROOM = "教室";
export const PLAN_SCHOOL = "学校";

/** ★教室の 月額（★定額。★人数で 変わりません）。 */
export const CLASSROOM_MONTHLY = 2980;
/** ★教室の 年額（★月額×12 では ありません。★裁定155 §3 の 値）。 */
export const CLASSROOM_YEARLY = 29800;
/** ★教室で 入れる 生徒の 数（★これを 超えると 学校）。 */
export const CLASSROOM_UP_TO = 30;
/** ★教室で 入れる 先生の 数（★超えると 学校。★裁定155 §3）。 */
export const CLASSROOM_TEACHERS_UP_TO = 2;
/** ★無料で 入れる 先生の 数。 */
export const FREE_TEACHERS_UP_TO = 1;

/** ★学校の 月額の 下限。 */
export const SCHOOL_FLOOR = 12800;

/**
 * ★古い 名前。★呼ぶ 側が 残って いる あいだ だけ 置きます。
 *
 *   ★★1つの 下限では 足りなく なりました。★段で 分かれます。
 *   ★★この 名前を 新しく 使いません。★`SCHOOL_FLOOR` を 使って ください。
 */
export const MONTHLY_FLOOR = SCHOOL_FLOOR;

/**
 * ★ここまでは 0円（★2026-09-18・名前を 付けました）。
 *
 *   ★★数 そのものは 前から あります。★`monthlyFee` の 中に `n <= 5` と 書いて ありました。
 *   ★★★見本の 名簿に「5人まで　0円」の 行が あります。
 *     ★★画面に 出す ため に 5 を 書くと、★同じ 数が 2か所に なります。
 *     ★★式を 変えた 日に、★画面だけ 5 の まま 残ります。
 *   ★★だから 名前に して、★式も 画面も ここを 読みます。
 */
export const FREE_UP_TO = 5;

/**
 * ★初期費用。★名簿 **100人以上** の ときだけ。
 *
 *   ★★2026-09-21、★50人以上 → 100人以上 に 改めました
 *     （★裁定155 Q4 ／ 確定-学校の値段 第3版 §4）。
 */
export const SETUP_FEE = 100000;
export const SETUP_FEE_FROM = 100;

/** ★年の 一括前払いで 引く 月数。 */
export const YEARLY_FREE_MONTHS = 2;

/**
 * ★値の 見せ方（★税別 か 税込 か）。
 *
 *   ★★2026-09-18、★見本に ある のに **1文字も** ありません でした。
 *     ★★見本の 料金の 決まりは 5行 で、★その 5行目 が これ です ──
 *       `['表示','税別']`
 *   ★★★お金の 表示 です。★書かなければ なりません。
 *     ★★9,800円が 税込に 見えると、★ご請求と 食い違います。
 *     ★★見て いる 方は「これを 払えば よい」と 読みます。
 *   ★★数では ありません。★けれど 数の **読み方**です。★同じ ところに 置きます。
 */
// ★2026-09-21、★税別 → 税込 に 改めました（★裁定155 §3・第3版 §6）。
export const PRICE_TAX_LABEL = "税込";
export const PRICE_TAX_ROW_LABEL = "表示";

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
  if (!Number.isFinite(n) || n <= FREE_UP_TO) return 0;
  // ★★★6〜30人は 教室（★定額・2026-09-21・裁定155 §3）。
  //   ★★人数で 変わりません。★段の 式を 当てません。
  //   ★★★20人の 教室は、★9,800円の ころ 9,800円 でした。★いまは 2,980円 です。
  //     ★下限が 下がった のでは ありません。★別の 段に 分かれました。
  if (n <= CLASSROOM_UP_TO) return CLASSROOM_MONTHLY;
  const candidates = billPlans(n).map((p) => p.yen);
  return Math.max(Math.min(...candidates), SCHOOL_FLOOR);
}

/**
 * ★どの 段か（★無料 ／ 教室 ／ 学校）。
 *
 *   ★★決めるのは 生徒の 数 だけ です。★見本も そう して います
 *     （★裁定155 §4「見本では 先生の 人数を 見ていない」）。
 *   ★★★先生の 数でも 分かれます（★先生3人以上は 学校・第3版 §1）。
 *     ★★`teachers` を 渡された ときだけ 見ます。★渡されなければ 生徒だけ。
 *     ★★★NOT_YET …… ★画面は まだ 先生の 数を 渡して いません。
 *       ★★外す 条件 …… ★プランの 画面（裁定155 §6）を 作る 日。
 */
export function planOf(count, teachers) {
  const n = Number(count);
  const t = Number(teachers);
  if (Number.isFinite(t) && t > CLASSROOM_TEACHERS_UP_TO) return PLAN_SCHOOL;
  if (!Number.isFinite(n) || n <= FREE_UP_TO) {
    return (Number.isFinite(t) && t > FREE_TEACHERS_UP_TO) ? PLAN_CLASSROOM : PLAN_FREE;
  }
  return n <= CLASSROOM_UP_TO ? PLAN_CLASSROOM : PLAN_SCHOOL;
}

/**
 * ★計算の 内訳 ── ★どの段で いくらに なるか（★2026-09-18・裁定 ⑥）。
 *
 *   ★出どころ 見本 00-動く見本-PC・iPad（運営）.html の `billPlans` / `billWl`
 *
 *   ★★★なぜ 出すのか ── ★Opus の 裁定（2026-09-18）。
 *     ★★「稟議の 数字です。★無いと 通りません」
 *     ★★9月10日の 見立て「月75,000円の 稟議を 通す 数字が まだ 無い」。
 *
 *   ★★★`monthlyFee` が **この 関数を 使います**。★別に 数えません。
 *     ★★内訳と 答えが ずれる、という ことが 起こり得なく なります。
 *     ★★きょうまで `monthlyFee` の 中に 同じ 式が ありました。
 *       ★★画面に 内訳を 書くと、★そこに 3つめの 写しが できます。
 *
 *   ★★段の 名は `Math.max(n, t.min)` で 作ります（★見本と 同じ）。
 *     ★★100人の 段は、★20人の 教室でも 「20人 × 350円」では ありません。
 *       ★★見本は 素直に n を 使って います（★`n+'人 × 350円'`）。
 *       ★★けれど `monthlyFee` は `Math.max(n, t.min)` で 数えて います。
 *       ★★★字と 数が 食い違うと、★読んだ 方が 計算を 追えません。
 *         ★★だから 字の ほうを、★数に 合わせます。
 *         ★★300人の 段は 見本でも「300人 × 250円」と 書いて あります。
 *           ★★同じ 決めを、★3つの 段 すべてに 通します。
 */
/**
 * ★★★ご請求の 内訳 ── ★**その 段の もの だけ** を 出します（★2026-09-23・裁定）。
 *
 *   ★出どころ  Opus（2026-09-23）── ★`bill-breakdown` の 見張りが 見つけた ずれ。
 *     「★教室の 人に 学校の 料金表を 見せて いる」
 *
 *   ★★何が 起きて いたか（★6人の 教室で 測りました）──
 *       内訳 …… 400:2,400 ／ 350:35,000 ／ 250:75,000
 *       答え …… 2,980（★教室の 定額）
 *     ★★内訳の いちばん 安い 2,400 と、★答えの 2,980 が 合いません。
 *     ★★★定額の 段に 1人あたりの 式を 当てると、★**必ず** 食い違います。
 *
 *   ★★だから 段で 分けます ──
 *       無料  … 内訳を 出しません（★0円 です）
 *       教室  … ★金額だけ（「教室・30人まで 月2,980円」）。★式を 出しません
 *       学校  … ★式を 出します（「216人 × 350円 ＝ 75,600円」）
 *               ★下限が 効いた ときだけ、★下限の 行を 足します
 *
 *   ★★★`monthlyFee` と 同じ 数を 返します。★別に 数えません。
 *     ★`total` は `monthlyFee(count)` そのもの です。
 *
 * @returns {{plan:string, total:number, flat:boolean, lines:Array, floorUsed:boolean}}
 */
export function billBreakdown(count) {
  const n = Number(count);
  const total = monthlyFee(n);
  const plan = planOf(n);
  if (!(total > 0)) {
    return { plan, total: 0, flat: true, lines: [], floorUsed: false };
  }
  if (plan === PLAN_CLASSROOM) {
    // ★★定額 です。★1人あたりで 割りません（★割ると 必ず ずれます）。
    return {
      plan, total, flat: true, floorUsed: false,
      lines: [{ label: CLASSROOM_LINE, yen: total, chosen: true }]
    };
  }
  const 段 = billPlans(n);
  const 勝 = 段.find((p) => p.yen === total) || null;
  const floorUsed = !勝;
  const lines = 段.map((p) => ({
    label: `${p.heads}人 × ${p.rate}円`, yen: p.yen, chosen: !floorUsed && p.yen === total
  }));
  if (floorUsed) {
    // ★★下限が 効いた ときだけ 出します。★効いて いない ときに 出すと、
    //   ★「下限が 当たった」と 読めて しまいます。
    lines.push({ label: FLOOR_LINE, yen: SCHOOL_FLOOR, chosen: true });
  }
  return { plan, total, flat: false, lines, floorUsed };
}

/** ★教室の 段の 1行（★式では ありません。★金額 だけ）。 */
export const CLASSROOM_LINE = `教室・${CLASSROOM_UP_TO}人まで`;
/** ★下限の 1行。 */
export const FLOOR_LINE = "下限";

export function billPlans(count) {
  const n = Number(count);
  const m = Number.isFinite(n) ? n : 0;
  return TIERS.map((t) => {
    const heads = Math.max(m, t.min);
    return { heads, rate: t.rate, yen: heads * t.rate };
  });
}

/** ★初期費用。★名簿50人以上の ときだけ。 */
export function setupFee(count) {
  const n = Number(count);
  return Number.isFinite(n) && n >= SETUP_FEE_FROM ? SETUP_FEE : 0;
}

/** ★年の 一括前払い（★2か月分を 引く）。 */
export function yearlyFee(count) {
  // ★★教室の 年額は 月額×10 では ありません（★裁定155 §3 の 値）。
  if (planOf(count) === PLAN_CLASSROOM) return CLASSROOM_YEARLY;
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

// ----------------------------------------------------------------------------
// ★名簿の 画面の 字（★見本 `P_meibo` ／ ★裁定 その84 NEW_ORDER 2・2026-09-18）
// ----------------------------------------------------------------------------
//   ★★★画面に 書き写しません。★ここ 1か所 です。
//     ★★同じ 字が 2か所に あると、★片方だけ 直る 日が 来ます。

/**
 * ★人数の 1行（★見本の `.sub`）。
 *
 *   ★★見本 ── `N人　／　在籍 M人（＝ご請求の 人数）　／　休会・退会・招待中は 数えません`
 *   ★★★「＝ご請求の 人数」を 落としません。★ここが お金の 話だ と 分かる 唯一の 印 です。
 */
export function rosterSubLine(total, counted) {
  const a = Number(total) || 0;
  const b = Number(counted) || 0;
  return `${a}人　／　在籍 ${b}人（＝ご請求の 人数）　／　休会・退会・招待中は 数えません`;
}

/**
 * ★「数えないもの」の 箱（★見本の 2枚目の card）。
 *
 *   ★★★2026-09-18 まで、★この 箱が ありません でした。
 *     ★★「先生・事務は 数えません」は 上の 1行に 書いて ありました。
 *     ★★けれど「休会」「招待中」「5人まで 0円」は、★どこにも 出て いません。
 *   ★★★お金の 話 です。★出さないと、★数が 合わない ように 見えます。
 *
 *   ★★「5人まで」の 数は `FREE_UP_TO` から 引きます。★書き写しません。
 */
export const NOT_COUNTED_HEAD = "数えないもの";

export function notCountedRows() {
  return [
    { name: "休会", value: "数えません" },
    { name: "招待中", value: "数えません" },
    { name: "先生・事務", value: "数えません" },
    { name: `${FREE_UP_TO}人まで`, value: "0円" }
  ];
}

/**
 * ★下の 但し書き（★見本の `.note`）。
 *
 *   ★★1行目は 太字 です。★健康の 断り です。★減らしません。
 *   ★★3行目の「税別」は `PRICE_TAX_LABEL` から 引きます。
 */
export const ROSTER_NOTE_BOLD =
  "生徒の 健康に関するものは、この画面に 1つも ありません。";

export function rosterNotes() {
  return [
    ROSTER_NOTE_BOLD,
    "合計は 右に 貼りつけます（スクロールしても 見えます）。",
    `金額は こちらで 計算します。表示は ${PRICE_TAX_LABEL}です。`
  ];
}

// ============================================================================
// ★★★狭い ときの 名簿（★2026-09-26・D群・見本 `SC['名簿']`）
//
//   ★★★裁定200 §0z ── ★PC用と スマホ用を **別に 作りません**。
//     ★★1つの 画面が 幅で 姿を 変えます。★だから ここに 足します ──
//       ★`components/OpsRoster.jsx` の 中で 使います。★新しい 画面を 作りません。
//     ★★★Opus が 同じ 日に 書いた 反省 ──「画面と 一覧を 別々に 作らない」。
//
//   ★★狭い ときは 表に しません。★札を 縦に 並べます。
//     ★★表の 列は 6つ あります。★360px に 入りません。
//     ★★入らない ものを 横に 流すと、★右の 端が 見つかりません。
//
//   ★★★下の 2行は **約束** です。★消さないこと ──
//     ★「名簿に あるのは 学務の ことだけ です。」
//     ★「体調の 記録は、ここから たどりつけません（画面そのものが ありません）。」
//     ★★広い ときの 但し書き（`rosterNotes`）とは **別の 字** です。
//       ★★同じ ことを 言って いますが、★見本が 別の 字で 書いて います。
//       ★★★だから 寄せません ── ★見本の 字を 1文字も 変えません。
// ============================================================================

/** ★狭い ときの 1行（★見本 ── `5人／216人　広い 画面では まとめて 見られます`）。 */
export function narrowCountLine(shown, total) {
  return `${Number(shown) || 0}人／${Number(total) || 0}人　広い 画面では まとめて 見られます`;
}

/** ★狭い ときの 2つの 札（★見本の `.two`）。 */
export const NARROW_BTN_INVITE = "招く";
export const NARROW_BTN_EXPORT = "書き出す";

/** ★狭い ときの 但し書き（★約束）。 */
export const NARROW_NOTES = Object.freeze([
  "名簿に あるのは 学務の ことだけ です。",
  "体調の 記録は、ここから たどりつけません（画面そのものが ありません）。"
]);

/** ★太字に する ところ（★見本の `<b>`）。 */
export const NARROW_NOTES_STRONG = Object.freeze([0, 1]);

/**
 * ★狭い ときに 1行に 添える 字（★見本 ── `3年 声楽　高橋 のぞみ 先生`）。
 *
 *   ★★無い ものは 詰めます。★「—」で 埋めません。
 *   ★★先生の 名には「先生」を 付けます（★見本の とおり）。
 */
export function narrowSubOf(row) {
  const r = row || {};
  const 並 = [r.gradeLabel || r.grade_label || "", r.courseName || "",
    r.teacherName ? `${r.teacherName} 先生` : ""];
  return 並.filter((x) => String(x).trim()).join("　");
}
