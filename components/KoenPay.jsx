"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_MEMBER } from "@/lib/koenCast";
import {
  countMembers, targetTier, payAmount, yen,
  PAY_HEAD, PAY_SUB, PAY_TIER_HEAD, PAY_TIER_NOW, PAY_TIER_UNIT, PAY_TIER_NOTE,
  PAY_HEAD2, PAY_TO, PAY_AMOUNT, PAY_UNTIL, PAY_UNTIL_DEFAULT, PAY_UNTIL_WHEN,
  PAY_EXT, PAY_EXT_VALUE, PAY_AUTO, PAY_AUTO_VALUE, PAY_NOTE
} from "@/lib/koenInvite";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★公演の 料金 ── ★見本 `P_koenPay`
//   ★出どころ 裁定143 ／ 裁定148
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★段と 金額は 台帳（`koen_tier_price`）。★ここに 数字を 書きません。
//   ★★★上の 段へは 差額 だけ です。
//   ★★★自動更新は ありません。
//
//   ★★★**払う 道は まだ ありません**（★Stripe は 眠って います）。
//     ★だから「支払う」の 札を 出しません。★押せない 札を 置きません。
//     ★★金額と 段は お見せします ── ★いくら 要るかは 知りたい ことです。
//     ★★どこで 払うかは `docs/ledgers/08-保留している決め.md` に 書きます。
//
//   ★見張り components/tests/koen-pay-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 280
};
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(7)} 0`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};

export default function KoenPay({ supabase, koen, onBack }) {
  const [members, setMembers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !koen) return;
    let 生 = true;
    (async () => {
      try {
        const { data: me } = await supabase.from("koen_members")
          .select(COLS_MEMBER).eq("koen_id", koen.id);
        if (!生) return;
        setMembers(me || []);
        // ★★段の 一覧は 台帳から。★いちばん 大きい 段まで 引きます。
        const 引 = await Promise.all([1, 16, 41, 121, 301].map((n) =>
          supabase.rpc("koen_tier_price", { p_people: n })));
        if (!生) return;
        const 段 = [];
        引.forEach(({ data }) => (data || []).forEach((t) => {
          if (!段.some((x) => x.tier === t.tier)) 段.push(t);
        }));
        setTiers(段.sort((a, b) => a.tier - b.tier));
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, koen]);

  const 人 = useMemo(() => countMembers(members), [members]);
  const 段 = koen ? Number(koen.tier_people) || 0 : 0;
  const 先 = useMemo(() => targetTier(tiers, 人, 段), [tiers, 人, 段]);
  const 額 = useMemo(() => payAmount(tiers, 人, 段), [tiers, 人, 段]);

  if (!koen) return null;

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>‹ {tx("出演者を招く")}</button>
      ) : null}

      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(PAY_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{koen.title}　／　{tx(PAY_SUB)}</div>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(PAY_TIER_HEAD)}</div>
          {tiers.map((t) => (
            <div key={t.tier} style={{
              ...行, background: 先 && 先.tier === t.tier ? C.band2 : "transparent"
            }}>
              <span>
                {t.tier}{tx(PAY_TIER_UNIT)}
                {t.tier === 段 ? (
                  <span style={{ ...小, display: "block" }}>{tx(PAY_TIER_NOW)}</span>
                ) : null}
              </span>
              <span style={{ color: C.ink }}>{yen(t.yen)}</span>
            </div>
          ))}
          <div style={{ ...小, marginTop: rem(8) }}>{tx(PAY_TIER_NOTE)}</div>
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(PAY_HEAD2)}</div>
          <div style={行}>
            <span>{tx(PAY_TO)}</span>
            <span>{先 ? 先.tier + tx(PAY_TIER_UNIT) : "—"}</span>
          </div>
          <div style={行}>
            <span>{tx(PAY_AMOUNT)}</span>
            <span style={{ color: C.ink, fontWeight: 700 }}>{yen(額)}</span>
          </div>
          <div style={行}>
            <span>{tx(PAY_UNTIL)}</span>
            <span>
              {koen.valid_until || tx(PAY_UNTIL_DEFAULT)}{tx(PAY_UNTIL_WHEN)}
            </span>
          </div>
          <div style={行}><span>{tx(PAY_EXT)}</span><span>{tx(PAY_EXT_VALUE)}</span></div>
          <div style={行}><span>{tx(PAY_AUTO)}</span><span>{tx(PAY_AUTO_VALUE)}</span></div>
          {/* ★★★払う 札は 出しません。★払う 道が まだ ありません。 */}
        </div>
      </div>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {PAY_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
