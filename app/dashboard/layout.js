import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";

// 現在は実験公開のため無料開放中。REQUIRE_SUBSCRIPTION=true にすると
// 有料プラン（trialing / active）を持つユーザーのみに制限できます。
export default async function DashboardLayout({ children }) {
  const supabase = createClient();

  // ★「ログインしていない」と「つながらない」を分けること。
  //   以前は時間制限が無く、Supabase が応答しないとここで永久に待っていた。
  //   かといって、つながらないときにログイン画面へ飛ばすのも誤り。
  //   ログイン済みの人を追い出すうえ、そのログイン画面も同じ理由で開かない。
  // ★判定は lib/withTimeout.js の1か所から。以前はここに try/catch を
  //   書いていたため、同じ形がほかの10か所に広がらないままでした。
  const { user, unreachable } = await getUserWithTimeout(supabase, "認証の確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;

  if (!user) redirect("/login");

  if (process.env.REQUIRE_SUBSCRIPTION === "true") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    const active = sub && (sub.status === "trialing" || sub.status === "active");
    if (!active) redirect("/billing");
  }

  return <>{children}</>;
}
