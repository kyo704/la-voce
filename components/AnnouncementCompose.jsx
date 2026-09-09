"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { NOTICE_LINE, NO_ATTACH_LINE, KEEP_DAYS, BODY_WIDTH } from "@/lib/renraku";

// ============================================================================
// おしらせを 書く ── 見本②（2026-09-10）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html ②
//            docs/opus/woolsong-見本-連絡-パソコンiPad（9月10日）.png ②
//
//   ★★1行は、★入力欄の 真下に 出します（★見本②の 但し書き）。
//     ★★連絡板と 同じ 1行です。★書き写しません。★lib から もらいます。
//
//   ★★だれに … ★学校の みなさん か、★門下を えらぶ。
//     ★★「学校の みなさん」は、★teacherId が null です。
//     ★門下を えらぶと、★その門下だけに なります。
//
//   ★★添付は できません。★選ぶ口を 置きません。
//   ★★90日で 消えます。★取り消すと、★静かに 1行だけ 残ります。
//
//   ★見張り components/tests/renraku.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

export default function AnnouncementCompose({
  orgName, memberCount, studios, teacherNameOf, onPost, onClose, posting
}) {
  const [body, setBody] = useState("");
  const [target, setTarget] = useState(null);   // ★null＝学校の みなさん

  const chip = (on) => ({
    minHeight: 48, padding: "0 16px", borderRadius: 12,
    border: `1px solid ${on ? C.curtain : C.line}`,
    borderBottomWidth: on ? 3 : 1,
    background: on ? C.paper : C.card,
    color: C.ink, fontSize: "0.875rem"
  });

  return (
    <div className="space-y-3" style={{ maxWidth: BODY_WIDTH }}>
      <div className="flex items-center justify-between">
        <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>おしらせを 書く</h2>
        <button type="button" onClick={onClose} aria-label="とじる"
          style={{
            minWidth: 44, minHeight: 44, border: "none",
            background: "transparent", color: C.inkSoft, fontSize: "1.125rem"
          }}>✕</button>
      </div>

      {/* ★★だれに（★見本②）。★選んでから 書きます。 */}
      <p style={small}>だれに</p>
      <button type="button" onClick={() => setTarget(null)} className="w-full text-left"
        style={chip(target === null)}>
        {orgName || "学校"}の みなさん　{memberCount != null ? `${memberCount}人` : ""}
      </button>
      <div className="space-y-2">
        {(studios || []).map((s) => (
          <button key={s.teacherId} type="button" onClick={() => setTarget(s.teacherId)}
            className="w-full text-left" style={chip(target === s.teacherId)}>
            {teacherNameOf ? teacherNameOf(s.teacherId) : ""}の 門下　{s.memberCount}人
          </button>
        ))}
      </div>

      <div style={card}>
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="ここに 書きます"
          style={{
            width: "100%", minHeight: 96, borderRadius: 10, padding: 10,
            border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
            fontSize: "1rem", lineHeight: 1.85, resize: "vertical"
          }} />
        {/* ★★1行は、★入力欄の 真下です（★見本②）。★連絡板と 同じ 文です。 */}
        <p style={{ ...small, whiteSpace: "pre-line", marginTop: 6 }}>{NOTICE_LINE}</p>
      </div>

      <button type="button" disabled={posting || !body.trim()}
        onClick={async () => {
          const ok = await onPost(target, body);
          if (ok) { setBody(""); if (onClose) onClose(); }
        }}
        className="w-full"
        style={{
          minHeight: 52, borderRadius: 12,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          background: body.trim() ? C.curtain : C.line, color: "#FFFDF8",
          fontSize: "0.9375rem"
        }}>{posting ? "出しています" : "出す"}</button>

      <p style={small}>
        {NO_ATTACH_LINE}<br />
        {KEEP_DAYS}日で 消えます。<br />
        取り消すと、静かに 1行だけ 残ります。勝手に 消しません。
      </p>
    </div>
  );
}
