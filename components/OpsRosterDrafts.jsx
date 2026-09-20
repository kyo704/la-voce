"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note, Btn, Li, Warn, Ask, H3, EmptyBox } from "@/components/UiV2";
import {
  DRAFT_HEAD, DRAFT_SUB, DRAFT_EMPTY, DRAFT_EMPTY_SUB,
  INVITE_ONE, INVITE_ALL, INVITED_MARK, LINKED_MARK,
  OLD_HEAD, OLD_SUB, OLD_OPEN, OLD_CLOSE, DELETE_ONE,
  inviteAllAsk, INVITE_ASK_NOTE, INVITE_NOTE, DELETE_ASK_NOTE,
  visibleDrafts, oldDrafts, isInvited, isLinked
} from "@/lib/rosterDrafts";

// ============================================================================
// ★名簿の 下書き（★裁定 その109・2026-09-20）
//
//   ★★★まだ 口（アカウント）の 無い 方 です。
//     ★★名簿には まだ 入って いません。★そう 書いて 出します。
//
//   ★★★招くのは 人が 押した ときだけ です。★自動では 送りません。
//     ★★まとめて 招く ときは、★1度 だけ 確かめます。
//
//   ★★★1年 経った ものは 畳みます。★消しません。
//     ★★入学が 遅れる・休学する ── ★あとから 来る 方が います。
//
//   ★★決めは lib/rosterDrafts.js が 持ちます。
//
//   ★見張り components/tests/roster-drafts.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsRosterDrafts({
  rows = [], nowISO = "", divisionNameOf, busy, error = "",
  onInvite, onInviteAll, onDelete
}) {
  const [古い, set古い] = useState(false);
  const [確かめ, set確かめ] = useState(null);

  const いま = visibleDrafts(rows, nowISO);
  const 畳 = oldDrafts(rows, nowISO);
  const まだ = いま.filter((d) => !isInvited(d) && !isLinked(d));

  const ひとり = (d) => (
    <Li key={d.id}
      right={
        isLinked(d) ? <span style={{ ...小, color: C.sage }}>{LINKED_MARK}</span>
          : isInvited(d) ? <span style={小}>{INVITED_MARK}</span>
            : (
              <span style={{ display: "flex", gap: 6 }}>
                <Btn small disabled={busy}
                  onClick={() => set確かめ({ one: d })}>{INVITE_ONE}</Btn>
                <Btn small ghost disabled={busy}
                  onClick={() => set確かめ({ del: d })}>{DELETE_ONE}</Btn>
              </span>
            )
      }>
      {d.name}
      <div style={小}>
        {d.student_number}
        {d.grade_year != null ? `　${d.grade_year}年` : ""}
        {divisionNameOf && d.division_id ? `　${divisionNameOf(d.division_id) || ""}` : ""}
      </div>
    </Li>
  );

  return (
    <div style={{ fontFamily: FONT_STACK }} data-v2-drafts="1">
      <H3>{DRAFT_HEAD}　{いま.length}件</H3>
      <p style={{ ...小, margin: "-4px 0 8px" }}>{DRAFT_SUB}</p>

      {いま.length === 0 ? (
        <EmptyBox title={DRAFT_EMPTY} sub={DRAFT_EMPTY_SUB} />
      ) : (
        <>
          {まだ.length > 1 ? (
            <div style={{ marginBottom: rem(8) }}>
              <Btn disabled={busy}
                onClick={() => set確かめ({ all: まだ })}>
                {INVITE_ALL}（{まだ.length}人）</Btn>
            </div>
          ) : null}
          <Card style={{ padding: 0, maxWidth: 640 }}>{いま.map(ひとり)}</Card>
        </>
      )}

      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      {/* ★★★古い ものは 畳みます。★消して いません。 */}
      {畳.length ? (
        <>
          <div style={{ marginTop: rem(10) }}>
            <Btn ghost small onClick={() => set古い((v) => !v)}>
              {古い ? OLD_CLOSE : `${OLD_OPEN}（${畳.length}件）`}
            </Btn>
          </div>
          {古い ? (
            <>
              <H3>{OLD_HEAD}　{畳.length}件</H3>
              <p style={{ ...小, margin: "-4px 0 6px" }}>{OLD_SUB}</p>
              <Card style={{ padding: 0, maxWidth: 640 }}>{畳.map(ひとり)}</Card>
            </>
          ) : null}
        </>
      ) : null}

      <Note>
        {INVITE_NOTE.map((n) => (
          <span key={n.text} style={{ display: "block" }}>{n.text}</span>
        ))}
      </Note>

      {確かめ ? (
        <Ask
          title={確かめ.all ? inviteAllAsk(確かめ.all.length)
            : 確かめ.del ? `${確かめ.del.name} の 下書きを 消します。`
              : `${確かめ.one.name} に お送りします。`}
          name={確かめ.all ? "" : (確かめ.del || 確かめ.one).name}
          note={確かめ.del ? DELETE_ASK_NOTE : INVITE_ASK_NOTE}
          danger={!!確かめ.del}
          okLabel={確かめ.del ? DELETE_ONE : INVITE_ONE}
          onOk={() => {
            if (確かめ.all) { if (onInviteAll) onInviteAll(確かめ.all); }
            else if (確かめ.del) { if (onDelete) onDelete(確かめ.del); }
            else if (onInvite) onInvite(確かめ.one);
            set確かめ(null);
          }}
          onCancel={() => set確かめ(null)} />
      ) : null}
    </div>
  );
}
