"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Li, Note } from "@/components/UiV2";
import {
  HEAD, LIST_HEAD, LIST_SUB, LIST_NOTES, BOTTOM_NOTES,
  STATE, mayInvite, invitable
} from "@/lib/monkaInvite";

// ============================================================================
// ★門下に 招く（★見本 `P_monkaInvite` ②・裁定 その108）
//
//   ★★★合言葉の 道（①）は **もう 出来て います**。★ここでは 作りません。
//     ★★`teacher_invitations.monka_teacher_id`（★裁定 その83）。
//   ★★★ここは ②「名簿から 名指しで 招く」だけ です。
//
//   ★★★学校の 名簿に いる 方 だけ が 出ます。★名簿の 外は 探せません。
//   ★★★押しても、★こちらから 入れる ことは できません。
//     ★★相手の 画面に「招かれて います」と 出る だけ です。
//
//   ★見張り components/tests/monka-invite.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMonkaInvite({
  teacherName, members = [], monka = [], invites = [],
  onInvite, onClose, busy, error = "", done = ""
}) {
  const 並 = invitable(members, { monka, invites });

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 門下</button>
        ) : null} />
      {teacherName ? <p style={{ ...小, margin: "-4px 0 10px" }}>{teacherName}</p> : null}

      <H3>{LIST_HEAD}</H3>
      <p style={{ ...小, margin: "-4px 0 6px" }}>{LIST_SUB}</p>

      <Card style={{ padding: 0 }}>
        {並.length === 0 ? (
          <p style={{ ...小, margin: 0, padding: rem(14) }}>
            名簿に、まだ どなたも いません。
          </p>
        ) : 並.map((m, i) => (
          <Li key={m.id} last={i === 並.length - 1}
            right={m.state === "joined"
              ? <span style={{ color: C.sage }}>{STATE.joined}</span>
              : m.state === "sent"
                ? <span style={小}>{STATE.sent}</span>
                : (
                  <button type="button" disabled={busy}
                    onClick={() => onInvite && onInvite(m.id)}
                    style={{
                      minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
                      border: `1px solid ${C.line}`, background: C.card,
                      color: C.ink, fontSize: rem(12.5), fontFamily: FONT_STACK
                    }}>{STATE.none}</button>
                )}>
            {m.name}
            {m.grade || m.course ? (
              <div style={小}>{[m.grade, m.course].filter(Boolean).join("　")}</div>
            ) : null}
          </Li>
        ))}
      </Card>
      {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
      {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done}</p> : null}

      <Note>
        {LIST_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>
      <Note>
        {BOTTOM_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>
    </div>
  );
}
