"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_MEMBER, canEditKoen } from "@/lib/koenCast";
import {
  codeParts, countMembers, isFull, nextTier, tierDiff, isFreeTier, yen,
  INVITE_CODE_HEAD, INVITE_CODE_BEFORE, INVITE_CODE_MAKE, INVITE_CODE_HOW,
  INVITE_CODE_CLOSE, INVITE_ROSTER_HEAD, INVITE_MONEY_HEAD, INVITE_NOW,
  INVITE_CAP, INVITE_FREE, INVITE_ROOM, INVITE_NEED_UP, INVITE_NEED_UP2,
  INVITE_DIFF, INVITE_SEE_PRICE, INVITE_NEXT, INVITE_DONE, INVITE_NOTE
} from "@/lib/koenInvite";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★出演者を 招く ── ★見本 `P_koenInvite`
//   ★出どころ 裁定141 ／ 裁定148 ／ sql/67
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★決めは `lib/koenInvite.js` が 持ちます。★段と 金額は **台帳** が 持ちます。
//
//   ★★★名簿は `koen_invitable` から 引きます（sql/67）。
//     ★学校の 公演の ときだけ 並びます。★市民オペラでは 0行 ── ★合言葉を 使います。
//     ★★見本は 3人の 決め打ち でした。★台帳に 無かった からです。
//
//   ★★★招かれた 方の 体の 記録は 1つも 出しません（★裁定141）。
//     ★この 画面は `entries` を 読みません。★読む 形も ありません。
//
//   ★見張り components/tests/koen-invite-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: `${rem(7)} 0`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};

export default function KoenInvite({ supabase, koen, onNext, onSeePrice }) {
  const [members, setMembers] = useState([]);
  const [code, setCode] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 直せる = canEditKoen(koen);

  const 読む = useCallback(async () => {
    if (!supabase || !koen) return;
    try {
      const [{ data: me }, { data: st }, { data: iv }] = await Promise.all([
        supabase.from("koen_members").select(COLS_MEMBER).eq("koen_id", koen.id),
        supabase.rpc("koen_code_status", { p_koen: koen.id }),
        supabase.rpc("koen_invitable", { p_koen: koen.id })
      ]);
      setMembers(me || []);
      setCode(((st || [])[0] || {}).code || null);
      setRoster(iv || []);
      // ★★段と 金額は 台帳から。★ここで 数字を 作りません。
      const 数 = countMembers(me || []);
      const { data: tp } = await supabase.rpc("koen_tier_price", { p_people: Math.max(1, 数) });
      const { data: tp2 } = await supabase.rpc("koen_tier_price", { p_people: Math.max(1, 数 + 1) });
      setTiers([...(tp || []), ...(tp2 || [])].filter(
        (t, i, a) => a.findIndex((x) => x.tier === t.tier) === i));
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, koen]);

  useEffect(() => { 読む(); }, [読む]);

  const 人 = useMemo(() => countMembers(members), [members]);
  const 段 = koen ? Number(koen.tier_people) || 0 : 0;
  const 満 = isFull(人, 段);
  const 差 = useMemo(() => tierDiff(tiers, 段, 人 + 1), [tiers, 段, 人]);

  const 招く = useCallback(async (id, name) => {
    if (!supabase || !koen) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_members")
        .insert({ koen_id: koen.id, user_id: id, name_at: name, part: "cast" });
      if (e) throw e;
      setWord(name + tx(INVITE_DONE));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 読む]);

  if (!koen) return null;
  const 切 = codeParts(code);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx("出演者を 招く")}</h2>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...札, flex: 1.2, minWidth: 290 }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(INVITE_CODE_HEAD)}</div>
          {code ? (
            <>
              <div className="ff-mono" style={{
                fontSize: rem(26), letterSpacing: ".18em", margin: `${rem(6)} 0 ${rem(4)}`
              }}>{切.join(" ")}</div>
              <div style={小}>
                {tx(INVITE_CODE_HOW)}
                <br />
                {段}{tx(INVITE_CODE_CLOSE)}。
              </div>
            </>
          ) : (
            <div style={{ ...小, marginBottom: rem(10) }}>{tx(INVITE_CODE_BEFORE)}</div>
          )}

          <div style={{ ...TYPE.h3 }}>{tx(INVITE_ROSTER_HEAD)}</div>
          {roster.length === 0 ? (
            <div style={小}>{tx("名簿から 招ける方は いません。合言葉を 使って ください。")}</div>
          ) : roster.map((r) => (
            <div key={r.user_id} style={行}>
              <span>{r.name}</span>
              {r.already ? (
                <span style={小}>{tx("もう 入って います")}</span>
              ) : 直せる ? (
                <button type="button" disabled={busy || 満}
                  onClick={() => 招く(r.user_id, r.name)}
                  style={{
                    minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                    border: `1px solid ${C.line}`, background: C.card, color: C.curtain,
                    fontFamily: FONT_STACK, opacity: 満 ? 0.5 : 1, ...TYPE.usual
                  }}>{tx("招く")}</button>
              ) : null}
            </div>
          ))}
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(INVITE_MONEY_HEAD)}</div>
          <div style={行}>
            <span>{tx(INVITE_NOW)}</span>
            <span style={{ color: C.ink, fontWeight: 700 }}>{人}{tx("人")}</span>
          </div>
          <div style={行}>
            <span>{tx(INVITE_CAP)}</span>
            <span>{段}{tx("人")}（{yen((tiers.find((t) => t.tier === 段) || {}).yen || 0)}）</span>
          </div>
          {満 && 差 ? (
            <>
              <div style={{
                background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
                padding: rem(12), marginTop: rem(10), ...TYPE.li
              }}>
                {tx(INVITE_NEED_UP)}{差.to.tier}{tx(INVITE_NEED_UP2)}
                <br />
                {tx(INVITE_DIFF)}{yen(差.yen)}{tx("です。")}
              </div>
              {onSeePrice ? (
                <button type="button" onClick={onSeePrice}
                  style={{
                    minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13, marginTop: rem(10),
                    border: "none", background: C.curtain, color: C.onCurtain,
                    fontFamily: FONT_STACK, fontWeight: 700, ...TYPE.li
                  }}>{tx(INVITE_SEE_PRICE)}</button>
              ) : null}
            </>
          ) : (
            <div style={{ ...小, marginTop: rem(8) }}>
              {isFreeTier(tiers, 段) ? tx(INVITE_FREE) : tx(INVITE_ROOM)}
            </div>
          )}
        </div>
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {onNext ? (
        <div style={{ marginTop: rem(12) }}>
          <button type="button" onClick={onNext}
            style={{
              minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13, border: "none",
              background: C.curtain, color: C.onCurtain, fontFamily: FONT_STACK,
              fontWeight: 700, ...TYPE.li
            }}>{tx(INVITE_NEXT)}</button>
        </div>
      ) : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。
          ★3行目は 約束 です ── ★体調の 記録は 制作にも 舞台監督にも 見えません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {INVITE_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
