// ============================================================================
// メール制限 × Supabase認証（2026-09-12）
//
//   ★lib/emailRestrictions.js の判定を、Supabaseのセッションに当てはめます。
// ============================================================================
import { isAllowedEmail, getEmailRestrictionError } from "./emailRestrictions";

/** Supabaseセッションから、メールアドレスを取り出す。無ければ null。 */
export function getEmailFromSession(session) {
  return (session && session.user && session.user.email) || null;
}

/** セッションのメールが、実行権限を持つか。 */
export function isSessionAllowed(session) {
  const email = getEmailFromSession(session);
  return email ? isAllowedEmail(email) : false;
}

/** 権限がなければ例外を投げる。ログインしていなければ、その旨を伝える。 */
export function guardEmailAccess(session) {
  const email = getEmailFromSession(session);
  if (!email) throw new Error("認証されていません。ログインしてください。");
  if (!isAllowedEmail(email)) throw new Error(getEmailRestrictionError(email));
}

/** 例外を投げず、true/falseだけを返す版。 */
export function checkEmailAccessSafe(session) {
  try {
    guardEmailAccess(session);
    return true;
  } catch {
    return false;
  }
}

/** 権限がないときの理由文だけを返す。問題なければ null。 */
export function getEmailAccessError(session) {
  const email = getEmailFromSession(session);
  if (!email) return "認証されていません。ログインしてください。";
  if (!isAllowedEmail(email)) return getEmailRestrictionError(email);
  return null;
}

/**
 * Supabase RLSポリシー側で使う関数の下書き（★参考。まだ流していません）。
 *
 * create or replace function is_email_allowed()
 * returns boolean as $$
 *   select auth.jwt()->>'email' in (
 *     'kyo0703opera@gmail.com',
 *     'kyo0703opera+forcode@gmail.com'
 *   );
 * $$ language sql stable;
 */
export const RLS_POLICY_TEMPLATE = `
create or replace function is_email_allowed()
returns boolean as $$
  select auth.jwt()->>'email' in (
    'kyo0703opera@gmail.com',
    'kyo0703opera+forcode@gmail.com'
  );
$$ language sql stable;
`;
