import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { C } from "@/lib/tokens";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

const STATUS_LABEL = {
  trialing: "お試し中",
  active: "契約中",
  past_due: "支払い遅延",
  canceled: "解約済み",
  none: "未登録"
};
const STATUS_COLOR = {
  trialing: C.gold,
  active: C.sage,
  past_due: C.rust,
  canceled: C.inkSoft,
  none: C.inkSoft
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!myProfile || !myProfile.is_admin) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "1.8rem", color: C.curtain }}>
          権限がありません
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12 }}>このページは管理者のみ閲覧できます。</p>
        <a href="/dashboard" style={{ color: C.curtain, fontSize: 14, marginTop: 16, display: "inline-block" }}>
          アプリに戻る
        </a>
      </main>
    );
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, email, occupation, school, created_at, is_admin")
    .order("created_at", { ascending: false });
  const { data: subs } = await admin.from("subscriptions").select("*");
  const { data: entryRows } = await admin.from("entries").select("user_id");
  const { data: feedbackRows } = await admin
    .from("feedback")
    .select("id, email, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const subByUser = {};
  (subs || []).forEach((s) => { subByUser[s.user_id] = s; });

  const entryCountByUser = {};
  (entryRows || []).forEach((r) => {
    entryCountByUser[r.user_id] = (entryCountByUser[r.user_id] || 0) + 1;
  });

  const users = (profiles || []).map((p) => {
    const s = subByUser[p.id];
    return {
      ...p,
      status: s ? s.status : "none",
      trialEnd: s ? s.trial_end : null,
      periodEnd: s ? s.current_period_end : null,
      entryCount: entryCountByUser[p.id] || 0
    };
  });

  const totalUsers = users.length;
  const trialingCount = users.filter((u) => u.status === "trialing").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const canceledCount = users.filter((u) => u.status === "canceled").length;

  const stats = [
    { label: "総ユーザー数", value: totalUsers },
    { label: "お試し中", value: trialingCount },
    { label: "契約中", value: activeCount },
    { label: "解約済み", value: canceledCount }
  ];

  return (
    <main className="px-4 sm:px-6" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2.25rem", color: C.curtain }}>
        管理者画面
      </h1>
      <p style={{ color: C.inkSoft, fontSize: 13, marginTop: 4, marginBottom: 24 }}>
        ログイン中: {user.email}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
            <div className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: C.inkSoft }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.card }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: "left" }}>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>名前</th>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>メール</th>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>職業／学校</th>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>登録日</th>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>ステータス</th>
                <th style={{ padding: "12px 14px", color: C.inkSoft, fontWeight: 500 }}>記録数</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "12px 14px" }}>
                    {u.name || "—"}{u.is_admin && <span style={{ marginLeft: 6, fontSize: 11, color: C.gold }}>管理者</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: C.inkSoft }}>{u.email || "—"}</td>
                  <td style={{ padding: "12px 14px", color: C.inkSoft }}>
                    {u.school ? `${u.school}（学生）` : u.occupation || "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: C.inkSoft }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ color: STATUS_COLOR[u.status] || C.inkSoft, fontWeight: 500 }}>
                      {STATUS_LABEL[u.status] || u.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: C.inkSoft }}>{u.entryCount}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: C.inkSoft }}>
                    まだユーザーがいません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 16 }}>
        管理者権限の付与や、契約状況の手動変更はSupabaseのTable Editorから行ってください。
      </p>

      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 40, marginBottom: 12 }}>
        フィードバック（直近30件）
      </h2>
      <div className="space-y-2">
        {(feedbackRows || []).map((f) => (
          <div key={f.id} className="rounded-xl p-3 border" style={{ background: C.card, borderColor: C.line }}>
            <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12, color: C.inkSoft }}>
              <span style={{ color: C.gold, fontWeight: 500 }}>{f.category}</span>
              <span>{f.email}</span>
              <span>{formatDate(f.created_at)}</span>
            </div>
            <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{f.message}</p>
          </div>
        ))}
        {(!feedbackRows || feedbackRows.length === 0) && (
          <p style={{ fontSize: 13, color: C.inkSoft }}>まだフィードバックはありません。</p>
        )}
      </div>
    </main>
  );
}
