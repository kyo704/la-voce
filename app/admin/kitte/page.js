// ============================================================================
// ★切ってある 機能 ── ★運営だけの 一覧（★裁定176・裁定171／2026-09-25）
//
//   ★見本 `SC['切ってある機能']`（★design-v49・iPhone で 開く用）。
//
//   ★★★なぜ `/admin` の 中か ── `lib/kitteAruKinou.js` に 書いて あります。
//     ★台帳の `features_hidden()` は `postgres` と `service_role` だけ です。
//     ★みなの 鍵で 呼べません。★権限を 広げずに、★`app/admin` の 型に 合わせます。
//
//   ★★字と 並びの 決めは `lib/kitteAruKinou.js` です。★ここでは 決めません。
// ============================================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { C } from "@/lib/tokens";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";
import {
  HIDDEN_FN, stateWord, sortRows, NONE_LINE,
  HEAD_LINES, OPEN_HEAD, OPEN_LINES, NO_COUNT_NOTE
} from "@/lib/kitteAruKinou";

export default async function KitteAruKinouPage() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "切ってある機能の認証確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;
  if (!user) redirect("/login");

  // ★★自分の `is_admin` を、★みなの 鍵で 読みます（★`app/admin/page.js` と 同じ 型）。
  //   ★★管理の 鍵で 読んでは いけません ── ★それでは 誰でも 通ります。
  const { data: me } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();

  if (!me || !me.is_admin) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "1.8rem", color: C.curtain }}>
          権限がありません
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12 }}>このページは管理者のみ閲覧できます。</p>
        <a href="/dashboard" style={{ color: C.curtain, fontSize: "0.875rem", marginTop: 16, display: "inline-block" }}>
          アプリに戻る
        </a>
      </main>
    );
  }

  // ★★ここから 先だけ 管理の 鍵を 使います。
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(HIDDEN_FN);
  // ★★読めなかった ときは「すべて 開いています」と 書きません。
  //   ★★★それは 嘘に なり得ます。★読めなかった と 書きます。
  const 読めた = !error && Array.isArray(data);
  const rows = 読めた ? sortRows(data) : [];

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 72px" }}>
      <a href="/admin" style={{ color: C.curtain, fontSize: "0.8125rem" }}>‹ 運営</a>
      <h1 className="ff-display italic" style={{ fontSize: "1.6rem", color: C.ink, marginTop: 10 }}>
        切ってある 機能
      </h1>

      <div style={{
        marginTop: 14, padding: "12px 14px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {HEAD_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>

      {!読めた ? (
        <p style={{ marginTop: 16, fontSize: "0.8125rem", color: C.rust, lineHeight: 1.9 }}>
          一覧を 読めませんでした。「すべて 開いています」とは 書きません ──
          読めていないのに そう 書くと、嘘に なるからです。
        </p>
      ) : rows.length === 0 ? (
        <p style={{ marginTop: 16, fontSize: "0.8125rem", color: C.inkSoft }}>{NONE_LINE}</p>
      ) : (
        <div style={{
          marginTop: 16, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${C.line}`, background: C.card
        }}>
          {rows.map((r, i) => (
            <div key={r.key} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`
            }}>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.title || r.key}</span>
                {r.note ? (
                  <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.8, marginTop: 3 }}>
                    {r.note}
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                {stateWord(r.state)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{OPEN_HEAD}</p>
        {OPEN_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.9 }}>
            {["①", "②", "③", "④"][i]} {l}
          </p>
        ))}
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9, marginTop: 10 }}>
          {NO_COUNT_NOTE}
        </p>
      </div>
    </main>
  );
}
