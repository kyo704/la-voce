// ============================================================================
// ★配る ── ★公演の くばりもの（★2026-09-25・C群 第1段）
//
//   ★見本 `P_haifu`（★design-v51・PC・iPad 運営）。
//
//   ★★鍵（`koen`）は 呼ぶ 側が 見ます ── ★`KoenArea` の 型に 合わせます。
//   ★★字と 決めは `lib/koenHaifu.js` が 持ちます。★ここでは 決めません。
//
//   ★★★「読んだかどうか」を 1度も 引きません。★引く 道も ありません。
//     ★台帳の `export_log` は 出した 側の 記録 だけ です。
// ============================================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  RECORD_FN, LOG_TABLE, COLS_EXPORT_LOG, TITLE, SUB,
  BTN_ADD, NOTE_LINES, EMPTY_LINE, sharedWord, sortShared, mayShare, CAN_SHARE
} from "@/lib/koenHaifu";

export default function KoenHaifu({ orgId, koenTitle, onBack }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!orgId) { setRows([]); return; }
    const supabase = createClient();
    const { data, error } = await supabase.from(LOG_TABLE)
      .select(COLS_EXPORT_LOG).eq("org_id", orgId).limit(50);
    // ★★読めなかった ときは「まだ 配って いません」と 書きません。
    //   ★★★それは 嘘に なり得ます。★読めなかった と 書きます。
    if (error) { setErr("一覧を 読めませんでした。"); setRows([]); return; }
    setErr("");
    setRows(sortShared(data || []));
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  async function share(what) {
    // ★★配れる ものか、★台帳に 触る 前に 見ます。
    if (!mayShare(what)) { setErr("配れるのは " + CAN_SHARE.join("・") + " です。"); return; }
    setBusy(true);
    const supabase = createClient();
    // ★★`record_export` を 通ります。★中で `memberships` を 確かめます。
    //   ★`export_log` に 直に 書く 道は ありません。
    const { error } = await supabase.rpc(RECORD_FN, {
      p_org_id: orgId, p_what: what, p_rows: 1
    });
    setBusy(false);
    if (error) { setErr("配れませんでした。"); return; }
    setErr("");
    await load();
  }

  return (
    <div>
      <Back onClick={onBack}>{koenTitle || "公演"}</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 10px" }}>{SUB}</p>

      {rows === null ? null : rows.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : (
        <Box>
          {rows.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, padding: "12px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`
            }}>
              <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.what}</span>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                {sharedWord(r.created_at)}
              </span>
            </div>
          ))}
        </Box>
      )}

      {/* ★★配れる ものを 札で 出します。★自由に 打たせません ──
          ★★★打てる ように すると、★楽譜の 名を 入れられます。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        {CAN_SHARE.map((k) => (
          <button key={k} type="button" disabled={busy} onClick={() => void share(k)}
            style={{
              minHeight: 44, padding: "0 13px", borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card,
              color: C.ink, fontSize: "0.8125rem", cursor: busy ? "default" : "pointer"
            }}>{BTN_ADD.replace("PDF", k)}</button>
        ))}
      </div>

      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 10, lineHeight: 1.85 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
