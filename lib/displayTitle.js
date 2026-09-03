// ============================================================================
// 表示の肩書き（2026-09-03）
//
//   出どころ docs/opus/lavoce-仕様-表示肩書き-display_title（9月4日）.md
//
//   ★これは「教室が、その人の呼び方を決める」ものです。
//     ★本人が、自分で名乗るものではありません。
//     ★★だから、書ける道は関数1本だけにします（set_member_display_title）。
//       ★列ごとの UPDATE 権限は、★与えません。
//       ★memberships の UPDATE ポリシーは auth.uid() = user_id を許すので、
//         ★権限を与えると、★本人が自分の肩書きを書けてしまいます。
//         ★2026-09-03、Opus がこの点を先に指摘し、実物の照会で裏づきました。
//
//   ★空文字を保存しないこと。★null にします。
//     ★空文字が入ると「未設定」と「明示的に空にした」を区別できません。
//     ★「選んだ」と「既定のまま」を分ける、という決まりと同じ線です。
//
//   ★権限の名前（責任者／管理者／講師）は、★列に書き込みません。
//     ★表示のときだけ当てます。
//     ★書き込むと「明示的に選ばれた値」に化けます。
//
//   ★このファイルは、ほかの lib を読み込みません。
//     検査が1本ずつ切り離して読み込むためです。
// ============================================================================

/** 長さの上限。★サーバの CHECK 制約と同じ値にすること。 */
export const DISPLAY_TITLE_MAX = 20;

/**
 * ★入れられない語。
 *
 *   ★lib/linkConsent.js の FORBIDDEN_LINK_PHRASES と同じ作法です。
 *   ★サーバ側（関数）でも、同じ語を見ること。
 *     ★画面だけで止めると、API を直に叩かれます。
 */

/** ① 資格の名称。★名称独占の資格です（医師法18条ほか）。 */
export const FORBIDDEN_TITLE_QUALIFICATIONS = [
  "医師", "医者", "ドクター", "Dr", "Doctor", "歯科医",
  "看護師", "薬剤師", "言語聴覚士", "理学療法士", "作業療法士",
  "管理栄養士", "栄養士", "保健師", "助産師", "公認心理師"
];

/**
 * ② 運営を装う語。
 *
 *   ★生徒が「運営からの連絡」と読み違えます。
 *   ★連絡の機能と組み合わさると、実害が出ます。
 */
export const FORBIDDEN_TITLE_IMPERSONATION = [
  "運営", "公式", "Woolsong", "ウールソング", "サポート", "事務局", "管理者", "システム"
];

export const FORBIDDEN_TITLE_WORDS = [
  ...FORBIDDEN_TITLE_QUALIFICATIONS,
  ...FORBIDDEN_TITLE_IMPERSONATION
];

/**
 * 保存する形に整えます。★空白だけなら null です。
 *
 *   ★前後の空白を落としてから測ります。★空白は、長さに数えません。
 *   ★null と空文字を、同じ null にそろえます。
 */
export function normalizeDisplayTitle(raw) {
  if (raw == null) return null;
  const t = String(raw).replace(/^[\s　]+|[\s　]+$/g, "");
  return t.length === 0 ? null : t;
}

/**
 * 入れてよいか。
 *
 * @returns {{ok:true, value:string|null} | {ok:false, reason:string, message:string}}
 *
 *   ★理由の文は、★「あなたが医師ではないから」ではありません。
 *     ★「こちらで確かめられないから」です。
 *     ★★確かめられないことを、表示しない。★これが規則です。
 *     ★「今日の目安」で引いた線と、同じ考え方です。
 */
export function checkDisplayTitle(raw) {
  const value = normalizeDisplayTitle(raw);
  if (value === null) return { ok: true, value: null };
  if (value.length > DISPLAY_TITLE_MAX) {
    return { ok: false, reason: "tooLong",
      message: `呼び方は${DISPLAY_TITLE_MAX}字までです。` };
  }
  // ★改行・制御文字。★見えない字で、表示を崩されないように。
  if (/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/.test(value)) {
    return { ok: false, reason: "control",
      message: "改行や、目に見えない記号は、お使いいただけません。" };
  }
  const lower = value.toLowerCase();
  const hit = FORBIDDEN_TITLE_WORDS.find((w) => lower.includes(w.toLowerCase()));
  if (hit) {
    const isQualification = FORBIDDEN_TITLE_QUALIFICATIONS
      .some((w) => w.toLowerCase() === hit.toLowerCase());
    if (isQualification) {
      return { ok: false, reason: "qualification",
        message: "資格の名前は、こちらで確かめられないため、お使いいただけません。" };
    }
    return { ok: false, reason: "impersonation",
      message: "運営と読み違えられる言葉は、お使いいただけません。" };
  }
  return { ok: true, value };
}

/**
 * 権限の名前。★列に書き込まないこと。★表示のときだけ当てます。
 *
 *   ★「管理者」は、教室の役割としての admin です。
 *     ★Woolsong の運営ではありません。
 */
export const ROLE_FALLBACK_LABELS = {
  owner: "責任者",
  admin: "管理者",
  teacher: "講師"
};

/**
 * 画面に出す呼び方。
 *
 *   ★肩書きが入っていれば、それ。
 *   ★入っていなければ、権限の名前。
 *   ★どちらも無ければ null。★呼び方を出しません。
 *     ★知らない役割に、勝手な名前を当てないこと。
 */
export function displayTitleOf(membership) {
  const m = membership || {};
  const t = normalizeDisplayTitle(m.display_title);
  if (t) return t;
  return ROLE_FALLBACK_LABELS[m.role] || null;
}

/**
 * 保存したあとの文。★誰の、何を、どうしたかを返します。
 *
 *   ★「保存しました」とは言いません。★他人に触った操作だからです。
 *   ★空欄に戻したときは「削除しました」ではなく「戻しました」です。
 */
export function savedMessage(name, value) {
  const who = name ? `${name}さん` : "その方";
  if (value) return `${who}の表示を「${value}」にしました`;
  return `${who}の表示を、権限の名前に戻しました`;
}
