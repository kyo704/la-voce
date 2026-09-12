/**
 * emailAuthGuard.js
 * 
 * Supabase認証とメール制限の統合ガード
 * 
 * 用途：
 * 1. ユーザーのメールアドレスを取得
 * 2. 実行権限を確認
 * 3. 実行不可の場合はエラーを返す
 */

const { isAllowedEmail, getEmailRestrictionError, isDevelopmentMode } = require('./emailRestrictions.js');

/**
 * Supabaseセッションからメールを取得
 * @param {Object} session - Supabase認証セッション
 * @returns {string|null} メールアドレス、またはnull
 */
function getEmailFromSession(session) {
  if (!session) {
    return null;
  }

  // Supabase Auth から user.email を取得
  return session.user?.email || null;
}

/**
 * セッションのメールが実行権限を持つか確認
 * @param {Object} session - Supabase認証セッション
 * @returns {boolean} 実行権限があればtrue
 */
function isSessionAllowed(session) {
  const email = getEmailFromSession(session);
  if (!email) {
    return false;
  }

  return isAllowedEmail(email);
}

/**
 * セッションが無い、またはメール制限で拒否された場合のエラーをスロー
 * @param {Object} session - Supabase認証セッション
 * @throws {Error} 実行権限がない場合
 */
function guardEmailAccess(session) {
  const email = getEmailFromSession(session);

  if (!email) {
    throw new Error('認証されていません。ログインしてください。');
  }

  if (!isSessionAllowed(session)) {
    throw new Error(getEmailRestrictionError(email));
  }
}

/**
 * セッションが無い、またはメール制限で拒否された場合、falseを返す
 * @param {Object} session - Supabase認証セッション
 * @returns {boolean} 実行権限があればtrue
 */
function checkEmailAccessSafe(session) {
  try {
    guardEmailAccess(session);
    return true;
  } catch {
    return false;
  }
}

/**
 * セッションが無い、またはメール制限で拒否された場合の詳細エラーを取得
 * @param {Object} session - Supabase認証セッション
 * @returns {string|null} エラーメッセージ、またはnull（成功時）
 */
function getEmailAccessError(session) {
  const email = getEmailFromSession(session);

  if (!email) {
    return '認証されていません。ログインしてください。';
  }

  if (!isSessionAllowed(session)) {
    return getEmailRestrictionError(email);
  }

  return null;
}

/**
 * REST API用のヘッダーからメールアドレスを抽出
 * @param {Object} headers - リクエストヘッダー
 * @returns {string|null} メールアドレス
 */
function getEmailFromAuthHeader(headers) {
  // Authorization: Bearer <token> の形式から取得
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  // ★注意: 実装環境では JWT をデコードして user.email を取得
  // ここではダミー実装（開発環境のみ使用）
  if (isDevelopmentMode()) {
    return headers['x-user-email'] || null;
  }

  return null;
}

/**
 * Supabase RLS ポリシーで使用するSQL関数の定義
 * 
 * ★実行対象：Supabase SQL Editor
 * 
 * CREATE OR REPLACE FUNCTION is_email_allowed()
 * RETURNS boolean AS $$
 * BEGIN
 *   RETURN auth.jwt()->>'email' IN (
 *     'kyo0703opera@gmail.com',
 *     'kyo0703opera+forcode@gmail.com'
 *   )
 *   OR current_setting('app.env', true) = 'development';
 * END;
 * $$ LANGUAGE plpgsql STABLE;
 * 
 * CREATE POLICY "email_restriction_policy"
 * ON <table_name>
 * USING (is_email_allowed());
 */
const RLS_POLICY_TEMPLATE = `
-- Supabase SQL Editor で実行する
-- メール制限用のRLSポリシー定義

CREATE OR REPLACE FUNCTION is_email_allowed()
RETURNS boolean AS $$
BEGIN
  RETURN auth.jwt()->>'email' IN (
    'kyo0703opera@gmail.com',
    'kyo0703opera+forcode@gmail.com'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 各テーブルに適用する例：
-- CREATE POLICY "email_restriction_select"
-- ON lessons
-- FOR SELECT
-- USING (is_email_allowed());
`;

module.exports = {
  getEmailFromSession,
  isSessionAllowed,
  guardEmailAccess,
  checkEmailAccessSafe,
  getEmailAccessError,
  getEmailFromAuthHeader,
  RLS_POLICY_TEMPLATE,
};
