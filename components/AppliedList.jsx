"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Li, H3 } from "@/components/UiV2";
import {
  HEAD, NOW_HEAD, ENDED_HEAD, EMPTY, NOTES, NOT_YET,
  split, replyLine, stateLine, endedLine
} from "@/lib/appliedList";
import { tx } from "@/lib/t";

// ============================================================================
// ★応募した 募集（★見本 `SC['応募した募集']`・裁定 その94 §4c）
//
//   ★★★字も 決めも lib/appliedList.js が 持ちます。★ここでは 決めません。
//   ★★★終わった わけを 出しません。★台帳も 返しません。
//     ★★誰に 決まったかを 知らせません。★比べる もとを 作りません。
//   ★★★お知らせを 送りません（★裁定 その87）。★開いた ときに 見えます。
//
//   ★見張り components/tests/applied-list.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function AppliedList({ rows = [], onClose, loadError = "" }) {
  const { now, ended } = split(rows);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      {loadError ? <p style={{ ...小, color: C.curtain }}>{loadError}</p> : null}

      <H3>{NOW_HEAD}</H3>
      <Card>
        {now.length === 0 ? (
          <p style={{ ...小, margin: 0 }}>{EMPTY}</p>
        ) : now.map((r, i) => {
          const 返 = replyLine(r);
          return (
            <Li key={r.id} last={i === now.length - 1}>
              <span>
                {r.posting_title || r.posting_kind || ""}
                <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                  {stateLine(r)}
                </span>
                {/* ★★たずねた 人にだけ 出します（★たずねて いない 人に
                     ★★「お返事は ありません」を 出すと、★待って いる ように 見えます）。 */}
                {返 ? (
                  <span style={{
                    display: "block", ...TYPE.mini,
                    color: r.reply_template_key ? C.curtain : C.inkSoft
                  }}>{返}</span>
                ) : null}
              </span>
            </Li>
          );
        })}
      </Card>

      {/* ★★1件も 無い ときは、★節ごと 出しません（★裁定 その73）。
           ★★これは **中身** の 話 です。★入口の 話では ありません。 */}
      {ended.length > 0 ? (
        <>
          <H3>{ENDED_HEAD}</H3>
          <Card>
            {ended.map((r, i) => (
              <Li key={r.id} last={i === ended.length - 1}>
                <span style={{ color: C.ink4 }}>
                  {r.posting_title || r.posting_kind || ""}
                  <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                    {endedLine(r)}
                  </span>
                </span>
              </Li>
            ))}
          </Card>
        </>
      ) : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{t}</span>
        ))}
      </Note>

      <div style={{ marginTop: rem(10) }}>
        {NOT_YET.map((x) => (
          <p key={x.key} style={{ ...小, margin: 0 }}>
            {x.label}　……　{tx("まだ できません")}
          </p>
        ))}
      </div>
    </div>
  );
}
