"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Back, Card, Note } from "@/components/UiV2";
// ★★運営の 表は みな 同じ 入れ物に 入れます（★見張り `table-stick`）。
//   ★★横に はみ出す ときの 動きを、★1か所で 決めて います。
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import {
  COLS_PERM_LOG, HEAD, SUB, BACK_LABEL, COLUMNS, rowsOf,
  EMPTY_HEAD, EMPTY_SUB, NOTES
} from "@/lib/permLog";
import { tx } from "@/lib/t";

// ============================================================================
// ★役職を 変えた 記録（★裁定194・2026-09-24）── ★見本 `P_permLog`
//
//   ★★★「消しません」と 決めた 記録に、★読む 画面を 付けます。
//     ★★読めない 記録は 守りに なりません。
//
//   ★★★誰が 読めるかは **台帳** が 決めます（`org_post_perm_log_select`）。
//     ★★ここでは 絞りません。★絞ると 決めが 2か所に なります。
//     ★★読めない 方には **0行** が 返ります。★その ときは「まだ ありません」と
//       ★出ます ── ★「見せません」とは 書きません（★在る／無いを 教えません）。
//
//   ★★決めは 1つも ここで 作りません ── ★字も 組み立ても `lib/permLog.js`。
//
//   ★見張り components/tests/perm-log.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsPermLog({ supabase, orgId, nameOf, onBack }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !orgId) return;
    try {
      const { data, error: e } = await supabase
        .from("org_post_perm_log").select(COLS_PERM_LOG)
        .eq("org_id", orgId)
        .order("changed_at", { ascending: false })
        .limit(200);
      if (e) throw e;
      setRows(data || []);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, orgId]);

  useEffect(() => { 読む(); }, [読む]);

  const 並 = rowsOf(rows, nameOf);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {onBack ? <Back onClick={onBack}>{tx(BACK_LABEL)}</Back> : null}
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(HEAD)}</h2>
      <p style={{ ...小, margin: `0 0 ${rem(10)}` }}>{tx(SUB)}</p>

      {並.length === 0 ? (
        <>
          <p style={{ ...TYPE.li, color: C.ink, margin: `0 0 ${rem(4)}` }}>{tx(EMPTY_HEAD)}</p>
          <p style={小}>{tx(EMPTY_SUB)}</p>
        </>
      ) : (
        <Card style={{ padding: 0 }}>
          <div className={TABLE_CLASS}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...TYPE.li }}>
            <thead>
              <tr>
                {COLUMNS.map((c, i) => (
                  <th key={c} className={i === 0 ? ANCHOR_CLASSES.head : undefined} style={{
                    textAlign: "left", padding: `${rem(8)} ${rem(10)}`,
                    borderBottom: `1px solid ${C.line}`, color: C.inkSoft,
                    whiteSpace: "nowrap", fontWeight: 400
                  }}>{tx(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {並.map((r, i) => (
                <tr key={r.id}>
                  {[r.who, r.when, r.post, r.what].map((v, j) => (
                    <td key={j} className={j === 0 ? ANCHOR_CLASSES.cell : undefined} style={{
                      padding: `${rem(8)} ${rem(10)}`, color: C.ink, verticalAlign: "top",
                      borderBottom: i === 並.length - 1 ? "none" : `1px solid ${C.line2}`,
                      whiteSpace: j === 3 ? "normal" : "nowrap"
                    }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* ★★3行 とも 確かめて から 書いて います（★わけは lib の 覚え書き）。 */}
      <Note style={{ marginTop: rem(10) }}>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{tx(t)}</span>
        ))}
      </Note>

      {error ? (
        <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(10) }}>{error}</p>
      ) : null}
    </div>
  );
}
