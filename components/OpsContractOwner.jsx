"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note, Btn, Li, Warn, Ask, H3, EmptyBox } from "@/components/UiV2";
import {
  CONTRACT_HEAD, CONTRACT_SUB, CONTRACT_NOW, CONTRACT_PICK, CONTRACT_DO,
  CONTRACT_NONE, CONTRACT_NONE_HOW, CONTRACT_ASK_NOTE, candidates
} from "@/lib/orgContract";

// ============================================================================
// ★契約者を 変える（★裁定 その116・2026-09-20）
//
//   ★★★指名できるのは、★いまの 契約者 だけ です。
//   ★★★相手は、★その 学校に 居て、★`master` を 持つ 方 だけ です。
//     ★★契約を 引き継ぐ 以上、★学校 ぜんぶを 扱える 必要が あります。
//   ★★★押すと、★その場で 移ります。★承諾を 待ちません（★裁定 その74B と 同じ）。
//     ★★待つ あいだ、★契約者が 決まりません。★それが いちばん 危ない です。
//   ★★★取り消せません。★だから 押す 前に 一度 お尋ねします。
//
//   ★★決めは lib/orgContract.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/org-contract.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsContractOwner({
  members = [], permsOf, meId, nowName, nameOf, busy, error = "", done = "", onTransfer
}) {
  const [選び, set選び] = useState(null);
  const [確かめ, set確かめ] = useState(null);
  const 候補 = candidates(members, permsOf, meId);

  return (
    <div style={{ fontFamily: FONT_STACK, marginTop: 16 }} data-v2-contract="1">
      <H3>{CONTRACT_HEAD}</H3>
      <p style={{ ...小, margin: "-4px 0 8px" }}>{CONTRACT_SUB}</p>

      <Card>
        <p style={{ ...小, margin: 0 }}>{CONTRACT_NOW}</p>
        <p style={{ ...TYPE.li, color: C.ink, margin: "2px 0 0", fontWeight: 700 }}>
          {nowName || "—"}
        </p>
      </Card>

      {候補.length === 0 ? (
        <EmptyBox title={CONTRACT_NONE} sub={CONTRACT_NONE_HOW} />
      ) : (
        <>
          <H3>{CONTRACT_PICK}</H3>
          <Card style={{ padding: 0, maxWidth: 640 }}>
            {候補.map((mm, i) => (
              <Li key={mm.user_id} last={i === 候補.length - 1}
                onClick={busy ? undefined : () => set選び(mm)}
                style={選び && 選び.user_id === mm.user_id ? { background: C.paper } : undefined}
                right={<span style={小}>
                  {選び && 選び.user_id === mm.user_id ? "● 選んで います" : "選ぶ"}
                </span>}>
                {nameOf ? nameOf(mm.user_id) : ""}
              </Li>
            ))}
          </Card>
          <Warn>{CONTRACT_ASK_NOTE}</Warn>
          <div style={{ marginTop: rem(10) }}>
            <Btn disabled={busy || !選び} onClick={() => set確かめ(選び)}>{CONTRACT_DO}</Btn>
          </div>
        </>
      )}

      {done ? <p style={{ ...小, margin: "8px 0 0", color: C.sage }}>{done}</p> : null}
      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      <Note>
        <span style={{ display: "block" }}>
          引き継げるのは、この学校で 学校ぜんぶの 札を 持つ方 だけです。
        </span>
        <span style={{ display: "block" }}>
          契約者は、引き継いで からでないと 退会できません。
        </span>
        <span style={{ display: "block" }}>
          契約者は、役職では ありません。学校では 渡せません。
        </span>
      </Note>

      {確かめ ? (
        <Ask
          title={`${nameOf ? nameOf(確かめ.user_id) : ""} さんに 引き継ぎます。`}
          name={nameOf ? nameOf(確かめ.user_id) : ""}
          note={CONTRACT_ASK_NOTE}
          danger
          okLabel={CONTRACT_DO}
          onOk={() => { if (onTransfer) onTransfer(確かめ); set確かめ(null); }}
          onCancel={() => set確かめ(null)} />
      ) : null}
    </div>
  );
}
