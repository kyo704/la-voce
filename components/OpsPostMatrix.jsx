"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
// ★★すべり・貼り付け・色の 決めは 1本 です（★裁定 その81）。
import { TABLE_CLASS, ANCHOR_CLASSES, v } from "@/lib/visualTokens";
import { PERMS, permLabel } from "@/lib/opsPerms";
import {
  rowLocked, rowLockedReason, rowIsPersonal, NAV_ROW_HEAD, navOf, hasPerm
} from "@/lib/opsPostMatrix";
import { tx } from "@/lib/t";

// ============================================================================
// ★役職 × できこと の 表（★裁定 その75 修正・2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `stPost()`
//
//   ★★★930px 以上 でしか 出しません。★出し分けは 呼ぶ 側が します。
//     ★★表の 実の 幅は 905px です（★測りました）。
//     ★★それ 未満では 横に すべります。★すべらせません。
//
//   ★★★押せない マスの 出し方 ── ★Option_B（★坂本さんの お決め）。
//     ★★丸は 出します。★あれは「持って いるか」の しるし です。
//     ★★けれど 押せる ようには 見せません（★枠も 影も 付けません）。
//     ★★行の 頭に、★動かせない わけを 1行 置きます。
//     ★★★押して から わけを 知る、を なくします。
//
//   ★★決めは lib/opsPostMatrix.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-post-matrix.test.js
// ============================================================================

const 罫 = `1px solid ${C.line}`;

export default function OpsPostMatrix({
  posts = [], countByPost = {}, myPerms, myPostId = null, onToggle, onOpen, busy
}) {
  if (posts.length === 0) return null;

  return (
    /* ★★★すべりと 貼り付けは `.tblwrap` が 持ちます（★裁定 その81 §5-1）。
         ★★名簿の 表と 同じ 1本の 決め です。★ここでは 決めません。 */
    <div className={TABLE_CLASS} style={{ fontFamily: FONT_STACK }}>
      <table style={{ borderCollapse: "collapse", minWidth: 905, width: "100%" }}>
        <thead>
          <tr>
            {/* ★★左の 列が「錨」です。★横に すべっても、★どの できことの 行かが 残ります。 */}
            <th className={ANCHOR_CLASSES[1]} style={{
              minWidth: 245, textAlign: "left", padding: `${rem(9)} ${rem(10)}`,
              borderBottom: 罫, ...TYPE.mini, color: C.inkSoft, fontWeight: 400
            }}>{tx("できること")}</th>
            {posts.map((p) => (
              <th key={p.id} style={{
                minWidth: 66, textAlign: "center", padding: `${rem(9)} ${rem(4)}`,
                borderBottom: 罫
              }}>
                {/* ★★役職の 名を 押すと、★その 役職 1つの 画面へ（★見本の とおり）。 */}
                <button type="button" onClick={() => onOpen && onOpen(p.id)}
                  style={{
                    background: "transparent", border: "none", padding: 0,
                    ...TYPE.mini, color: C.curtain, fontWeight: 700,
                    minHeight: 32, fontFamily: FONT_STACK
                  }}>{p.name}</button>
                <div style={{ ...TYPE.mini, color: C.inkSoft, fontWeight: 400 }}>
                  {tx("{n}人").replace("{n}", countByPost[p.id] || 0)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMS.map((k) => {
            const 動かせない = rowLocked(myPerms, k.key);
            const わけ = rowLockedReason(myPerms, k.key);
            const 自分だけ = rowIsPersonal(k.key);
            return (
              <tr key={k.key} style={{ background: 自分だけ ? C.paper : "transparent" }}>
                <td className={ANCHOR_CLASSES[1]} style={{
                  padding: `${rem(9)} ${rem(10)}`, borderBottom: 罫,
                  ...TYPE.usual, color: C.ink, lineHeight: 1.5
                }}>
                  {permLabel(k.key)}
                  {自分だけ ? (
                    <div style={{ ...TYPE.mini, color: C.inkSoft }}>
                      {tx("その方 自身にだけ かかります")}
                    </div>
                  ) : null}
                  {/* ★★★動かせない わけは、★行の 頭に（★Option_B）。
                      ★★押す 前に 分かります。★1行で、★その 行の 10マスが 分かります。 */}
                  {わけ ? (
                    <div style={{ ...TYPE.mini, color: C.inkSoft }}>{わけ}</div>
                  ) : null}
                </td>
                {posts.map((p) => {
                  const 持ってる = hasPerm(p, k.key);
                  const 自分の役職 = !!myPostId && p.id === myPostId;
                  const 押せる = !動かせない
                    && !(k.key === "monka_read" && 自分の役職);
                  const 丸 = (
                    <span style={{
                      fontSize: rem(15), fontWeight: 持ってる ? 700 : 400,
                      /* ★★★持って いない ことを 示す ○（★裁定 その84 PRIORITY_2）。
                           ★★`C.line` は 線の 色 です。★1.21。★しるしの 目安 3.0 に 届きません。
                           ★★`--ink4`（5.12）に します。★殻の 中 なので 名前で 呼べます。 */
                      color: 持ってる ? C.curtain : v("ink4")
                    }}>{持ってる ? "●" : "○"}</span>
                  );
                  return (
                    <td key={p.id} style={{
                      textAlign: "center", borderBottom: 罫,
                      /* ★★★色を 直に 書きません（★裁定 その81 §1-3・§6）。
                          ★★`#F6E4E8` は `--pick`（選んで いる）そのもの でした。
                          ★★名前で 呼ぶと、★暗い 画面でも 付いて 来ます。 */
                      background: 持ってる ? v("pick") : "transparent",
                      padding: 0
                    }}>
                      {/* ★★★押せない ときは、★押せる ように 見せません。
                          ★★札に しません。★丸だけ 置きます。
                          ★★わけは 行の 頭に あります。★ここで 言いません。 */}
                      {押せる ? (
                        <button type="button" disabled={busy}
                          onClick={() => onToggle && onToggle(p.id, k.key, !持ってる)}
                          style={{
                            width: "100%", minHeight: 44, background: "transparent",
                            border: "none", cursor: "pointer", fontFamily: FONT_STACK
                          }}>{丸}</button>
                      ) : (
                        <div style={{
                          minHeight: 44, display: "flex",
                          alignItems: "center", justifyContent: "center"
                        }}>{丸}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* ★★見本の 最下段。★その 役職で どの 帯が 出るか。 */}
          <tr style={{ background: C.paper }}>
            <td style={{
              padding: `${rem(9)} ${rem(10)}`, ...TYPE.mini, color: C.inkSoft
            }}>{NAV_ROW_HEAD}</td>
            {posts.map((p) => (
              <td key={p.id} style={{
                textAlign: "center", padding: `${rem(9)} ${rem(4)}`,
                ...TYPE.mini, color: C.inkSoft, lineHeight: 1.6
              }}>
                {navOf(p.perms).map((t) => (<div key={t}>{t}</div>))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
