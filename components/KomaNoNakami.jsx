// ============================================================================
// ★コマの 中身（★2026-09-26・C群）
//
//   ★見本 `SC['コマの中身']`。
//   ★★字と 決めは `lib/komaNoNakami.js` が 持ちます。★ここでは 決めません。
//
//   ★★★長さは **上下に スワイプ** して 合わせます（★1分きざみ）。
//     ★★見本と 同じ 作り です ── ★`scroll-snap` の 2列。
//     ★★★打ち込む 欄に しません。★「スワイプして 合わせます」と 書いて あります。
//   ★★★「いつまで」は **カレンダーからだけ** です。
//     ★★`<input type="date">` を 置きません ── ★端末によって 打ち込めます。
//     ★★押すと 呼ぶ 側が `日を選ぶ` を 開きます。
//   ★★★繰り返すのに 期限が 空の ときは 送れません。★わけを 出します。
// ============================================================================
"use client";

import { useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, OPTION_LINES, HEAD_LEN, HEAD_PLACE, HEAD_REPEAT, HEAD_UNTIL,
  PLACE_EDIT, LEN_HINT, LEN_HOURS, LEN_MINUTES, lenWord, splitLen, joinLen,
  REPEATS, repeatOf, repeats, UNTIL_EMPTY, UNTIL_PICK, UNTIL_HINT,
  BTN_OK, NOTES, NOTES_STRONG, summaryOf, canSave, whyCannotSave,
  GONE_TITLE, GONE_HOW
} from "@/lib/komaNoNakami";

const 札 = { fontSize: "0.75rem", color: C.inkSoft, margin: "12px 0 5px" };
const ITEM = 32;

/** ★1列ぶんの 輪（★上下に スワイプ。★`scroll-snap` で 止まります）。 */
function Wheel({ count, value, onPick, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = Number(value) * ITEM;
  }, [value]);
  return (
    <div style={{ width: 66, textAlign: "center" }}>
      <div ref={ref}
        onScroll={(e) => {
          const n = Math.round(e.target.scrollTop / ITEM);
          if (n !== Number(value) && n >= 0 && n < count) onPick(n);
        }}
        style={{
          height: 132, overflowY: "scroll", scrollSnapType: "y mandatory",
          scrollbarWidth: "none"
        }}>
        <div style={{ height: 50 }} />
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{
            height: ITEM, lineHeight: `${ITEM}px`, fontSize: "1.1875rem",
            scrollSnapAlign: "center",
            color: i === Number(value) ? C.ink : C.inkSoft,
            fontWeight: i === Number(value) ? 700 : 400
          }}>{String(i).padStart(2, "0")}</div>
        ))}
        <div style={{ height: 50 }} />
      </div>
      <span style={{ fontSize: "0.78125rem", color: C.inkSoft }}>{label}</span>
    </div>
  );
}

export default function KomaNoNakami({
  row, title, subLine, places, placeName, onChange, onSave, onPickUntil, onEditPlaces, onBack
}) {
  // ★★★開いて いる あいだに 外された とき（★見本の `if(!pl)`）。
  //   ★★白い 1枚に しません。★何が 起きたかを 書きます。
  if (!row) {
    return (
      <div>
        <Back onClick={onBack}>{BACK_TO}</Back>
        <p style={{ fontSize: "0.9375rem", color: C.ink, marginTop: 14 }}>{GONE_TITLE}</p>
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 5 }}>{GONE_HOW}</p>
      </div>
    );
  }
  const r = row;
  const len = splitLen(r.duration_minutes);
  const 直す = (k, v) => onChange && onChange({ ...r, [k]: v });
  const いい = canSave(r);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={title || ""} />
      {subLine ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 10px" }}>{subLine}</p>
      ) : null}

      {/* ★★おまけ だと 先に 言います。★決めなくても 置かれて います。 */}
      <div style={{
        margin: "0 0 12px", padding: "10px 12px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {OPTION_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.8 }}>{l}</p>
        ))}
      </div>

      <p style={札}>{HEAD_LEN}</p>
      <div style={{
        padding: "11px", borderRadius: 10, border: `1px solid ${C.line}`,
        background: C.card, textAlign: "center"
      }}>
        <span style={{ fontSize: "1.375rem", fontWeight: 700 }}>
          {lenWord(r.duration_minutes)}
        </span>
      </div>
      <div style={{
        marginTop: 9, padding: "10px 8px", borderRadius: 10,
        border: `1px solid ${C.line}`, background: C.card,
        display: "flex", justifyContent: "center", gap: 4
      }}>
        <Wheel count={LEN_HOURS} value={len.h} label="時間"
          onPick={(h) => 直す("duration_minutes", joinLen(h, len.m))} />
        <Wheel count={LEN_MINUTES} value={len.m} label="分"
          onPick={(m) => 直す("duration_minutes", joinLen(len.h, m))} />
      </div>
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "5px 0 0" }}>{LEN_HINT}</p>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <p style={札}>{HEAD_PLACE}</p>
        <button type="button" onClick={onEditPlaces}
          style={{
            border: "none", background: "none", color: C.curtain,
            fontSize: "0.75rem", cursor: "pointer", minHeight: 44
          }}>{PLACE_EDIT}</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(places || []).map((p) => {
          const 選 = r.place_id === p.id;
          return (
            <button key={p.id} type="button" onClick={() => 直す("place_id", 選 ? null : p.id)}
              style={{
                minHeight: 44, padding: "0 12px", borderRadius: 999,
                border: `1px solid ${選 ? C.curtain : C.line}`,
                background: 選 ? C.curtain : C.card,
                color: 選 ? C.onCurtain : C.ink, fontSize: "0.75rem", cursor: "pointer"
              }}>{p.name}</button>
          );
        })}
      </div>

      <p style={札}>{HEAD_REPEAT}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {REPEATS.map((k) => {
          const 選 = repeatOf(r) === k.key;
          return (
            <button key={k.key} type="button"
              onClick={() => 直す("repeat_kind", k.key)}
              style={{
                minHeight: 44, padding: "0 12px", borderRadius: 999,
                border: `1px solid ${選 ? C.curtain : C.line}`,
                background: 選 ? C.curtain : C.card,
                color: 選 ? C.onCurtain : C.ink, fontSize: "0.75rem", cursor: "pointer"
              }}>{k.label}</button>
          );
        })}
      </div>

      {/* ★★繰り返す ときだけ 出ます。★カレンダーからだけ 選べます。 */}
      {repeats(r) ? (
        <>
          <p style={札}>{HEAD_UNTIL}</p>
          <button type="button" onClick={onPickUntil}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", minHeight: 44, padding: "13px", borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink,
              fontSize: "0.875rem", cursor: "pointer", textAlign: "left"
            }}>
            <span>{r.repeat_until || UNTIL_EMPTY}</span>
            <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{UNTIL_PICK}</span>
          </button>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "5px 0 0" }}>{UNTIL_HINT}</p>
        </>
      ) : null}

      <div style={{
        margin: "12px 0 0", padding: "11px 13px", borderRadius: 10,
        border: `1px solid ${C.line}`, background: C.card
      }}>
        <span style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.85 }}>
          {summaryOf(r, placeName)}
        </span>
      </div>

      <button type="button" disabled={!いい} onClick={() => onSave && onSave(r)}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 11,
          borderRadius: 10, border: "none", background: C.curtain, color: C.onCurtain,
          fontSize: "0.9375rem", cursor: いい ? "pointer" : "default", opacity: いい ? 1 : 0.5
        }}>{BTN_OK}</button>
      {/* ★★押せない ときは わけを 出します。★黙って 薄くしません。 */}
      {!いい ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, margin: "7px 0 0" }}>
          {whyCannotSave(r)}
        </p>
      ) : null}

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
