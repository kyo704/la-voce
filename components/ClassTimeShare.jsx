"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_SHARE, isSharing, nextShares, shareWord,
  TT_HEAD, TT_WARN, TT_TOGGLE, TT_TOGGLE_SUB, TT_NOTE
} from "@/lib/timetableShare";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★授業の 時間を 出す ── ★見本 `SC['授業の時間を出す']`
//   ★出どころ 裁定183 P2
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//
//   ★★★既定は 出しません。★行が 無い とき＝ 出して いません。
//   ★★★何を 出すかを 選ばせません。★真偽 1つ だけ です。
//     ★選べる ように すると、★「科目名も 出す」が いつか 足されます。
//   ★★★やめた ことを 学校に 知らせません。★催促も しません。
//
//   ★★★名前に `Timetable` を 使いません（★2026-09-24）。
//     ★`components/tests/ops-export.test.js` ⑨ が「時間割の 画面は 1枚 だけ」を 見ます。
//     ★★同じ 決めを 2か所に 置かない ための 見張り です。★正しい 見張り です。
//     ★★★この 画面は 時間割を **直す** ものでは ありません ──
//       ★「学校に 出すか 出さないか」の 1つ だけ を 持ちます。
//       ★★けれど 名前で 見分ける 見張り なので、★こちらが 名前を 譲ります。
//
//   ★見張り components/tests/timetable-understudy-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function ClassTimeShare({ supabase, userId, orgId }) {
  const [row, setRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !userId || !orgId) return;
    try {
      const { data, error: e } = await supabase.from("timetable_share")
        .select(COLS_SHARE).eq("user_id", userId).eq("org_id", orgId).limit(1);
      if (e) throw e;
      setRow((data || [])[0] || null);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, userId, orgId]);

  useEffect(() => { 読む(); }, [読む]);

  const 切り替える = useCallback(async () => {
    if (!supabase || !userId || !orgId) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("timetable_share").upsert({
        user_id: userId, org_id: orgId, shares: nextShares(row),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,org_id" });
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, userId, orgId, row, 読む]);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(TT_HEAD)}</h2>

      <div style={{
        background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
        padding: rem(12), marginBottom: rem(10), ...TYPE.li
      }}>
        {TT_WARN.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>

      <button type="button" onClick={切り替える} disabled={busy}
        style={{
          width: "100%", minHeight: 44, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: rem(8), textAlign: "left",
          padding: `${rem(10)} ${rem(12)}`, background: C.card,
          border: `1px solid ${C.line}`, borderRadius: 12, color: C.ink,
          fontFamily: FONT_STACK, ...TYPE.li
        }}>
        <span>
          {tx(TT_TOGGLE)}
          <span style={{ ...小, display: "block" }}>{tx(TT_TOGGLE_SUB)}</span>
        </span>
        <span style={{ color: isSharing(row) ? C.curtain : C.inkSoft }}>
          {tx(shareWord(row))}
        </span>
      </button>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {TT_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
