import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { C } from "@/lib/tokens";
import FeedbackForm from "@/components/FeedbackForm";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";

export default async function FeedbackPage() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "お問い合わせの認証確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;
  if (!user) redirect("/login");

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
        ご意見・不具合の報告
      </h1>
      <p style={{ color: C.inkSoft, marginTop: 8, marginBottom: 24, fontSize: 14, lineHeight: 1.7 }}>
        バグ報告や「こんな機能が欲しい」というご要望をお送りください。
      </p>
      <FeedbackForm userEmail={user.email} />
      <a href="/dashboard" style={{ display: "inline-block", marginTop: 24, fontSize: 13, color: C.inkSoft }}>
        ← アプリに戻る
      </a>
    </main>
  );
}
