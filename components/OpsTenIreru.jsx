"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note } from "@/components/UiV2";
import {
  ENTRY_NOTES, ENTRY_LABEL, REVIEW_LABEL, pointOk, whyPointBad, SAVED_LINE,
  EDIT_REASON_LABEL, EDIT_REASON_HINT, EDIT_LABEL, EDIT_NOTE,
  mayEditConfirmed, EDIT_WHY_EMPTY, CONFIRMED_WORD
} from "@/lib/evaluation";

// ============================================================================
// ★点を 入れる（★見本 `P_tenIreru`・裁定 その105）
//
//   ★★決めは lib/evaluation.js が 持ちます。★ここでは 決めません。
//   ★★★満点より 多い 点・きざみに 合わない 点は 入れられません。
//     ★★押す 前に、★その場で わけを 出します。
//   ★★★ほかの 審査員の 点は、★この 画面に 出しません（★§Q1）。
//
//   ★見張り components/tests/evaluation.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsTenIreru({
  studentName, eventName, items = [], values = {}, review = "",
  // ★★★確定済みか（★確定の あとは、わけを 添えて 直します・§Q4）。
  //   ★★`scoreIdOf(itemId)` …… その 項目の 点の 番号（★直す 道に 要ります）
  confirmed, scoreIdOf, onEditConfirmed,
  onSave, onClose, busy, error = "", done = ""
}) {
  const 使う = items.filter((i) => i && i.in_use);
  const [下書き, set下書き] = useState(() => {
    const d = {};
    使う.forEach((i) => { d[i.id] = values[i.id] == null ? "" : String(values[i.id]); });
    return d;
  });
  const [講評, set講評] = useState(review || "");

  const [わけ, setわけ] = useState("");
  const わるい = 使う.filter((i) => !pointOk(下書き[i.id], i));
  // ★★★確定の あとは、★わけを 書くまで 押せません（★記録の 意味が なくなる ため）。
  const 出せる = !busy && わるい.length === 0
    && (!confirmed || mayEditConfirmed(わけ));

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={studentName || ""} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 採点</button>
        ) : null} />
      {eventName ? <p style={{ ...小, margin: "-4px 0 10px" }}>{eventName}</p> : null}

      <Card>
        {使う.length === 0 ? (
          <p style={{ ...小, margin: 0 }}>
            評価の 型が ありません。設定の「評価の 型」で お決め ください。
          </p>
        ) : 使う.map((i) => (
          <div key={i.id} style={{ marginBottom: rem(10) }}>
            <label style={{ ...小, display: "block" }}>
              {i.name}　<span style={小}>{i.max_points}点満点</span>
            </label>
            {i.note ? <p style={{ ...小, margin: "0 0 2px" }}>{i.note}</p> : null}
            <input type="number" inputMode="decimal"
              value={下書き[i.id] == null ? "" : 下書き[i.id]}
              onChange={(e) => set下書き((d) => ({ ...d, [i.id]: e.target.value }))}
              step={i.step} min={0} max={i.max_points}
              style={{
                width: "100%", minHeight: 48, borderRadius: 10, marginTop: 2,
                padding: `0 ${rem(10)}`,
                border: `1px solid ${pointOk(下書き[i.id], i) ? C.line : C.curtain}`,
                background: C.paper, color: C.ink, fontSize: rem(16),
                fontFamily: FONT_STACK
              }} />
            {/* ★★その場で わけを 出します。★押してから 断りません。 */}
            {!pointOk(下書き[i.id], i) ? (
              <p style={{ ...小, margin: "2px 0 0", color: C.ink }}>
                {whyPointBad(下書き[i.id], i)}
              </p>
            ) : null}
          </div>
        ))}

        <label style={{ ...小, display: "block" }}>{REVIEW_LABEL}</label>
        <textarea value={講評}
          onChange={(e) => set講評(e.target.value.slice(0, 1000))}
          style={{
            width: "100%", minHeight: 80, borderRadius: 10, marginTop: 2,
            padding: rem(8), border: `1px solid ${C.line}`,
            background: C.paper, color: C.ink, fontSize: rem(16),
            fontFamily: FONT_STACK, lineHeight: 1.8
          }} />

        {/* ★★★確定の あと（★§Q4）。★わけの 欄を 出します。 */}
        {confirmed ? (
          <>
            <p style={{ ...小, margin: `${rem(8)} 0 0`, color: C.ink }}>
              {CONFIRMED_WORD}
            </p>
            <label style={{ ...小, display: "block", marginTop: rem(6) }}>
              {EDIT_REASON_LABEL}
            </label>
            <p style={{ ...小, margin: 0 }}>{EDIT_REASON_HINT}</p>
            <input type="text" value={わけ}
              onChange={(e) => setわけ(e.target.value.slice(0, 200))}
              placeholder="れい：見直して、表現を 1点 上げました"
              style={{
                width: "100%", minHeight: 48, borderRadius: 10, marginTop: 4,
                padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
                background: C.paper, color: C.ink, fontSize: rem(16),
                fontFamily: FONT_STACK
              }} />
            {!mayEditConfirmed(わけ) ? (
              <p style={{ ...小, margin: "2px 0 0" }}>{EDIT_WHY_EMPTY}</p>
            ) : null}
          </>
        ) : null}

        <button type="button" disabled={!出せる}
          onClick={() => {
            if (!出せる) return;
            // ★★★確定の あとは、★1つずつ「わけつき」で 直します。
            //   ★★まとめて 上書きしません。★どの 点を どう 直したかを 残す ため です。
            if (confirmed && onEditConfirmed) {
              使う.forEach((i) => {
                const 前 = values[i.id] == null ? "" : String(values[i.id]);
                const 後 = 下書き[i.id] == null ? "" : String(下書き[i.id]);
                if (前 === 後) return;
                const id = scoreIdOf ? scoreIdOf(i.id) : null;
                if (!id) return;
                onEditConfirmed(id, 後 === "" ? null : Number(後), わけ.trim());
              });
              return;
            }
            if (!onSave) return;
            const 出 = {};
            使う.forEach((i) => {
              const v = 下書き[i.id];
              出[i.id] = (v === "" || v == null) ? null : Number(v);
            });
            onSave(出, 講評.trim());
          }}
          style={{
            width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
            border: `1px solid ${出せる ? C.curtain : C.line}`, borderBottomWidth: 3,
            background: 出せる ? C.curtain : C.line,
            color: 出せる ? C.onCurtain : C.inkSoft,
            fontSize: rem(15.5), fontFamily: FONT_STACK
          }}>{busy ? "入れて います" : (confirmed ? EDIT_LABEL : ENTRY_LABEL)}</button>
        {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
        {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done || SAVED_LINE}</p> : null}
      </Card>

      <Note>
        {ENTRY_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
        {confirmed ? <span style={{ display: "block" }}>{EDIT_NOTE}</span> : null}
      </Note>
    </div>
  );
}
