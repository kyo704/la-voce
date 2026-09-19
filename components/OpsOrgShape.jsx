"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { H3, Box, Li, Note, Usu, Warn, FieldLabel, Input } from "@/components/UiV2";
import {
  HEAD, LEAD, KINDS, GRADE_NOT_HERE, NOTES,
  ofKind, parentNameOf, mayAdd, whyCannotAdd, mayDelete, whyCannotDelete
} from "@/lib/orgDivisions";

// ============================================================================
// ★学校の 形 ── ★見本 `stOrg`（★裁定 その98 BLOCKER_1・2026-09-19）
//
//   ★★★見本は 4つ 出して います（学部・学科・学年・事務の 分野）。
//     ★★台帳の 構えは 3つ です。★学年は いま 名簿の 中に あります。
//     ★★★無い ものの 欄を 置きません。★「ここでは 足せません」と 書きます。
//
//   ★★決めは lib/orgDivisions.js が 持ちます。★ここでは 決めません。
//     ★★足せるか・消せるか・なぜ だめか、すべて あちら です。
//
//   ★見張り components/tests/org-divisions.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsOrgShape({
  rows = [], usedCount, mayEdit, onAdd, onRemove, saving, error = ""
}) {
  const [draft, setDraft] = useState({});
  const [parent, setParent] = useState({});

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <H3>{HEAD}</H3>
      <Warn>{LEAD}</Warn>

      {KINDS.map((k) => {
        const 並 = ofKind(rows, k.key);
        const 親候補 = k.parent ? ofKind(rows, k.parent) : [];
        const 名 = draft[k.key] || "";
        const 親 = parent[k.key] || null;
        const 足せる = mayEdit && mayAdd(rows, k.key, 名, 親);
        return (
          <div key={k.key}>
            <H3>{k.label}　<span style={小}>{並.length}つ</span></H3>
            {並.length > 0 ? (
              <Box>
                {並.map((r, i) => {
                  const n = usedCount ? usedCount(r) : 0;
                  const 消せる = mayEdit && mayDelete(rows, r, n);
                  return (
                    <Li key={r.id} last={i === 並.length - 1}
                      right={消せる ? "消す" : (n > 0 ? `${n}人` : "")}
                      onClick={消せる ? () => onRemove && onRemove(r) : null}>
                      {r.name}
                      {k.parent ? (
                        <div style={小}>{parentNameOf(rows, r) || "（上が ありません）"}</div>
                      ) : null}
                      {!消せる && mayEdit ? (
                        <div style={小}>{whyCannotDelete(rows, r, n)}</div>
                      ) : null}
                    </Li>
                  );
                })}
              </Box>
            ) : null}

            {mayEdit ? (
              <div style={{ marginTop: rem(6) }}>
                {k.parent && 親候補.length > 0 ? (
                  <>
                    <FieldLabel>上に つく もの</FieldLabel>
                    <Box>
                      {親候補.map((p, i) => (
                        <Li key={p.id} last={i === 親候補.length - 1}
                          right={親 === p.id ? "えらびました" : "これに する"}
                          onClick={() => setParent((v) => ({ ...v, [k.key]: p.id }))}>
                          {p.name}
                        </Li>
                      ))}
                    </Box>
                  </>
                ) : null}
                <FieldLabel>{k.hint}</FieldLabel>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Input value={名} placeholder={k.hint}
                      onChange={(e) =>
                        setDraft((v) => ({ ...v, [k.key]: e.target.value }))} />
                  </div>
                  <button type="button" disabled={saving || !足せる}
                    onClick={async () => {
                      const ok = await onAdd({ kind: k.key, name: 名.trim(), parent_id: 親 });
                      if (ok !== false) setDraft((v) => ({ ...v, [k.key]: "" }));
                    }}
                    style={{
                      flex: "none", minHeight: 44, padding: `0 ${rem(16)}`,
                      borderRadius: 999, border: `1px solid ${C.curtain}`,
                      background: 足せる ? C.curtain : C.line, color: "#FFFDF8",
                      ...TYPE.mini, fontFamily: FONT_STACK
                    }}>足す</button>
                </div>
                {名 && !足せる ? (
                  <Usu>{whyCannotAdd(rows, k.key, 名, 親)}</Usu>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* ★★★学年は ここに ありません。★無い ものの 欄を 置きません。 */}
      <H3>学年</H3>
      <Usu>{GRADE_NOT_HERE}</Usu>

      {error ? (
        <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
      ) : null}
      {saving ? <p style={小}>書いて います…</p> : null}
      <Note>{NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>
    </div>
  );
}
