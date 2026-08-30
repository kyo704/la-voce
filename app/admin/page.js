import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { C } from "@/lib/tokens";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";

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
// 実行順マスター Stage 2-2で使った選択肢と対応させる
const SURVEY_LABEL = {
  morning30: "朝30秒の記録",
  weekly_discovery: "週の振り返り・分析の発見",
  performance_prep: "本番に向けた準備",
  not_yet: "まだよく分からない"
};

export default async function AdminPage() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "管理画面の認証確認");
  // ★つながらないときは、ログイン画面へ飛ばさない。飛ばしても、その画面も開かない。
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;
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
    .select("id, name, email, occupation, school, created_at, is_admin, survey_day7_response, pwa_install_prompted_at, pwa_installed_at, onboarding_completed")
    .order("created_at", { ascending: false });
  const { data: subs } = await admin.from("subscriptions").select("*");
  // 実行順マスター Stage 0-3・Stage 2-1: 入力率の集計に必要な列を追加で取得する。
  const { data: entryRows } = await admin
    .from("entries")
    .select("user_id, weight_kg, body_fat_pct, meals, exercises, temperature, humidity, medication_tags, mental_tags, mental_reason, cpps_value, voice_memo");
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

  // ---- 消えたアカウントの数（時刻だけ） ----
  //   ★select するのは deleted_at だけです。「*」にしないでください。
  //     いまは列が2つしかありませんが、あとで誰かが列を足したときに
  //     ここが黙って拾ってしまいます。
  //   ★表そのものに時刻以外を入れない、という決めごとが先にありますが、
  //     読む側でも狭めておきます（二重の歯止め）。
  const { data: deletionRows } = await admin
    .from("account_deletions").select("deleted_at").order("deleted_at", { ascending: false });
  const deletionTotal = (deletionRows || []).length;
  // 月ごとの内訳。★人を特定できる粒度にしないため、日ではなく月にします。
  const deletionByMonth = {};
  (deletionRows || []).forEach((r) => {
    const m = String(r.deleted_at || "").slice(0, 7);   // YYYY-MM
    if (m) deletionByMonth[m] = (deletionByMonth[m] || 0) + 1;
  });
  const deletionMonths = Object.entries(deletionByMonth).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);

  // ---- ここから追加分：実行順マスター Stage 2-1（入力率・7日目調査・PWA導線） ----
  const n = (entryRows || []).length || 1;
  const pct = (count) => `${Math.round((count / n) * 1000) / 10}%`;
  const inputRateRows = [
    { label: "体重", count: (entryRows || []).filter((e) => typeof e.weight_kg === "number").length },
    { label: "体脂肪率", count: (entryRows || []).filter((e) => typeof e.body_fat_pct === "number").length },
    { label: "食事の詳細記録", count: (entryRows || []).filter((e) => Array.isArray(e.meals) && e.meals.length > 0).length },
    { label: "運動の詳細記録", count: (entryRows || []).filter((e) => Array.isArray(e.exercises) && e.exercises.length > 0).length },
    { label: "環境（気温・湿度）", count: (entryRows || []).filter((e) => typeof e.temperature === "number" || typeof e.humidity === "number").length },
    { label: "服薬タグ", count: (entryRows || []).filter((e) => Array.isArray(e.medication_tags) && e.medication_tags.length > 0).length },
    { label: "気持ちタグ・日記", count: (entryRows || []).filter((e) => (Array.isArray(e.mental_tags) && e.mental_tags.length > 0) || (e.mental_reason || "").trim()).length },
    { label: "CPPS客観測定", count: (entryRows || []).filter((e) => typeof e.cpps_value === "number").length },
    { label: "声のメモ", count: (entryRows || []).filter((e) => (e.voice_memo || "").trim()).length }
  ];

  const surveyCounts = {};
  (profiles || []).forEach((p) => {
    if (p.survey_day7_response) surveyCounts[p.survey_day7_response] = (surveyCounts[p.survey_day7_response] || 0) + 1;
  });
  const pwaPrompted = (profiles || []).filter((p) => p.pwa_install_prompted_at).length;
  const pwaInstalled = (profiles || []).filter((p) => p.pwa_installed_at).length;
  const onboardingIncomplete = (profiles || []).filter((p) => !p.onboarding_completed).length;
  // ---- 追加分ここまで ----

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

      {/* ---- ここから追加：実行順マスター Stage 2-1・2-2・1-4 ---- */}
      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 40, marginBottom: 12 }}>
        項目ごとの入力率
      </h2>
      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
        全ユーザー・総記録{n}件に対する割合です（実行順マスター Stage 0-3・判断ゲート①の材料）。
      </p>
      <div className="rounded-2xl border p-4" style={{ borderColor: C.line, background: C.card }}>
        <div className="space-y-1.5">
          {inputRateRows.map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.inkSoft }}>{r.label}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{pct(r.count)}（{r.count}件）</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 32, marginBottom: 12 }}>
        消えたアカウント
      </h2>
      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
        ★数だけです。誰が消したかは分かりません（時刻しか残していません）。
        30日の猶予を申し出た時点では数えず、実際に消えたときだけ数えます。
      </p>
      <div className="rounded-2xl border p-4" style={{ borderColor: C.line, background: C.card }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: C.inkSoft }}>これまでの合計</span>
          <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{deletionTotal} 件</span>
        </div>
        {deletionMonths.length === 0 ? (
          <p style={{ fontSize: 12, color: C.inkSoft }}>まだありません。</p>
        ) : (
          <div className="space-y-1.5" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
            {deletionMonths.map(([month, count]) => (
              <div key={month} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.inkSoft }}>{month.replace("-", "年")}月</span>
                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{count} 件</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 32, marginBottom: 12 }}>
        7日目マイクロ調査
      </h2>
      <div className="rounded-2xl border p-4" style={{ borderColor: C.line, background: C.card }}>
        {Object.keys(surveyCounts).length === 0 ? (
          <p style={{ fontSize: 13, color: C.inkSoft }}>まだ回答がありません。</p>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(surveyCounts).map(([key, count]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.inkSoft }}>{SURVEY_LABEL[key] || key}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{count}件</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 32, marginBottom: 12 }}>
        PWAインストール導線
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
          <div className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>{pwaPrompted}</div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>インストールを促した回数</div>
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
          <div className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>{pwaInstalled}</div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>実際にインストールされた数</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.inkSoft, marginTop: -20, marginBottom: 32 }}>
        オンボーディング未完了ユーザー: {onboardingIncomplete}人
      </p>
      {/* ---- 追加ここまで ---- */}

      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.curtain, marginTop: 8, marginBottom: 12 }}>
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
