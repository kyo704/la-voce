// ============================================================================
// ★門下に 招く（★見本 `P_monkaInvite`・裁定 その108 ②）── ★決めごと 1か所
//
//   ★★★入る 道は 2つ だけ です（★見本の 芯）──
//     ①合言葉（★誰でも 打てます）★★これは **もう 出来て います**
//       （`teacher_invitations.monka_teacher_id`・裁定 その83）
//     ②名簿から 名指しで 招く（★その方 だけ）★★これを 作ります
//
//   ★★★学生が 門下を さがす 仕組みは ありません。
//     ★★さがせると、★誰が どの 先生に ついて いるかが 分かります。
//   ★★★どちらも、★最後に **ご本人が 承知して はじめて** 入ります。
//     ★★こちらから 入れる ことは できません。
//
//   ★★★新しい 表を 作って いません（★裁定 その108）。
//     ★★`teacher_invitations` に 3列 足しました ──
//       `target_user_id`（宛て先）／`invited_at`（いつ 出したか）／`kind`（open ／ named）
//
//   ★見張り components/tests/monka-invite.test.js
// ============================================================================

export const HEAD = "門下に 招く";
export const CODE_HEAD = "① 合言葉を 見せる";
export const CODE_SUB = "この 8文字を 打つと、この 門下に 入ります";
export const LIST_HEAD = "② 名簿から 招く";
export const LIST_SUB = "顔合わせを 休んだ方、合言葉を 失くした方に";

/** ★1行の 右に 出る 3つの 顔（★見本の とおり）。 */
export const STATE = Object.freeze({
  none: "招く", sent: "招待中", joined: "入って います"
});

/**
 * ★その方の いまの ようす。
 *
 *   ★★`monka` …… その 先生の 門下（★`assignments` の 学生の 番号）
 *   ★★`invites` …… 名指しの 招き（★`target_user_id` を 持つ 行）
 */
export function stateOf(studentId, { monka, invites }) {
  if ((monka || []).some((id) => String(id) === String(studentId))) return "joined";
  if ((invites || []).some((i) => i && String(i.target_user_id) === String(studentId)
    && !i.used_at)) return "sent";
  return "none";
}

/** ★押せるのは、★まだ 招いて いない 方 だけ です。 */
export function mayInvite(state) {
  return state === "none";
}

/** ★名簿に いる 方 だけ（★名簿の 外は 探せません）。 */
export function invitable(members, { monka, invites }) {
  return (members || []).map((m) => ({
    ...m, state: stateOf(m.id, { monka, invites })
  }));
}

export const LIST_NOTES = Object.freeze([
  "学校の 名簿に いる方だけ が 出ます。",
  "名簿の 外を 探す ことは できません。",
  "押すと、その方の 画面に「招かれて います」と 出ます。",
  "入るか どうかは、ご本人が 決めます。こちらから 入れる ことは できません。"
]);

export const BOTTOM_NOTES = Object.freeze([
  "学生が 門下を さがす 仕組みは ありません。",
  "（さがせると、誰が どの先生に ついて いるかが 分かって しまう からです）",
  "入る 道は この 2つだけ ── 合言葉 か、招かれる か。",
  "どちらも、最後に ご本人が 承知して はじめて 入ります。"
]);

/** ★招かれた 方の 画面の 字。 */
export const INVITED_HEAD = "招かれて います";
export function invitedLine({ teacherName, orgName }) {
  const 師 = teacherName || "先生";
  const 校 = orgName ? `${orgName}の ` : "";
  return `${校}${師}の 門下に 招かれて います。`;
}
export const INVITED_NOTE = "入るか どうかは、あなたが 決めます。";
export const INVITED_OPEN = "見えるものを 確かめる";

export const SENT_LINE = "招きました。相手の 画面に 出ます。";
export const FAILED_LINE = "いま 招けませんでした。もう一度 お試し ください。";

/** ★合言葉の 字（★8文字・まぎれにくい 字だけ）。 */
export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;
export function makeCode(rand) {
  const r = rand || (() => Math.random());
  return Array.from({ length: CODE_LENGTH },
    () => CODE_CHARS[Math.floor(r() * CODE_CHARS.length)]).join("");
}
