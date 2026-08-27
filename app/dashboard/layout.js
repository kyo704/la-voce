import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withTimeout, isConnectivityError, AUTH_TIMEOUT_MS } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";

// 現在は実験公開のため無料開放中。REQUIRE_SUBSCRIPTION=true にすると
// 有料プラン（trialing / active）を持つユーザーのみに制限できます。
export default async function DashboardLayout({ children }) {
  const supabase = createClient();

  // ★「ログインしていない」と「つながらない」を分けること。
  //   以前は時間制限が無く、Supabase が応答しないとここで永久に待っていた。
  //   かといって、つながらないときにログイン画面へ飛ばすのも誤り。
  //   ログイン済みの人を追い出すうえ、そのログイン画面も同じ理由で開かない。
  let user = null;
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS, "認証の確認");
    user = data?.user ?? null;
  } catch (e) {
    if (isConnectivityError(e)) {
      console.error("ダッシュボードの認証確認がつながりませんでした:", e.message);
      return <ConnectionError detail="認証の確認がタイムアウトしました" />;
    }
    throw e;
  }

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
