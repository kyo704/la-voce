// ============================================================================
// ★緊急の 連絡先（★2026-09-25・第1段・束6）
//
//   ★見本 `P_kinkyu`（★design-v51）。
//
//   ★★★番号を 覚えません。★画面を 出る とき 捨てます。
//     ★★見本 ──「この 画面を 離れると、また 隠れます。」
//   ★★★台帳を 呼ぶ 前に 確かめの 字を 出します。
//     ★★呼んだ 時点で 記録が 残ります。★「押したら 残った」に しません。
//   ★★守りは 台帳が します。★画面は 隠すだけ です ── ★どちらも 要ります。
// ============================================================================
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  READ_FN, REASONS, isReason, TITLE, BACK_TO,
  NO_RIGHT_HEAD, NO_RIGHT_SUB, NO_CONTACT_HEAD, NO_CONTACT_SUB,
  BEFORE_LINE, BTN_SHOW, ASK_HEAD, ASK_LINES,
  TEL_HEAD, TEL_HIDE_LINE, READS_HEAD, READS_EMPTY, errorLine, NOTE_LINES
} from "@/lib/kinkyuRenrakusaki";

export default function KinkyuRenrakusaki({
  kidId, kidName, koenTitle, mayManage, hasContact, reads, onBack
}) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [tel, setTel] = useState(null);
  const [err, setErr] = useState("");

  // ★★★画面を 出る とき 捨てます。★見本の 約束 です。
  useEffect(() => () => setTel(null), []);

  async function 見る() {
    if (!isReason(reason)) { setErr(errorLine("REASON_REQUIRED")); return; }
    const supabase = createClient();
    // ★★台帳が 返す 前に 記録を 書きます。★書けなければ 返りません。
    const { data, error } = await supabase.rpc(READ_FN, {
      p_kid: kidId, p_reason_kind: reason
    });
    if (error) { setErr(errorLine(error.message)); setAsking(false); return; }
    setErr(""); setAsking(false); setTel(data || "");
  }

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 11px" }}>
        {(kidName || "") + "　／　" + (koenTitle || "")}
      </p>

      {!mayManage ? (
        <div style={{ padding: "18px 8px" }}>
          <p style={{ fontSize: "0.9375rem", color: C.ink }}>{NO_RIGHT_HEAD}</p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 4 }}>{NO_RIGHT_SUB}</p>
        </div>
      ) : !hasContact ? (
        <div style={{ padding: "18px 8px" }}>
          <p style={{ fontSize: "0.9375rem", color: C.ink }}>{NO_CONTACT_HEAD}</p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 4 }}>{NO_CONTACT_SUB}</p>
        </div>
      ) : tel != null ? (
        <div>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>{TEL_HEAD}</p>
          <p style={{
            fontSize: "1.5rem", fontWeight: 700, letterSpacing: ".04em",
            color: C.ink, margin: "6px 0 4px"
          }}>{tel}</p>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>{TEL_HIDE_LINE}</p>
        </div>
      ) : asking ? (
        /* ★★確かめ ── ★呼ぶ 前に、★何が 起きるかを ぜんぶ 言います。 */
        <div style={{
          padding: "13px 15px", borderRadius: 10,
          background: C.paper, border: `1px solid ${C.line}`
        }}>
          <p style={{ fontSize: "0.9375rem", color: C.ink, fontWeight: 600 }}>{ASK_HEAD}</p>
          <div style={{ marginTop: 6 }}>
            {ASK_LINES.map((l, i) => (
              <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
            ))}
          </div>
          {/* ★★わけを 選ばせます。★記録に 残る ため です。 */}
          <Box style={{ marginTop: 10 }}>
            {REASONS.map((r, i) => (
              <button key={r.key} type="button" onClick={() => setReason(r.key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
                  border: "none", background: "none", textAlign: "left",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
                }}>
                <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.label}</span>
                <span style={{
                  display: "inline-block", width: 17, height: 17, borderRadius: "50%",
                  border: `1.6px solid ${reason === r.key ? C.curtain : C.line}`,
                  background: reason === r.key ? C.curtain : "transparent",
                  boxShadow: reason === r.key ? `inset 0 0 0 3px ${C.card}` : "none"
                }} />
              </button>
            ))}
          </Box>
          <button type="button" onClick={見る}
            style={{
              display: "block", width: "100%", minHeight: 44, marginTop: 11,
              borderRadius: 10, border: "none", background: C.curtain,
              color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
            }}>{BTN_SHOW}</button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9, marginBottom: 9 }}>
            {BEFORE_LINE}
          </p>
          <button type="button" onClick={() => setAsking(true)}
            style={{
              minHeight: 44, padding: "0 16px", borderRadius: 10, border: "none",
              background: C.curtain, color: C.onCurtain,
              fontSize: "0.9375rem", cursor: "pointer"
            }}>{BTN_SHOW}</button>
        </div>
      )}

      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 10, lineHeight: 1.85 }}>{err}</p>
      ) : null}

      {/* ★★見た 記録 ── ★役割 だけ。★名前は 台帳にも ありません。 */}
      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "16px 0 6px", fontWeight: 600 }}>
        {READS_HEAD}
      </p>
      {!reads || reads.length === 0 ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>{READS_EMPTY}</p>
      ) : (
        <Box>
          {reads.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, padding: "11px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`
            }}>
              <span style={{ fontSize: "0.8125rem", color: C.ink }}>{r.viewer_role_at}</span>
              <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{r.viewed_at}</span>
            </div>
          ))}
        </Box>
      )}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.inkSoft : C.ink, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
