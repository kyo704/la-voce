import { createAdminClient } from "@/lib/supabase/admin";
import { incidentTestSubject, incidentTestBody } from "@/lib/incidentNotice";

// ============================================================================
// ★★★障害の お知らせの 道を、★1通 送って 確かめます（★訓練・2026-09-23）
//
//   ★出どころ  docs/様式/障害の連絡_訓練_2026-09-23.md ③「★実際に 届くか」
//   ★★坂本さんの お決め（2026-09-23）──
//     「訓練の 目的は『仕組みが 実際に 動くか』の 検証です。
//       ★手動 送信では、★本番で 使う 経路そのものが 検証されません」
//
//   ★★★だから、★**本番で 使う のと 同じ 道**を 通します ──
//     `incident_recipients()`（★サーバだけ）→ Resend
//
//   ★★★これは 訓練 です。★本物の 障害の お知らせでは ありません。
//     ★件名と 本文に、★はっきり「訓練」と 書きます（`lib/incidentNotice.js`）。
//     ★★読んだ 方が 慌てない ように。
//
//   ★★★送れて はじめて、★`org_contacts.verified_at` に 日を 入れます。
//     ★送る 前に 入れません。★届いて いない ものを「届いた」と 記録しません。
//     ★★ただし ── ★Resend が 受け取った、までしか 分かりません。
//       ★★受信箱に 入ったか は、★人が 見る しか ありません（★迷惑メールも 含めて）。
//       ★★★だから `verified_at` は「★送る 道が 通った 日」です。★そう 書いて あります。
//
//   ★合言葉が 無ければ 503。★cron と 同じ 形（★fail closed）。
//
//   ★見張り components/tests/incident-test-route.test.js
// ============================================================================

export const dynamic = "force-dynamic";

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。訓練の送信を実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;
  if (!apiKey || !from) {
    return Response.json({ ok: false, reason: "メールの設定がありません。" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("incident_recipients");
  if (error) {
    console.error("★宛先を 読めませんでした:", error);
    return Response.json({ ok: false, reason: error.message }, { status: 500 });
  }
  const 宛 = Array.isArray(data) ? data : [];
  if (宛.length === 0) {
    // ★★宛先が 無い ことは、★誤りでは ありません。★けれど 訓練に なりません。
    return Response.json({ ok: false, sent: 0, reason: "宛先が ありません。" }, { status: 200 });
  }

  // ★★同じ 住所が いくつも ある ことが あります（★7学校 とも 同じ 方、など）。
  //   ★★1人に 7通 送りません。★住所で まとめます。
  const 住所ごと = new Map();
  宛.forEach((x) => {
    const k = String(x.email || "").toLowerCase();
    if (!k) return;
    if (!住所ごと.has(k)) 住所ごと.set(k, { email: x.email, orgs: [], 字: [] });
    住所ごと.get(k).orgs.push(x.org_name || "");
    if (!住所ごと.get(k).字.includes(x.email)) 住所ごと.get(k).字.push(x.email);
  });

  const 結 = { ok: true, sent: 0, failed: 0, addresses: 住所ごと.size, orgs: 宛.length };
  const 送れた = [];
  for (const [, v] of 住所ごと) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: v.email,
          subject: incidentTestSubject(),
          text: incidentTestBody(v.orgs)
        })
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error("★送れませんでした:", res.status, detail.slice(0, 200));
        結.failed += 1;
        continue;
      }
      結.sent += 1;
      v.字.forEach((e) => 送れた.push(e));
    } catch (e) {
      console.error("★送れませんでした:", e && e.message);
      結.failed += 1;
    }
  }

  // ★★★送れた 住所 だけ に、★日を 入れます。
  if (送れた.length > 0) {
    const { error: e2 } = await admin.from("org_contacts")
      .update({ verified_at: new Date().toISOString() })
      .eq("kind", "incident").in("email", 送れた);
    if (e2) console.error("★確かめた 日を 残せませんでした:", e2);
  }
  結.ok = 結.failed === 0;
  return Response.json(結);
}
