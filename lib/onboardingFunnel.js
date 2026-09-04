// ============================================================================
// 導線のどこで落ちているかを数える（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §9
//
//   ★★外部の解析サービスを入れません。★経路が増えます。
//     ★自分のサーバに、★日ごとの数だけを持ちます。
//
//   ★★個人を特定しません。
//     ・user_id を持ちません
//     ・IP を持ちません
//     ・端末の識別子を持ちません
//     ★持つのは「日付」「段の名前」「数」の3つだけです。
//
//   ★★人数ではありません。★回数です。
//     ★同じ方が2回開けば、2 と数えます。
//     ★★人数を出すには、個人を見分ける必要があります。★やりません。
//     ★だから「◯人が落ちた」とは言えません。「◯回」です。
//
//   ★いちばん大きい落ち込みが、★次に直す場所です。
//
//   ★このファイルは、ほかの lib を読み込みません。
// ============================================================================

/**
 * 数える段。★順番のとおりに並べてあります。
 *
 *   ★★増やすときは、★ここに足してから、呼ぶ側を書くこと。
 *     ★知らない名前は、サーバが受け取りません。
 */
export const FUNNEL_STEPS = [
  { key: "landing", label: "着地のページを開いた" },
  { key: "add_to_home_shown", label: "ホーム画面の案内を見た" },
  { key: "add_to_home_skipped", label: "「あとで」を押した" },
  { key: "standalone_opened", label: "ホーム画面から開いた" },
  { key: "register_started", label: "登録を始めた" },
  { key: "register_completed", label: "登録を終えた" },
  { key: "first_entry_saved", label: "記録を1つ入れた" },
  { key: "android_install_shown", label: "Android の案内を見た" },
  { key: "android_install_accepted", label: "Android で置いた" }
];

export const FUNNEL_KEYS = FUNNEL_STEPS.map((s) => s.key);

/** 知っている段か。★知らない名前は、受け取りません。 */
export function isFunnelStep(key) {
  return FUNNEL_KEYS.includes(key);
}

export function funnelLabel(key) {
  const s = FUNNEL_STEPS.find((x) => x.key === key);
  return s ? s.label : null;
}

/**
 * ★数えてはいけないもの。
 *
 *   ★体調の値も、メールアドレスも、識別子も、★1つも渡しません。
 *   ★渡す口が無いので、★渡せません。
 *     ★★「入れないでください」ではなく、★入れられない形にします。
 *   ★段の名前だけを受け取ります。
 */
export function buildCountPayload(step) {
  if (!isFunnelStep(step)) return null;
  // ★これで全部です。★増やさないこと。
  return { step };
}
