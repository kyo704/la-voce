import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 重要: このクライアントは Row Level Security を無視します。
// ブラウザに公開される場所（クライアントコンポーネントなど）では絶対に使わないこと。
// API Route / Webhook など、サーバー上でのみ使用してください。
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
