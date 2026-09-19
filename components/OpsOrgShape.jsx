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

      <Usu>上から 順に 足して ください。学科は、学部の 下に つきます。</Usu>
      {KINDS.map((k, ki) => {
        const 並 = ofKind(rows, k.key);
        const 親候補 = k.parent ? ofKind(rows, k.parent) : [];
        const 名 = draft[k.key] || "";
        // ★★★上が 1つ しか 無ければ、★はじめから それを 選んで おきます
        //   （★2026-09-19・実機の ご報告 ──「手順が 分かりにくい」）。
        //   ★★1つ しか 無い ものを 選ばせるのは、★手間 だけ です。
        const 親 = parent[k.key] || (親候補.length === 1 ? 親候補[0].id : null);
        const 足せる = mayEdit && mayAdd(rows, k.key, 名, 親);
        return (
          <div key={k.key}>
            {/* ★★★順を 数で 書きます（★2026-09-19・実機の ご報告）。
                ★★「学部 → 学科」の 順に 足して いただく ことが、
                  ★★題からは 分かりません でした。 */}
            <H3>{`${ki + 1}　${k.label}`}　<span style={小}>{並.length}つ</span></H3>
            {k.parent && 親候補.length === 0 ? (
              <Usu>{`先に 上の「${(KINDS.find((x) => x.key === k.parent) || {}).label}」を 足して ください。`}</Usu>
            ) : null}
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
                {k.parent && 親候補.length > 1 ? (
                  <>
                    <FieldLabel>どの {(KINDS.find((x) => x.key === k.parent) || {}).label} の 下に 置きますか</FieldLabel>
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
                {k.parent && 親候補.length === 1 ? (
                  <Usu>{`「${親候補[0].name}」の 下に 足します。`}</Usu>
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
