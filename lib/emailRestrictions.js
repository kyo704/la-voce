/**
 * emailRestrictions.js
 * 
 * 実行権限のメールアドレス制限
 * 
 * 許可メール：
 * - kyo0703opera@gmail.com
 * - kyo0703opera+forcode@gmail.com
 * 
 * ※ development環境では無制限
 */

const ALLOWED_EMAILS = [
  'kyo0703opera@gmail.com',
  'kyo0703opera+forcode@gmail.com',
];

/**
 * メールアドレスが実行権限を持つか確認
 * @param {string} email - ユーザーのメールアドレス
 * @returns {boolean} 実行権限があればtrue
 */
function isAllowedEmail(email) {
  // development環境では無制限
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!email) {
    return false;
  }

  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * メールアドレスのエラーメッセージ
 * @param {string} email - ユーザーのメールアドレス
 * @returns {string} エラーメッセージ
 */
function getEmailRestrictionError(email) {
  return `実行権限がありません。対象メール: ${ALLOWED_EMAILS.join(', ')}。受け取ったメール: ${email}`;
}

/**
 * 許可メールのリストを取得
 * @returns {string[]} 許可されたメールアドレスのリスト
 */
function getAllowedEmails() {
  return [...ALLOWED_EMAILS];
}

/**
 * development環境かチェック
 * @returns {boolean}
 */
function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development';
}

module.exports = {
  isAllowedEmail,
  getEmailRestrictionError,
  getAllowedEmails,
  isDevelopmentMode,
  ALLOWED_EMAILS,
};
