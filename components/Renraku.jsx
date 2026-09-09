"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import {
  NOTICE_LINE, NO_ATTACH_LINE, OPS_READ_ONLY_LINE, OPS_READ_WHY_LINE,
  KEEP_DAYS, visibleMessages, mayPost, studioName, isTwoPane, BODY_WIDTH
} from "@/lib/renraku";

// ============================================================================
// 連絡 ── 門下の連絡板（見本①〜⑤ ／ 2026-09-10）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
//            docs/opus/woolsong-見本-連絡-パソコンiPad（9月10日）.png
//
//   ★★名前は「連絡」です。★「掲示板」とは 呼びません。
//
//   ★★書く欄の 下に、★いつも 1行 出します（★§6-1 の 対処①）。
//     ★★これが 実際の 守りです。★安く、正直で、これ以上のものは ありません。
//
//   ★★運営の方は、★読むだけです。★書き込めません（★見本③）。
//     ★開いたことは 記録に 残り、★先生と 学生の 画面から 見られます。
//
//   ★★休むことは、★ここに 書かせません（★§6-1 の 対処②）。
//     ★別の道（★見本⑥）へ 分けています。
//
//   ★★広い画面は 決まりB（★2026-09-10・坂本さんの お決め）。
//     ★本文 640px ／ 2ペイン ／ 一覧には 名前と 最終更新だけ
//     ★★本文の 抜粋を 出しません。★肩ごしに 読まれないためです。
//
//   ★数と 決めは lib/renraku.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/renraku.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

function useWidth() {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

function whenWord(iso) {
  const s = String(iso || "");
  if (s.length < 10) return "";
  return `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`;
}

/** ★書き込みの 1つ。★取り消したものは、★1行だけ 残します。 */
function Message({ m, nameOf }) {
  if (m.withdrawn) {
    return (
      <div style={{ ...card, opacity: 0.55 }}>
        <p style={small}>取り消されました</p>
      </div>
    );
  }
  return (
    <div style={card}>
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: "0.8125rem", color: C.ink }}>
          {nameOf ? nameOf(m.author_id) : ""}
          {m.role_badge ? (
            <span style={{
              fontSize: "0.5625rem", color: C.inkSoft, background: C.paper,
              border: `1px solid ${C.line}`, borderRadius: 999,
              padding: "2px 7px", marginLeft: 6
            }}>{m.role_badge}</span>
          ) : null}
        </span>
        <span style={small}>{whenWord(m.created_at)}</span>
      </div>
      <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: 1.85, marginTop: 4, whiteSpace: "pre-wrap" }}>
        {m.body}
      </p>
      {/* ★★もうすぐ 消えるものに、★1行 添えます（★見本③）。 */}
      {m.soon ? <p style={small}>まもなく 消えます（{KEEP_DAYS}日）</p> : null}
    </div>
  );
}

export default function Renraku({
  studios, announcements, messages, openStudio, onOpenStudio,
  role, isTeacherOf, isMemberOf, nameOf, teacherNameOf,
  onPost, reads, posting
}) {
  const [draft, setDraft] = useState("");
  const width = useWidth();
  const twoPane = isTwoPane(width);
  const boxRef = useRef(null);

  const canWrite = mayPost({
    role,
    isTeacher: isTeacherOf ? isTeacherOf(openStudio) : false,
    isMember: isMemberOf ? isMemberOf(openStudio) : false,
    isAnnouncement: false
  });
  const shown = visibleMessages(messages, new Date().toISOString().slice(0, 10));

  // ★★一覧（★決まりB：★名前と 最終更新だけ。★本文の 抜粋を 出しません）。
  const list = (
    <div className="space-y-2">
      {(announcements || []).length > 0 ? (
        <>
          <p style={small}>学校からの おしらせ</p>
          {announcements.map((a) => (
            <div key={a.id} style={card}>
              <p style={{ fontSize: "0.8125rem", color: C.ink }}>{a.org_name || "学校"}</p>
              <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: 1.85, marginTop: 2 }}>{a.body}</p>
              <p style={small}>{whenWord(a.created_at)}</p>
            </div>
          ))}
        </>
      ) : null}
      <p style={small}>門下の 連絡</p>
      {(studios || []).map((s) => {
        const on = openStudio === s.teacherId;
        return (
          <button key={s.teacherId} type="button" onClick={() => onOpenStudio(s.teacherId)}
            className="w-full text-left"
            style={{
              ...card, minHeight: 56, display: "block",
              borderColor: on ? C.curtain : C.line,
              borderWidth: on ? 2 : 1
            }}>
            <div className="flex items-center justify-between gap-2">
              {/* ★★名前と、★最終更新だけ。★本文の 抜粋を 出しません（★決まりB）。 */}
              <span style={{ fontSize: "0.8125rem", color: C.ink }}>
                {studioName(teacherNameOf ? teacherNameOf(s.teacherId) : "")}
              </span>
              <span style={small}>{s.lastAt ? whenWord(s.lastAt) : "まだ ありません"}</span>
            </div>
            <p style={small}>{s.memberCount}人</p>
          </button>
        );
      })}
      <p style={small}>
        ここの書き込みは、{KEEP_DAYS}日で 消えます。<br />
        書かれたものを、こちらで 読み取って 調べることは しません。
      </p>
    </div>
  );

  // ★★本文（★決まりB：★640px で 止めます）。
  const body = (
    <div style={{ maxWidth: BODY_WIDTH, width: "100%" }} className="space-y-3">
      {/* ★★運営の方への 断り（★見本③）。★書けない ことと、その わけ。 */}
      {!canWrite && (role === "owner" || role === "admin") ? (
        <div style={{ ...card, background: C.paper }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.85 }}>{OPS_READ_ONLY_LINE}</p>
          <p style={small}>{OPS_READ_WHY_LINE}</p>
          <p style={small}>開いたことは 記録に残り、先生と学生の画面から 見られます。</p>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div style={card}><p style={small}>まだ 書き込みは ありません。</p></div>
      ) : (
        shown.map((m) => <Message key={m.id} m={m} nameOf={nameOf} />)
      )}

      {/* ★★書く欄。★書ける人にだけ 出します。
          ★★下に、★いつも 1行（★§6-1 の 対処①）。 */}
      {canWrite ? (
        <div style={card}>
          <textarea
            ref={boxRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="ここに 書きます"
            style={{
              width: "100%", minHeight: 88, borderRadius: 10, padding: 10,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", lineHeight: 1.85, resize: "vertical"
            }} />
          {/* ★★1文字も 変えないこと。★これが 実際の 守りです。 */}
          <p style={{ ...small, whiteSpace: "pre-line", marginTop: 6 }}>{NOTICE_LINE}</p>
          <button type="button" disabled={posting || !draft.trim()}
            onClick={async () => {
              const ok = await onPost(draft);
              if (ok) setDraft("");
            }}
            className="w-full"
            style={{
              minHeight: 52, marginTop: 8, borderRadius: 12,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
              background: draft.trim() ? C.curtain : C.line, color: "#FFFDF8",
              fontSize: "0.9375rem"
            }}>出す</button>
          <p style={{ ...small, marginTop: 6 }}>
            {NO_ATTACH_LINE}<br />
            {KEEP_DAYS}日で 消えます。
          </p>
        </div>
      ) : null}

      {/* ★★開いた記録（★見本③・パソコン③）。
          ★★読んだ側にも、★読まれた側にも 見えます。
            ★片方だけが 見られる 記録は、★見張りに なりません。 */}
      {(reads || []).length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 4 }}>開いた 記録</p>
          {reads.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2"
              style={{ padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.75rem" }}>
              <span style={{ color: C.ink }}>
                {nameOf ? nameOf(r.reader_id) : ""}（{r.reader_role}）が 開きました
              </span>
              <span style={small}>{whenWord(r.read_at)}</span>
            </div>
          ))}
          <p style={{ ...small, marginTop: 6 }}>
            誰が・いつ・どの門下を、だけです。何を読んだかは 残しません。
          </p>
        </div>
      ) : null}
    </div>
  );

  if (twoPane) {
    // ★★決まりB：★2ペイン。★左に 一覧、★右に 本文。
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 260px", minWidth: 0 }}>{list}</div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "flex-start" }}>{body}</div>
      </div>
    );
  }
  // ★狭い画面：★門下を 開いていなければ 一覧、★開いていれば 本文。
  return openStudio ? (
    <div className="space-y-3">
      <button type="button" onClick={() => onOpenStudio(null)}
        style={{
          minHeight: 44, border: "none", background: "transparent",
          color: C.curtain, fontSize: "0.875rem", padding: 0
        }}>‹ もどる</button>
      {body}
    </div>
  ) : list;
}
