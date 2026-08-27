import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withTimeout, isConnectivityError, AUTH_TIMEOUT_MS } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";
import VocalTracker from "@/components/VocalTracker";

export default async function DashboardPage() {
  const supabase = createClient();
  // 通信が不安定な瞬間（Supabaseの一時停止からの復帰中など）は、layout.js を通過していても
  // ここで user が null になりうる。以前はそのまま user.id を読んでいたため、
  // 「TypeError: Cannot read properties of null (reading 'id')」で画面ごと落ちていた。
  //
  // ★ただし、ログイン画面へ戻していいのは「本当にログインしていない」ときだけ。
  //   つながらないだけの人を戻すと、ログイン画面も同じ理由で開かず、
  //   利用者から見れば「アプリが二度と開かない」になる。
  let user = null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS, "認証の確認");
    if (error && isConnectivityError(error)) {
      console.error("記録画面の認証確認がつながりませんでした:", error.message);
      return <ConnectionError detail="認証の確認に失敗しました" />;
    }
    user = data?.user ?? null;
  } catch (e) {
    if (isConnectivityError(e)) {
      console.error("記録画面の認証確認がつながりませんでした:", e.message);
      return <ConnectionError detail="認証の確認がタイムアウトしました" />;
    }
    throw e;
  }

  if (!user) redirect("/login");

  return <VocalTracker userId={user.id} userEmail={user.email} />;
}
