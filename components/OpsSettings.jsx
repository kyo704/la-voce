"use client";

import { C } from "@/lib/tokens";
import {
  rosterCount, monthlyFee, perHead, yen,
  TIERS, MONTHLY_FLOOR, SETUP_FEE, SETUP_FEE_FROM, YEARLY_FREE_MONTHS
} from "@/lib/orgRoster";

// ============================================================================
// 設定・ご請求 ── 見本⑤（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ⑤
//
//   ★★この画面が 見られないもの（★見本⑤の 下の 欄）
//     ★生徒の 声の記録　　★画面が ありません
//     ★生徒の からだの記録★画面が ありません
//     ★生徒の ノート　　　★画面が ありません
//   ★★「見せない」では ありません。★画面が 無い、です。
//     ★だから、★ここに その旨を 書けます。★嘘に なりません。
//
//   ★★お金の 決めは lib/orgRoster.js が 持ちます。★ここでは 決めません。
//     ★料金の 表も、★その lib から 組み立てます。
//     ★★書き写すと、★値上げの ときに 片方だけ 直ります。
//
//   ★見張り components/tests/org-roster.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "9px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" };

/** ★この画面から 見られないもの。★§3-3 の 一文を、★1つずつ。 */
const NOT_HERE = [
  "生徒の 声の記録",
  "生徒の からだの記録",
  "生徒の ノート"
];

export default function OpsSettings({ members, staffLines }) {
  const n = rosterCount(members);
  const fee = monthlyFee(n);

  return (
    <div className="space-y-3">
      <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>設定・ご請求</h2>

      {/* ★★いまの ご請求。★数えるだけです。 */}
      <div style={card}>
        <div style={{ ...row, borderTop: "none" }}>
          <span style={{ color: C.inkSoft }}>数える人数</span>
          <span style={{ color: C.ink }}>{n}人</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>1人あたり</span>
          <span style={{ color: C.ink }}>{n > 0 ? `${yen(perHead(n))}円` : "—"}</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>今月のご請求</span>
          <span style={{ color: C.ink }}>{yen(fee)}円</span>
        </div>
      </div>

      {/* ★★料金の 決まり。★lib から 組み立てます。★書き写しません。 */}
      <div style={card}>
        <p style={{ ...small, marginBottom: 2 }}>料金の 決まり</p>
        {TIERS.map((tr, i) => (
          <div key={tr.rate} style={row}>
            <span style={{ color: C.inkSoft }}>
              {i === 0 ? "名簿1人あたり" : `名簿${tr.min}人以上`}
            </span>
            <span style={{ color: C.ink }}>月 {yen(tr.rate)}円</span>
          </div>
        ))}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>月額の下限</span>
          <span style={{ color: C.ink }}>{yen(MONTHLY_FLOOR)}円</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>初期費用（名簿{SETUP_FEE_FROM}人以上）</span>
          <span style={{ color: C.ink }}>{yen(SETUP_FEE)}円</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>年の一括前払い</span>
          <span style={{ color: C.ink }}>{YEARLY_FREE_MONTHS}か月分を引きます</span>
        </div>
        {/* ★★数えない人を、★はっきり 書きます（★§10）。
            ★あとから「先生も 数えられていた」と ならないためです。 */}
        <div style={row}>
          <span style={{ color: C.inkSoft }}>先生・事務の方</span>
          <span style={{ color: C.ink }}>何人でも 数えません</span>
        </div>
        <div style={row}>
          <span style={{ color: C.inkSoft }}>休会中の方</span>
          <span style={{ color: C.ink }}>数えません</span>
        </div>
      </div>

      {/* ★★人の 割り（★見本⑤）。★呼ぶ側が 渡します。 */}
      {(staffLines || []).length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 2 }}>人の 割り</p>
          {staffLines.map((s) => (
            <div key={s.key || s.name} style={row}>
              <span style={{ color: C.ink }}>{s.name}</span>
              <span style={small}>{s.note}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ★★この画面から 見られないもの（★見本⑤）。
          ★★「見せない」では なく「画面が ありません」。★そう 書けます。 */}
      <div style={card}>
        <p style={{ ...small, marginBottom: 2 }}>この画面から 見られないもの</p>
        {NOT_HERE.map((x) => (
          <div key={x} style={row}>
            <span style={{ color: C.ink }}>{x}</span>
            <span style={small}>★画面が ありません</span>
          </div>
        ))}
      </div>
    </div>
  );
}
