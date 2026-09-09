// ============================================================================
// プロフィールの「あとから足した列」を、1回で読む（2026-09-09）
//
//   ★★はじめの 読み込みで、★profiles を 10回 引いていました。
//     ★うち 6回は、★1〜2列だけの 読みです。
//     ★1回 170ms として、★それだけで 約1秒 かかっていました。
//
//   ★★なぜ 分かれていたか ── ★理由は ありました。
//     ★「その列が まだ 無い 環境が ある」ためです。
//     ★★1つの select に 混ぜると、★列が 1つ 無いだけで
//       ★プロフィールが 丸ごと 読めなくなります。
//     ★だから、★危ない列を 1つずつ 外して 読んでいました。
//
//   ★★だから「まとめる」だけには しません。★2つの道を 持ちます。
//     ★① まず まとめて 1回で 試します（★速い道）
//     ★② 失敗したら、★これまでどおり 1組ずつ 読み直します（★確かな道）
//   ★★列が 揃っている 環境では ①、★揃っていなければ ②。
//     ★どちらでも、★同じ形の 答えを 返します。
//
//   ★★呼ぶ側は、★どちらの道を 通ったかを 気にしません。
//
//   ★見張り components/tests/profile-extras.test.js
// ============================================================================

/**
 * ★あとから 足した列の 組。
 *
 *   ★★組ごとに 分けます。★②のとき、★組ごとに 読み直すためです。
 *   ★★1つの組が 読めなくても、★ほかの組は 読めます。
 */
export const EXTRA_GROUPS = Object.freeze({
  mode: ["record_mode"],
  deleted: ["deleted_at"],
  cycle: ["cycle_show_on_home"],
  age: ["is_under_18", "age_question_shown_at"],
  cohort: ["cohort", "is_internal"],
  tester: ["is_tester"],
  health: ["allergies", "regular_medications"]
});

/** ★まとめて 読むときの、列の 並び。 */
export function allExtraColumns() {
  const out = [];
  for (const cols of Object.values(EXTRA_GROUPS)) out.push(...cols);
  return out;
}

/**
 * ★1回で 読み、★だめなら 組ごとに 読み直します。
 *
 *   @param supabase いつもの 入れ物
 *   @param userId   その方
 *   @returns { rows: {組: 行 または null}, errors: {組: 誤り または null}, merged: boolean }
 *     ★merged は「1回で 済んだか」です。★見張りと、★調べるときに 使います。
 */
export async function readProfileExtras(supabase, userId) {
  const groups = Object.keys(EXTRA_GROUPS);
  const rows = {};
  const errors = {};

  // ★★① まず、まとめて 1回。
  const { data, error } = await supabase
    .from("profiles").select(allExtraColumns().join(", ")).eq("id", userId).maybeSingle();
  if (!error) {
    for (const g of groups) {
      // ★★組ごとに 切り分けて 返します。★呼ぶ側の 形を 変えないためです。
      const row = {};
      for (const c of EXTRA_GROUPS[g]) row[c] = data ? data[c] : undefined;
      rows[g] = data ? row : null;
      errors[g] = null;
    }
    return { rows, errors, merged: true };
  }

  // ★★② 列が 無い環境。★これまでどおり、組ごとに 読み直します。
  //   ★★同時に 走らせます。★順に 待つ 理由が ありません。
  //   ★1つ 失敗しても、★ほかは 進みます。
  const results = await Promise.all(groups.map(async (g) => {
    const r = await supabase
      .from("profiles").select(EXTRA_GROUPS[g].join(", ")).eq("id", userId).maybeSingle();
    return [g, r];
  }));
  for (const [g, r] of results) {
    rows[g] = r.error ? null : (r.data || null);
    errors[g] = r.error || null;
  }
  return { rows, errors, merged: false };
}
