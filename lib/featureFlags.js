// ============================================================================
// 機能フラグ（統合実行ルートv4 G2-14「指導者・教室機能を機能フラグでオフ」）
//
// ★判定はこのファイルだけが持つこと。画面ごとに is_admin を書くと、
//   隠し忘れが必ず出る（表示ゲート・ロック判定・共有範囲と同じ原則）。
//
// なぜ隠すのか（v4 §4-2）:
//   指導者機能は最大の増幅装置だが、いま権限の層とデータの層が固まっていない。
//   壊れたものの上で増幅すると、事故も増幅される。10人に配る段階では、
//   検証できていない機能を一般ユーザーの視界から外しておく。
//   ★「捨てる」ではなく「順番の問題」。G3.5 で戻す。
// ============================================================================

/**
 * 検証途中の機能を見せてよい相手か。
 * 管理者（is_admin）と、指導者ベータに招いた人（teacher_beta_access）だけ。
 */
export function canSeeBetaFeatures(profile) {
  if (!profile) return false;
  return !!profile.is_admin || !!profile.teacher_beta_access;
}

/**
 * 指導者・教室の機能（生徒の招待、生徒一覧、教室の管理）。
 * ★既につながっている人からは取り上げない。
 *   共有を解除する手段まで消えてしまい、かえって不利益になるため。
 */
export function canSeeTeacherFeatures(profile, { hasTeacherLinks = false, hasStudentLinks = false } = {}) {
  return canSeeBetaFeatures(profile) || hasTeacherLinks || hasStudentLinks;
}

/**
 * LINE通知の連携。
 * 公式アカウントの運用（友だち追加の導線・Webhookの設定）が固まるまでは、
 * 一般ユーザーに出さない。設定が済んでいない環境では入口だけあっても連携できない。
 */
export function canSeeLineLink(profile) {
  return canSeeBetaFeatures(profile);
}
