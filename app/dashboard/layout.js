import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 現在は実験公開のため無料開放中。REQUIRE_SUBSCRIPTION=true にすると
// 有料プラン（trialing / active）を持つユーザーのみに制限できます。
export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
