"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, Ask } from "@/components/UiV2";
import {
  GO_DETAIL, CLOSE_POSTING, CLOSE_ASK, CLOSE_ASK_SUB, CLOSE_OK, CLOSE_CANCEL,
  NOTES, NOTES_BOLD, NOT_YET, isAsking, wordOf, headOf, inGivenOrder
} from "@/lib/chooseApplicant";
import { tx } from "@/lib/t";

// ============================================================================
// ★応募を 選ぶ（★見本 `SC['応募を選ぶ']`・裁定 その94 §4e）
//
//   ★★★並べ替えません。★もらった 順（＝応募の 順）で 出します。
//     ★★実績の 順に しません（★裁定 その95）。
//   ★★★たずねられて いる ものは、★色で 分かります。
//     ★★数えません。★上に 寄せません。★印を 付けるだけ です。
//
//   ★見張り components/tests/choose-applicant.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function ChooseApplicant({
  rows = [], onOpen, onClose, onClosePosting, busy, error = "", loadError = ""
}) {
  const [聞く, set聞く] = useState(false);
  const 並 = inGivenOrder(rows);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={headOf(並)} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      {loadError ? <p style={{ ...小, color: C.curtain }}>{loadError}</p> : null}

      {並.length > 0 ? (
        <Card>
          {並.map((r, i) => (
            <Li key={r.id} last={i === 並.length - 1}
              onClick={onOpen ? () => onOpen(r) : undefined}
              right={onOpen ? <span style={小}>{GO_DETAIL} ›</span> : null}>
              <span>
                {r.applicant_display_name || tx("お名前が ありません")}
                {/* ★★学んだ ところ。★ご本人が 見せると 選んだ ときだけ 来ます。 */}
                {r.applicant_school ? (
                  <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                    {r.applicant_school}
                  </span>
                ) : null}
                {/* ★★たずねられて いる ものは 色を 変えます（★§4c）。 */}
                <span style={{
                  display: "block", ...TYPE.mini,
                  color: isAsking(r) ? C.curtain : C.ink4
                }}>{wordOf(r)}</span>
              </span>
            </Li>
          ))}
        </Card>
      ) : null}

      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p> : null}

      {/* ★★★終わりに する ── ★取り消せない ので、★1度 お尋ねします。
           ★★消す のでは ありません。★一覧から 外れる だけ です。 */}
      {onClosePosting ? (
        <Btn ghost disabled={busy} onClick={() => set聞く(true)}
          style={{ marginTop: rem(10) }}>{CLOSE_POSTING}</Btn>
      ) : null}

      {聞く ? (
        <Ask title={CLOSE_ASK} note={CLOSE_ASK_SUB}
          okLabel={CLOSE_OK}
          onOk={() => { set聞く(false); if (onClosePosting) onClosePosting(); }}
          onCancel={() => set聞く(false)} />
      ) : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>
            {t.indexOf(NOTES_BOLD) >= 0 ? (
              <>
                {t.slice(0, t.indexOf(NOTES_BOLD))}
                <b style={{ color: C.ink }}>{NOTES_BOLD}</b>
              </>
            ) : t}
          </span>
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
