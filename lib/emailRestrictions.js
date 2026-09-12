// ============================================================================
// メール制限（2026-09-12）
//
//   ★実行権限（管理・検証用の操作）を、特定の2つのメールアドレスだけに絞ります。
//   ★development環境では、この門を通しません（開発の妨げにならないように）。
// ============================================================================

export const ALLOWED_EMAILS = [
  "kyo0703opera@gmail.com",
  "kyo0703opera+forcode@gmail.com",
];

/** メールアドレスが実行権限を持つか。development環境では常にtrue。 */
export function isAllowedEmail(email) {
  if (process.env.NODE_ENV === "development") return true;
  if (!email) return false;
  return ALLOWED_EMAILS.includes(String(email).trim().toLowerCase());
}

/** 権限がないときに見せる、日本語のエラー文。 */
export function getEmailRestrictionError(email) {
  return `実行権限がありません。対象メール: ${ALLOWED_EMAILS.join(", ")}。受け取ったメール: ${email}`;
}

/** 許可メールの一覧（呼び出し側が書き換えても、内部の配列は変わらない）。 */
export function getAllowedEmails() {
  return [...ALLOWED_EMAILS];
}

/** development環境かどうか。 */
export function isDevelopmentMode() {
  return process.env.NODE_ENV === "development";
}
