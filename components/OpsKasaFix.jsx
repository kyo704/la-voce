"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Pill, Btn, Li, Warn, Ask, H3, FieldLabel } from "@/components/UiV2";
import {
  FIX_HEAD, FIX_PICK_HEAD, FIX_PICK_SUB, FIX_HERE_HEAD, FIX_DO, FIX_AGAIN,
  FIX_FREE, FIX_NONE, FIX_ROOM_HEAD, FIX_ROOM_PUT, FIX_ROOM_NOTE, FIX_NOTES,
  moveAsk, MOVE_ASK_NOTE, KIND_LINE
} from "@/lib/opsKasa";
import { DAYS, periodWord } from "@/lib/opsKumu";

// ============================================================================
// ★どこへ 動かしますか（★見本 `P_kasaFix`・裁定 その108 ③）
//
//   ★★★枠を 数える ところは `lib/opsKumu.js` の `openSlots` です。
//     ★★「入れられる 枠」と 同じ 決め です。★2つ 作りません。
//     ★★その方が 来られて、★空いて いて、★ご自分の 予定が 無い 枠 だけ。
//
//   ★★★押しただけでは 動きません。★一度 お尋ねしてから 動かします。
//     ★★生徒の 予定も 一緒に 動くからです。
//
//   ★★★部屋だけ 変える ── ★時間は そのまま です。
//     ★★空いて いる 部屋を こちらで 探しません。★候補を 出すだけ です。
//
//   ★見張り components/tests/ops-kasa.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsKasaFix({
  overlap, lesson, slots = [], places = [],
  studentName = "", placeName = "", nameOf,
  onMove, onMoveRoom, onBack, busy, error = ""
}) {
  const [選び, set選び] = useState(null);
  const [場所, set場所] = useState(null);
  const [確かめ, set確かめ] = useState(null);

  if (!overlap || !lesson) return null;
  const いまの場所 = 場所 || placeName || "";

  return (
    <div style={{ fontFamily: FONT_STACK }} data-v2-kasafix="1">
      <ScreenHead title={FIX_HEAD} right={
        onBack ? (
          <button type="button" onClick={onBack}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 重なり</button>
        ) : null} />
      <p style={{ ...小, margin: "-4px 0 10px" }}>
        {overlap.at}　{KIND_LINE[overlap.kind] || overlap.kind}
        {placeName ? `　${placeName}` : ""}
        {studentName ? `　／　${studentName}` : ""}
      </p>

      {/* ★★動かせる 枠。★1つも 無い ときは、★場所だけ 変える 道を 残します。 */}
      {slots.length === 0 ? (
        <Warn>{FIX_NONE}</Warn>
      ) : (
        <Card style={{ padding: 0, maxWidth: 640 }}>
          {slots.map((s, i) => {
            const k = `${s.dateISO}-${(s.period && (s.period.id || s.period.ord)) || i}`;
            const on = 選び && 選び.dateISO === s.dateISO
              && 選び.period && s.period && 選び.period.id === s.period.id;
            return (
              <Li key={k} last={i === slots.length - 1}
                onClick={busy ? undefined : () => set選び(s)}
                style={on ? { background: C.paper } : undefined}
                right={<span style={小}>{on ? "● " : ""}{FIX_FREE}</span>}>
                {String(s.dateISO).slice(5).replace("-", "月")}日（{DAYS[s.weekday]}）
                <div style={小}>{periodWord(s.period)}</div>
              </Li>
            );
          })}
        </Card>
      )}

      {選び ? (
        <Card style={{ marginTop: rem(9), borderColor: C.inkSoft }}>
          <p style={{ ...小, margin: 0 }}>{FIX_HERE_HEAD}</p>
          <p style={{ ...TYPE.li, color: C.ink, margin: "3px 0 2px", fontWeight: 700 }}>
            {String(選び.dateISO).slice(5).replace("-", "月")}日（{DAYS[選び.weekday]}）
            　{periodWord(選び.period)}
          </p>
          {places.length ? (
            <>
              <FieldLabel>場所</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {places.map((p) => (
                  <Pill key={p.id} on={いまの場所 === p.name}
                    onClick={() => set場所(p.name)}>{p.name}</Pill>
                ))}
              </div>
            </>
          ) : null}
          <div style={{ display: "flex", gap: 8, marginTop: rem(11) }}>
            <Btn disabled={busy} onClick={() => set確かめ({ slot: 選び, place: いまの場所 })}>
              {FIX_DO}</Btn>
            <Btn ghost small disabled={busy} onClick={() => set選び(null)}>{FIX_AGAIN}</Btn>
          </div>
        </Card>
      ) : slots.length ? (
        <Card style={{ marginTop: rem(9) }}>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{FIX_PICK_HEAD}</p>
          <p style={{ ...小, margin: "4px 0 0" }}>{FIX_PICK_SUB}</p>
        </Card>
      ) : null}

      {/* ★★時間は そのまま。★場所だけ 変える。 */}
      {places.length ? (
        <>
          <H3>{FIX_ROOM_HEAD}</H3>
          <Card style={{ padding: 0, maxWidth: 640 }}>
            {places.filter((p) => p.name !== placeName).map((p, i, a) => (
              <Li key={p.id} last={i === a.length - 1}
                onClick={busy ? undefined : () => set確かめ({ room: p })}
                right={<span style={小}>{FIX_ROOM_PUT}</span>}>{p.name}</Li>
            ))}
          </Card>
          <p style={{ ...小, margin: "7px 0 0" }}>{FIX_ROOM_NOTE}</p>
        </>
      ) : null}

      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      <Note>
        {FIX_NOTES.map((n) => (
          <span key={n.text} style={{ display: "block" }}>{n.text}</span>
        ))}
      </Note>

      {確かめ ? (
        <Ask
          title={確かめ.room
            ? `${確かめ.room.name} に 移します。`
            : moveAsk({
              dateISO: 確かめ.slot.dateISO, period: 確かめ.slot.period, place: 確かめ.place
            })}
          note={確かめ.room ? FIX_ROOM_NOTE : MOVE_ASK_NOTE}
          okLabel={確かめ.room ? FIX_ROOM_PUT : FIX_DO}
          onOk={() => {
            if (確かめ.room) { if (onMoveRoom) onMoveRoom(確かめ.room); }
            else if (onMove) onMove(確かめ.slot, 確かめ.place);
            set確かめ(null);
          }}
          onCancel={() => set確かめ(null)} />
      ) : null}
    </div>
  );
}
