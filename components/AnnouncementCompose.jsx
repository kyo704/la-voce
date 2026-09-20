"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  NOTICE_LINE, NO_ATTACH_LINE, HIDE_LINE, BODY_WIDTH,
  // ★★宛先（★見本 `P_write`・2026-09-19）。★決めは lib が 持ちます。
  WRITE_HEAD, WRITE_SUB, TITLE_LABEL, TITLE_HINT, EMPTY_TARGET,
  isWholeSchool, reachOf, reachWord, mayPostAnnouncement,
  WRITE_NOTES, SAVED_TARGET_NOT_YET
} from "@/lib/renraku";
// ★★学校の 形（★裁定 その98）。★学部は 学科の 上に つないで あります。
import { choosableFor, parentNameOf } from "@/lib/orgDivisions";

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
//   ★★90日で 画面から 消えます（★裁定 その77）。★台帳からは 消しません。
//   ★★取り消すと、★静かに 1行だけ 残ります。
//
//   ★見張り components/tests/renraku.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

export default function AnnouncementCompose({
  orgName, memberCount, studios, teacherNameOf, onPost, onClose, posting,
  // ★★★宛先を 段で 狭めます（★見本 `P_write`・2026-09-19）。
  //   ★`divisions` … ★`org_divisions` の 行
  //   ★`roster` … ★`{ user_id, division_id, grade_year, counted }`
  //   ★`nameOf` … ★お名前（★名ざしで 足す とき に 使います）
  divisions = [], roster = [], nameOf
}) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(null);   // ★null＝学校の みなさん
  // ★★段の 宛先（★学科・学年・お名前）。★空＝しぼらない。
  const [aim, setAim] = useState(EMPTY_TARGET);
  const [q, setQ] = useState("");
  const 届く = reachOf(roster, aim);
  const 学年 = [...new Set((roster || [])
    .map((r) => r && r.grade_year).filter((x) => x != null))].sort((a, b) => a - b);
  const 候補 = String(q).trim()
    ? (roster || []).filter((r) => nameOf
      && String(nameOf(r.user_id) || "").includes(String(q).trim()))
    : [];
  const つまむ = (key, v) => setAim((prev) => {
    const 元 = prev[key] || [];
    return { ...prev, [key]: 元.includes(v) ? 元.filter((x) => x !== v) : [...元, v] };
  });

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

      {/* ★★★宛先を 段で 狭めます（★見本 `P_write`・2026-09-19）。
          ★★学部は 選ばせません ── ★学科の 上に つないで あります。
          ★★空＝しぼらない。★どれも 選ばなければ みなさんへ 届きます。
          ★★★いま 何人に 届くかを、★いつも 出します。★0人なら 出せません。
          ★★★節の 題は 見出しの 印（h3）で 書きます（★D109・2026-09-20）。
            ★★見た目は 変わりません。★読み上げと、★骨組みの くらべ に 効きます。 */}
      <p style={small}>{WRITE_SUB}</p>

      {target === null && choosableFor(divisions).length > 0 ? (
        <>
          <h3 style={{ ...small, fontWeight: "inherit" }}>学科・コース ／ 事務の 分野</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {choosableFor(divisions).map((d) => (
              <button key={d.id} type="button"
                onClick={() => つまむ("divisionIds", d.id)}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${(aim.divisionIds || []).includes(d.id)
                    ? C.curtain : C.line}`,
                  background: (aim.divisionIds || []).includes(d.id) ? C.paper : C.card,
                  color: C.ink, fontSize: "0.75rem"
                }}>
                {d.kind === "department" && parentNameOf(divisions, d)
                  ? `${parentNameOf(divisions, d)}／${d.name}` : d.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {target === null && 学年.length > 0 ? (
        <>
          <h3 style={{ ...small, fontWeight: "inherit" }}>学年</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {学年.map((g) => (
              <button key={g} type="button" onClick={() => つまむ("gradeYears", g)}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${(aim.gradeYears || []).includes(g)
                    ? C.curtain : C.line}`,
                  background: (aim.gradeYears || []).includes(g) ? C.paper : C.card,
                  color: C.ink, fontSize: "0.75rem"
                }}>{`${g}年`}</button>
            ))}
          </div>
        </>
      ) : null}

      {target === null ? (
        <>
          <h3 style={{ ...small, fontWeight: "inherit" }}>名前で 足す</h3>
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="お名前の 一部を 打つと 候補が 出ます"
            style={{
              width: "100%", minHeight: 44, borderRadius: 10, padding: "0 10px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem"
            }} />
          {候補.length > 0 ? (
            <div style={{ ...card, padding: 0, maxHeight: 180, overflowY: "auto" }}>
              {候補.map((r) => (
                <button key={r.user_id} type="button"
                  onClick={() => { つまむ("userIds", r.user_id); setQ(""); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", minHeight: 44,
                    padding: "0 12px", border: "none", borderTop: `1px solid ${C.line}`,
                    background: "transparent", color: C.ink, fontSize: "0.8125rem"
                  }}>
                  {nameOf ? nameOf(r.user_id) : ""}
                  {(aim.userIds || []).includes(r.user_id) ? "　✓" : "　＋ 足す"}
                </button>
              ))}
            </div>
          ) : null}
          {(aim.userIds || []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(aim.userIds || []).map((uid) => (
                <button key={uid} type="button" onClick={() => つまむ("userIds", uid)}
                  style={{
                    minHeight: 44, padding: "0 12px", borderRadius: 999,
                    border: `1px solid ${C.curtain}`, background: C.paper,
                    color: C.ink, fontSize: "0.75rem"
                  }}>{(nameOf ? nameOf(uid) : "")} ×</button>
              ))}
            </div>
          ) : null}
          {/* ★★いま 何人に 届くか。★0人なら はっきり 言います。 */}
          <div style={{ ...card, background: C.paper }}>
            <p style={{ ...small, margin: 0 }}>
              {isWholeSchool(aim) ? `${orgName || "学校"}の みなさん` : "しぼって います"}
            </p>
            <p style={{ color: C.ink, margin: "4px 0 0", fontSize: "1.125rem" }}>
              {reachWord(届く.length)}
            </p>
          </div>
          <p style={small}>{SAVED_TARGET_NOT_YET}</p>
        </>
      ) : null}

      {/* ★★★題（★見本 `P_write`）。★無くても かまいません。 */}
      <h3 style={{ ...small, fontWeight: "inherit" }}>{TITLE_LABEL}</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder={TITLE_HINT}
        style={{
          width: "100%", minHeight: 44, borderRadius: 10, padding: "0 10px",
          border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
          fontSize: "1rem"
        }} />

      {/* ★★だれに（★見本②）。★選んでから 書きます。 */}
      <h3 style={{ ...small, fontWeight: "inherit" }}>だれに</h3>
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

      {/* ★★★0人には 出せません（★見本の 字）。★押せない 札に しません ──
          ★★押せる ようで 出ない、では なく、★出せない ことを 上に 書いて います。 */}
      <button type="button"
        disabled={posting
          || (target === null
            ? !mayPostAnnouncement(届く.length, body)
            : !body.trim())}
        onClick={async () => {
          const ok = await onPost(target, body, {
            title: title.trim() || null,
            ...(target === null ? aim : EMPTY_TARGET)
          });
          if (ok) {
            setBody(""); setTitle(""); setAim(EMPTY_TARGET); setQ("");
            if (onClose) onClose();
          }
        }}
        className="w-full"
        style={{
          minHeight: 52, borderRadius: 12,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          background: body.trim() ? C.curtain : C.line, color: "#FFFDF8",
          fontSize: "0.9375rem"
        }}>{posting ? "出しています" : "出す"}</button>

      <p style={small}>
        {WRITE_NOTES.map((t) => (<span key={t}>{t}<br /></span>))}
        {NO_ATTACH_LINE}<br />
        {HIDE_LINE}<br />
        取り消すと、静かに 1行だけ 残ります。勝手に 消しません。
      </p>
    </div>
  );
}
