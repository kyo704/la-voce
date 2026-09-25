// ============================================================================
// ★希望が まだの方（★2026-09-25・C群 束2）
//
//   ★見本 `P_wariMada`（★design-v51）。
//
//   ★★★催促しません。★「あと◯人」も、★待った 日数も 出しません。
//     ★並べ替えは 名簿の 順 です。★決めは `lib/wariMada.js` に 書いて あります。
//   ★★希望の 中身（どの コマか）は 引きません。★要らない もの を 運びません。
// ============================================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  COLS_PREF_WHO, TITLE, BACK_TO, stillWaiting, subLine,
  ROW_ACTION, EMPTY_LINE, NOTE_LINES
} from "@/lib/wariMada";

export default function WariMada({ roundId, roundName, roster, onOpenSlots, onBack }) {
  const [prefs, setPrefs] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!roundId) { setPrefs([]); return; }
    const supabase = createClient();
    const { data, error } = await supabase.from("lesson_prefs")
      .select(COLS_PREF_WHO).eq("round_id", roundId);
    // ★★読めなかった ときに「みなさん 出して います」と 書きません。
    //   ★★★誰も 出して いない ことに なり、★逆の 嘘に なります。
    if (error) { setErr("希望を 読めませんでした。"); setPrefs(null); return; }
    setErr("");
    setPrefs(data || []);
  }, [roundId]);

  useEffect(() => { void load(); }, [load]);

  const list = prefs === null ? null : stillWaiting(roster, prefs);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      {list !== null ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 10px" }}>
          {subLine(list.length, roundName)}
        </p>
      ) : null}

      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, lineHeight: 1.85 }}>{err}</p>
      ) : list === null ? null : list.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : (
        <Box>
          {list.map((r, i) => (
            <button key={r.user_id} type="button"
              onClick={() => onOpenSlots && onOpenSlots(r.user_id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
                border: "none", background: "none", textAlign: "left",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                cursor: "pointer"
              }}>
              <span>
                <span style={{ display: "block", fontSize: "0.875rem", color: C.ink }}>{r.name}</span>
                {r.sub ? (
                  <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2 }}>
                    {r.sub}
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                {ROW_ACTION}
              </span>
            </button>
          ))}
        </Box>
      )}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.8125rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
