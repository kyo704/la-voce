import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWithTimeout } from "@/lib/withTimeout";
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
  // ★判定は lib/withTimeout.js の1か所から。以前はここに try/catch を
  //   書いていたため、同じ形がほかの10か所に広がらないままでした。
  const { user, unreachable } = await getUserWithTimeout(supabase, "認証の確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;

  if (!user) redirect("/login");

  return <VocalTracker userId={user.id} userEmail={user.email} />;
}
