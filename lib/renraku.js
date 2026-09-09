// ============================================================================
// 連絡 ── 門下の連絡板（2026-09-10・見本6画面）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
//            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1
//
//   ★★名前は「連絡」です。★「掲示板」とは 呼びません（★§6-1）。
//     ★伝えることが ある人が 使う 場所です。
//
//   ★★§6-1 の いちばん大きな 危険 ── 体調が、ここから 漏れます
//     ★学生が 自分で「喉の調子が 悪いので 休みます」と 書きます。
//     ★誰も 約束を 破っていません。★ですが 体調が 20人に 伝わります。
//     ★★次の学生は「休むときは 理由を 書くものだ」と 学びます。
//     ★★「記録は 見られない」が、★習慣として 静かに 嘘に なります。
//
//   ★★対処は 3つ。★3つとも 要ります（★§6-1）。
//     ① ★書く欄の 下に、★いつも 1行（★NOTICE_LINE）
//     ② ★休むことを、★ここに 書かせない（★見本⑥の 別の道へ）
//     ③ ★中身を、★サーバーが 検査しない
//        ★★「体調の語を 見つけて 警告する」を 作らないこと。
//        ★★作ると、★サーバーが 全員の 書いたものを 読むことに なります。
//
//   ★★①の 1行が、★実際の 守りです（★§6-1）。
//     ★安く、★正直で、★これ以上のものは ありません。
//
//   ★見張り components/tests/renraku.test.js
//           components/tests/thread-guards.test.js
// ============================================================================

/** ★90日で 消えます（★見本①③）。★消えたものは 戻せません。 */
export const KEEP_DAYS = 90;

/** ★「まもなく 消えます」を 出しはじめる 日数。 */
export const SOON_DAYS = 7;

/**
 * ★書く欄の 下に、★いつも 出す 1行（★見本②⑤）。
 *
 *   ★★1文字も 変えないこと。★これが 実際の 守りです（★§6-1）。
 */
export const NOTICE_LINE =
  "ここに書いたことは、門下の全員と先生、学校の運営の方が読みます。\n" +
  "体調のことは、書かなくて構いません。";

/** ★添付は できません（★見本②）。 */
export const NO_ATTACH_LINE =
  "添付は できません。書類は「くばりもの」から お配りください。";

/** ★運営の方に 出す 断り（★見本③）。 */
export const OPS_READ_ONLY_LINE =
  "運営の方は、読むだけです。書き込めません。";
export const OPS_READ_WHY_LINE =
  "読める理由は、苦情や 事故が あったときに 確かめるためです。";

/**
 * ★何日 経ったか。★時計を 見ません。★今日を 渡してもらいます。
 */
export function ageInDays(createdAt, todayISO) {
  const c = String(createdAt || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c) || !/^\d{4}-\d{2}-\d{2}$/.test(String(todayISO || ""))) return null;
  const a = Date.UTC(Number(c.slice(0, 4)), Number(c.slice(5, 7)) - 1, Number(c.slice(8, 10)));
  const b = Date.UTC(Number(todayISO.slice(0, 4)), Number(todayISO.slice(5, 7)) - 1, Number(todayISO.slice(8, 10)));
  return Math.round((b - a) / 86400000);
}

/** ★もうすぐ 消えるか（★見本③「まもなく 消えます」）。 */
export function isVanishingSoon(createdAt, todayISO) {
  const d = ageInDays(createdAt, todayISO);
  return d != null && d >= KEEP_DAYS - SOON_DAYS && d < KEEP_DAYS;
}

/** ★もう 消える ぶんか（★90日を 過ぎた）。 */
export function isExpired(createdAt, todayISO) {
  const d = ageInDays(createdAt, todayISO);
  return d != null && d >= KEEP_DAYS;
}

/**
 * ★出す 書き込み。
 *
 *   ★★取り消した ものも 残します（★見本②「静かに 1行だけ 残ります」）。
 *     ★★中身は 出しません。★取り消した、という 1行だけです。
 *   ★90日を 過ぎた ものは 出しません。★消すのは 別の 定期処理です。
 *   ★古い順に 並べます（★会話だからです）。
 */
export function visibleMessages(messages, todayISO) {
  return (messages || [])
    .filter((m) => m && !isExpired(m.created_at, todayISO))
    .sort((a, b) => (String(a.created_at) < String(b.created_at) ? -1 : 1))
    .map((m) => ({
      ...m,
      withdrawn: !!m.withdrawn_at,
      // ★★取り消したら、★中身を 出しません。
      body: m.withdrawn_at ? null : m.body,
      soon: isVanishingSoon(m.created_at, todayISO)
    }));
}

/**
 * ★書けるか。★運営の方は 書けません（★見本③）。
 *
 *   @param role      ★その教室での 役割
 *   @param isTeacher ★その門下の 先生か
 *   @param isMember  ★その門下の 学生（★担当が 終わっていない）か
 *
 *   ★★owner・admin は、★門下には 書けません。★読むだけです。
 *   ★★学校からの おしらせ（teacherId が null）だけ、★運営の方が 書きます。
 */
export function mayPost({ role, isTeacher, isMember, isAnnouncement }) {
  if (isAnnouncement) return role === "owner" || role === "admin";
  return !!isTeacher || !!isMember;
}

/**
 * ★読んだ記録を 残すか（★坂本さんのご指示・2026-09-10）。
 *
 *   ★★運営の方が 門下を 開いた ときだけ、★1行 残します。
 *     ★先生と 学生は、★自分の 門下です。★残しません。
 *     ★★全員の 開封を 残すと、★誰が いつ 読んだかの 台帳に なります。
 *     ★★残す わけは「読むだけです」の 約束を 確かめるため だけです。
 */
export function shouldLogRead({ role, isTeacher, isMember }) {
  if (isTeacher || isMember) return false;
  return role === "owner" || role === "admin";
}

/** ★門下の 名前（★見本①「斎藤先生の 門下」）。 */
export function studioName(teacherName) {
  return teacherName ? `${teacherName}の 門下` : "門下";
}

// ---------------------------------------------------------------------------
// ★★広い画面の 決まりB（★2026-09-10・坂本さんの お決め）
//
//   ★本文 640px ／ 2ペイン ／ 一覧には 名前と 最終更新だけ
//   ★★本文の 抜粋を 出しません。
//     ★★抜粋は、★書いた人の 書き出しを、★肩ごしに 見える 画面に 置きます。
//     ★この製品では、★本文に 体調が 入ることが あります。
//     ★名前と 日付だけなら、★1つも 漏れません。
//
//   ★★連絡・ノート・くばりもの・保有データの一覧、★これから 作る ものも 同じです。
//   ★決めは ここ1か所です。★画面ごとに 書きません。
// ---------------------------------------------------------------------------

/** ★本文の はば。 */
export const BODY_WIDTH = 640;

/** ★2ペインに するか。 */
export const TWO_PANE_AT = 900;

export function isTwoPane(width) {
  return typeof width === "number" && width >= TWO_PANE_AT;
}

/**
 * ★一覧の 1行に 出してよい もの。
 *
 *   ★★本文の 抜粋を 入れません。★名前と 最終更新だけです。
 */
export function listRowOf(item, nameOf) {
  return {
    id: item && item.id,
    name: nameOf ? nameOf(item) : "",
    updatedAt: (item && (item.updated_at || item.created_at)) || null
  };
}
