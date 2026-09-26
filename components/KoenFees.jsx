// ============================================================================
// ★参加費（★2026-09-26・D群・裁定201）
//
//   ★見本 `SC['参加費']`。
//   ★★字と 決めは `lib/koenFees.js` が 持ちます。★ここでは 決めません。
//
//   ★★★催促の 道を 作りません ── ★「まだ」の 方に 出す 札も、色も、印も ありません。
//     ★★赤く しません。★並べ替えて 上に 出しません。★数えて 責めません。
//   ★★★「ひとり」は ぜんぶ 同じ 額の ときだけ 出します。★平均を 作りません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, HEAD_EACH, HEAD_PAID, HEAD_YET, LIST_HEAD,
  markOf, paidDayOf, paidCount, yetCount, eachYen, yen, people,
  NOTES, NOTES_STRONG
} from "@/lib/koenFees";

const box = {
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
};
const 行 = (i) => ({
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 12, padding: "11px 13px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`
});

export default function KoenFees({ koenTitle, memberCount, rows, onToggle, onBack }) {
  const 列 = Array.isArray(rows) ? rows : [];
  const ひとり = eachYen(列);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      {koenTitle || memberCount ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 10px" }}>
          {[koenTitle, memberCount ? `出演者 ${people(memberCount)}` : ""]
            .filter(Boolean).join("　／　")}
        </p>
      ) : null}

      <div style={box}>
        {/* ★★ぜんぶ 同じ 額の ときだけ 出します（★平均を 作りません）。 */}
        {ひとり !== null ? (
          <div style={行(0)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_EACH}</span>
            <span style={{ fontSize: "0.9375rem", color: C.ink, fontWeight: 700 }}>
              {yen(ひとり)}
            </span>
          </div>
        ) : null}
        <div style={行(ひとり === null ? 0 : 1)}>
          <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_PAID}</span>
          <span style={{ fontSize: "0.875rem", color: C.ink }}>{people(paidCount(列))}</span>
        </div>
        <div style={行(1)}>
          {/* ★★「まだ」を 赤く しません。★色で 責めません。 */}
          <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_YET}</span>
          <span style={{ fontSize: "0.875rem", color: C.ink }}>{people(yetCount(列))}</span>
        </div>
      </div>

      <p style={{ fontSize: "0.8125rem", color: C.ink, fontWeight: 600, margin: "15px 0 6px" }}>
        {LIST_HEAD}
      </p>
      <div style={box}>
        {列.map((r, i) => (
          <button key={r.id || i} type="button"
            onClick={() => onToggle && onToggle(r, !r.paid_on)}
            style={{
              ...行(i), width: "100%", border: "none",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
              background: "transparent", textAlign: "left", cursor: "pointer"
            }}>
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.member_name_at || ""}</span>
              {/* ★★いただいた 日。★無ければ 何も 出しません（★「—」で 埋めません）。 */}
              {paidDayOf(r) ? (
                <span style={{
                  display: "block", fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.8
                }}>{paidDayOf(r)}</span>
              ) : null}
            </span>
            <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
              {markOf(r)} ›
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {NOTES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", lineHeight: 1.9,
            color: NOTES_STRONG.includes(i) ? C.ink : C.inkSoft,
            fontWeight: NOTES_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
