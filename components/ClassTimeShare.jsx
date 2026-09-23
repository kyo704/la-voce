"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  shareRows, showsOrgName, isSharing, nextShares, shareWord, shareHint,
  TT_HEAD, TT_WARN, TT_ONE_LABEL, TT_MANY_NOTE, TT_NOTE
} from "@/lib/timetableShare";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★授業の 時間を 出す ── ★見本 `SC['授業の時間を出す']`
//   ★出どころ 裁定183 P2 ／ 裁定140 ／ 裁定73 ／ sql/71
//     ／ woolsong-2026-09-21_3.zip ／ 00-動く見本-iPhoneで開く用.html
//
//   ★★★学校ごとに 決められます。★混ぜません（★裁定140）。
//     ★台帳が `(user_id, org_id)` の 組で 持って います。
//     ★★読むのは `my_timetable_share()`、★書くのは `set_timetable_share()`。
//     ★★★表を 直に 読みません。★「どの 学校に いるか」は 台帳が 決めます。
//
//   ★★★1校 だけの 方には、★学校の 名も 註も 出しません（★裁定73）。
//
//   ★★★2026-09-24 に 直しました。★前は「はじめの 1校 だけ」でした。
//     ★台帳は はじめから 学校ごとに 持って いました。★画面が 1つ しか 出して
//     ★いませんでした。★足りなかったのは `my_orgs()` だけ です。
//
//   ★見張り components/tests/timetable-understudy-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function ClassTimeShare({ supabase }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase) return;
    try {
      // ★★どの 学校に いるかも、★出して いるかも、★台帳が 返します。
      const { data, error: e } = await supabase.rpc("my_timetable_share");
      if (e) throw e;
      setRows(data || []);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase]);

  useEffect(() => { 読む(); }, [読む]);

  const 校 = useMemo(() => shareRows(rows), [rows]);
  const 名を出す = showsOrgName(校);

  const 切り替える = useCallback(async (r) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      // ★★書くのも 台帳の 道 です。★在籍して いない 学校には 書けません。
      const { error: e } = await supabase.rpc("set_timetable_share",
        { p_org: r.orgId, p_shares: nextShares(r) });
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, 読む]);

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

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {校.map((r) => (
          <button key={r.orgId} type="button" onClick={() => 切り替える(r)} disabled={busy}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: rem(8), textAlign: "left",
              padding: `${rem(10)} ${rem(12)}`, background: "transparent",
              border: "none", borderBottom: `1px solid ${C.line2}`,
              color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }}>
            <span>
              {/* ★★★1校 だけの ときは 学校の 名を 出しません（★裁定73）。 */}
              {名を出す ? r.name : tx(TT_ONE_LABEL)}
              <span style={{ ...小, display: "block" }}>{tx(shareHint(r))}</span>
            </span>
            <span style={{ color: isSharing(r) ? C.curtain : C.inkSoft }}>
              {tx(shareWord(r))}
            </span>
          </button>
        ))}
      </div>

      {/* ★★★2校 以上の ときだけ。★1校の 方に 出すと、★無い ものの 説明に なります。 */}
      {名を出す ? (
        <div style={{ ...小, marginTop: rem(9) }}>
          {TT_MANY_NOTE.map((l) => (
            <span key={l} style={{ display: "block" }}>{tx(l)}</span>
          ))}
        </div>
      ) : null}

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
