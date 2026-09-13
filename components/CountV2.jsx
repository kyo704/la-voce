"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem } from "@/lib/uiKit";
import { H3, Card, Kv, Note, Li, Back, Btn } from "@/components/UiV2";
import { USUAL_ROWS, usualOf, writtenDays, histogramOf, detailedCountsOf } from "@/lib/countView";
import { isAlwaysFree } from "@/lib/freeTier";
import { viewerOf } from "@/lib/entitlements";

// ============================================================================
// かぞえる（見本⑭ ／ 2026-09-09）
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑭
//     「★あなたのふだん・数えるだけ」
//     「★まんなかの値です。★くらべる先は、あなた自身です。
//      　★よその目安は 出しません。」
//
//   ★★数えるだけです。★良し悪しを 言いません。
//   ★★よそと くらべません。★平均も、★目安も、★基準値も 出しません。
//   ★★点数・順位・信号色・％・進捗を、★1つも 出しません。
//
//   ★★11月の 項目は 置きません（★査読 §9-2）。
//     ★週ごとに まとめる／去年の 今ごろ／季節の 1枚
//     ★見本⑭では 灰色で 出ていますが、★押しどころを 先に 出しません。
//
//   ★数と 決めは lib/countView.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/count-view.test.js
// ============================================================================

/** ★単位に あわせて 言葉に します。★数だけを 裸で 出しません。 */
function word(unit, v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (unit === "hours") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return `${h}時間${String(m).padStart(2, "0")}分`;
  }
  if (unit === "clock") {
    const t = v >= 24 ? v - 24 : v;
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    return `${h}時${String(m).padStart(2, "0")}分`;
  }
  if (unit === "minutes") {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return h === 0 ? `${m}分` : `${h}時間${String(m).padStart(2, "0")}分`;
  }
  return String(v);
}

export default function CountV2({ entries, dates, todayISO, profile, userEmail, isPaidOverride }) {
  const [detail, setDetail] = useState(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [localPaid, setLocalPaid] = useState(false);
  const [showFoldedNote, setShowFoldedNote] = useState(false);

  // ★テスター / 無料全解放 / 支払済み判定
  const email = String(userEmail || profile?.email || "").trim().toLowerCase();
  const isPaidAccount = localPaid || isPaidOverride || isAlwaysFree(profile) ||
    ["kyo0703opera@gmail.com", "kyo0703opera+forcode@gmail.com"].includes(email) ||
    profile?.is_tester === true ||
    viewerOf(profile) === "tester";

  // ★「あなたのふだん」：minDays=1 を渡してデータがあれば1日分でも表示
  const rows = USUAL_ROWS
    .map((r) => ({ ...r, got: usualOf(entries, dates, r.key, todayISO, 1) }))
    .filter((r) => r.got);
  const written = writtenDays(entries, dates);
  const hist = histogramOf(entries, dates, "dinnerToBed");
  const maxCount = hist ? Math.max(...hist.bars.map((b) => b.count), 1) : 1;

  // ★詳しく数えるの有料用データ
  const detailedRows = detailedCountsOf(entries, dates);

  // Stripe 支払い画面への遷移ハンドラ
  const handleStartStripe = async () => {
    setIsCheckoutLoading(true);
    setLocalPaid(true); // 即時有料表示をオン
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" })
      });
      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (e) {
      console.error("Stripe checkout error:", e);
    } finally {
      setIsCheckoutLoading(false);
      setDetail(null);
    }
  };

  if (rows.length === 0 && !hist && written === 0) {
    return (
      <Card>
        <p style={{ ...TYPE.li, color: C.inkSoft, lineHeight: 1.9, margin: 0 }}>
          まだ、数える ものが ありません。<br />
          記録が 10日ぶん たまると、あなたの 普段の 値が 出ます。
        </p>
      </Card>
    );
  }

  // 「調べる」画面
  if (detail === "investigate") {
    return (
      <div>
        <Back onClick={() => setDetail(null)}>かぞえる</Back>
        <h2 style={{ ...TYPE.h2, margin: "5px 0 10px" }}>調べる</h2>
        <Card>
          <div style={{ ...TYPE.lead }}>くらべる・かぞえるを、<br />もっと こまかく 見られます。</div>
          <div style={{ ...TYPE.usual, marginTop: 9, lineHeight: 1.9 }}>
            ・本番の 前の3日だけを 数える<br />
            ・出づらかった日の 普段<br />
            ・曜日ごとの 普段<br />
            ・調べることを 5つまで 選ぶ
          </div>
        </Card>
        <Card>
          <Kv right="580円（税込）">ひと月ごと</Kv>
          <Kv right="5,800円（税込）" last>1年ぶん まとめて</Kv>
        </Card>
        <div style={{ ...TYPE.note, background: "#F6EFDF", borderRadius: 12, padding: 11, lineHeight: 1.8 }}>
          記録・並べる・さかのぼる・ノート・ひつじ・受診用の 1枚は、これからも 無料です。<br />
          安全に かかわるものに、お金を いただきません。
        </div>
        <Btn onClick={handleStartStripe} style={{ marginTop: 11 }}>
          {isCheckoutLoading ? "処理中..." : "はじめる"}
        </Btn>
        <Btn ghost onClick={() => setDetail(null)} style={{ marginTop: 8 }}>いまは やめておく</Btn>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowFoldedNote((v) => !v)}
            style={{
              background: "none", border: "none", color: C.curtain,
              fontSize: rem(13), padding: "6px 0", cursor: "pointer", textDecoration: "underline"
            }}>
            {showFoldedNote ? "閉じる" : "くわしい 決まりを 見る"}
          </button>
          {showFoldedNote ? (
            <div style={{ ...TYPE.note, marginTop: 6, lineHeight: 1.8 }}>
              戻ると、元の場所に 帰ります（1画面だけ）。催促を しません。<br />
              いつでも 解約・変更が 可能です。
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // 「詳しい決まり」画面
  if (detail === "rules") {
    return (
      <div>
        <Back onClick={() => setDetail(null)}>かぞえる</Back>
        <h2 style={{ ...TYPE.h2, margin: "5px 0 10px" }}>詳しい決まり</h2>
        <Card>
          <div style={{ ...TYPE.lead }}>記録と利用の 決まり</div>
          <div style={{ ...TYPE.usual, marginTop: 9, lineHeight: 1.95 }}>
            ・通信の失敗等で 記録を 勝手に消しません<br />
            ・基本機能（記録・並べる・さかのぼる・ノート・ひつじ・受診用の1枚）は これからも永久無料です<br />
            ・よその人と 比べたり、評価を 出したり しません<br />
            ・有料機能（調べる）は いつでも 解約・停止が 可能です
          </div>
        </Card>
        <Card>
          <Kv right="無料">記録・並べる・さかのぼる・ノート</Kv>
          <Kv right="無料">ひつじの部屋・受診用の1枚</Kv>
          <Kv right="580円／月（または年額）" last>詳しく数える（調べる）</Kv>
        </Card>
        <Btn ghost onClick={() => setDetail(null)} style={{ marginTop: 11 }}>閉じる</Btn>
      </div>
    );
  }

  return (
    <div>
      {/* ★★あなたの ふだん。★1つも 出せなければ、★枠ごと 出しません。 */}
      {rows.length > 0 || written > 0 ? (
        <>
          <H3>あなたの ふだん</H3>
          <Card>
            {rows.map((r) => (
              <Kv key={r.key} right={word(r.unit, r.got.value)}>{r.label}</Kv>
            ))}
            <Kv right={`${written}日`} last>書いた日</Kv>
          </Card>
        </>
      ) : null}

      <Card onClick={() => setDetail("rules")} style={{ padding: "10px 12px", cursor: "pointer" }}>
        <div style={{ ...TYPE.usual, color: C.curtain }}>詳しい決まりを見る　›</div>
      </Card>

      {/* ★★分布（★見本⑭）。★数えるだけです。★多い・少ないを 言いません。 */}
      {hist ? (
        <Card>
          <div style={TYPE.mini}>
            食べ終えてから 寝るまで（{hist.n}日）
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 88, margin: "8px 0 3px" }}>
            {hist.bars.map((b) => (
              <div key={b.label} style={{
                flex: 1, background: C.curtain, borderRadius: "3px 3px 0 0",
                // ★★高さは 数から。★色は 1つ。★段で 変えません。
                height: `${Math.round((b.count / maxCount) * 100)}%`,
                minHeight: b.count > 0 ? 3 : 0
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {hist.bars.map((b) => (
              <span key={b.label} style={{ flex: 1, textAlign: "center", fontSize: rem(8.5), color: C.inkSoft }}>
                {b.label}
              </span>
            ))}
          </div>
          <div style={{ ...TYPE.usual, textAlign: "right" }}>時間</div>
        </Card>
      ) : null}

      <H3>詳しく 数える</H3>
      <Card>
        {detailedRows.map((r, i) => (
          <Li
            key={r.key}
            onClick={() => {
              if (!isPaidAccount) setDetail("investigate");
            }}
            right={
              isPaidAccount ? (
                <s style={{ color: C.ink, textDecoration: "none" }}>{r.value}</s>
              ) : (
                <span style={{ color: C.curtain }}>調べる</span>
              )
            }
            last={i === detailedRows.length - 1}>
            {r.label}
          </Li>
        ))}
      </Card>
      <Note>
        有料のものを <b>隠しません</b>。見せて、押せなくします。押したときだけ 案内へ。<br />
        札は「調べる」の 1語だけ。「PRO」「プレミアム」と 書きません。催促しません。<br />
        ％を 出しません。良い／悪いを 言いません。
      </Note>
    </div>
  );
}
