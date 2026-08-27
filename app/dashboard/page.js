import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VocalTracker from "@/components/VocalTracker";

export default async function DashboardPage() {
  const supabase = createClient();
  // 通信が不安定な瞬間（Supabaseの一時停止からの復帰中など）は、layout.js を通過していても
  // ここで user が null になりうる。以前はそのまま user.id を読んでいたため、
  // 「TypeError: Cannot read properties of null (reading 'id')」で画面ごと落ちていた。
  // 落とさずにログインへ戻し、セッションを取り直させる。
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }

  return <VocalTracker userId={user.id} userEmail={user.email} />;
}
