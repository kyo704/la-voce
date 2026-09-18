"use client";
// ============================================================================
// ★ひとと 役職（★見本 `P_settei` の 節 11 `stPeople`）
//
//   ★出どころ　裁定 その72 以降の 第2群（★2026-09-18・坂本さん 承認）
//
//   ★★ここが いま、★いちばん 詰まって いた ところ です ──
//     ★★役職（できこと）を **作れる**のに、★**人に 付けられません** でした。
//     ★★`OpsPosts` は 役職の **型**を 作る 画面 です。
//     ★★A2 で できことの 道が 1本に なった いま、★この 1枚が 要ります。
//
//   ★★★見本は 6列 です ── お名前／学部・研究科／学科・コース／事務の 分野／
//     役職／確かめ。★けれど 台帳に **4列が ありません**（★照会で 確定）。
//     ★★だから 出すのは **2列 だけ** です（★坂本さんの お決め ㋑）。
//     ★★★空の 列を 並べません。★「まだ 入れて いない だけ」に 見えます。
//       ★★本当は「置き場が 無い」です。★ちがう ことを 伝えます。
//     ★★4列と「学校の 形」の 画面は、★台帳に 引き金つきで 残して あります。
//
//   ★見張り components/tests/ops-people.test.js
// ============================================================================

import { useState } from "react";
import { C } from "@/lib/tokens";
import { mayChangePerson, mayGrantPost, permSet, can } from "@/lib/opsPerms";

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 };
const row = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 10, padding: "11px 12px", borderTop: `1px solid ${C.line}`
};
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★絞りの 札。★見本の `chip` と 同じ 考えです。 */
function Chip({ on, children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      fontSize: "0.6875rem", padding: "4px 10px", borderRadius: 999,
      border: `1px solid ${on ? C.curtain : C.line}`,
      background: on ? C.curtain : "transparent",
      color: on ? "#FFFDF8" : C.inkSoft, cursor: "pointer"
    }}>{children}</button>
  );
}

/**
 * @param members    その学校の memberships の 行
 * @param posts      その学校の org_posts の 行
 * @param nameOf     user_id → お名前（★読めなければ 空）
 * @param myPerms    自分の できこと
 * @param busy       送って いる あいだ true
 * @param onAssign   (userId, postId | null) => Promise
 */
export default function OpsPeople({
  members, posts, nameOf, myPerms, busy, onAssign, nameFetchFailedLabel
}) {
  const [filter, setFilter] = useState({ k: "全て", v: "" });
  const [open, setOpen] = useState(null);   // ★いま 開いて いる 方の user_id
  const [failed, setFailed] = useState(false);

  const list = (members || []).filter((m) => m && m.user_id);
  const byId = Object.fromEntries((posts || []).map((p) => [p.id, p]));
  const shown = filter.k === "役職"
    ? list.filter((m) => (byId[m.post_id] || {}).name === filter.v)
    : list;

  // ★★「変えられるか」は lib が 決めます。★ここで 役職の 名を くらべません。
  const canChange = (m) => mayChangePerson(myPerms, byId[m.post_id] || null);

  const target = open ? list.find((m) => m.user_id === open) : null;

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: 0 }}>
          ひとと 役職
        </p>
        <span style={small}>{shown.length}／{list.length}</span>
      </div>

      {/* ★★絞り。★見本は 6つ ありますが、★いま 出せるのは 2つ です。
          ★★学部・学科・分野・未確認は、★台帳に 置き場が ありません。
            ★★出すと「まだ 入れて いない だけ」に 見えます。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Chip on={filter.k === "全て"} onClick={() => setFilter({ k: "全て", v: "" })}>
          全て
        </Chip>
        {(posts || []).map((p) => (
          <Chip key={p.id} on={filter.k === "役職" && filter.v === p.name}
            onClick={() => setFilter({ k: "役職", v: p.name })}>{p.name}</Chip>
        ))}
      </div>

      <div style={card}>
        {shown.length === 0 ? (
          <p style={{ ...small, padding: 22, textAlign: "center", margin: 0 }}>
            この 絞りに あう方は いません
          </p>
        ) : shown.map((m, i) => {
          const post = byId[m.post_id] || null;
          const ok = canChange(m);
          return (
            <div key={m.user_id} style={{ ...row, borderTop: i === 0 ? "none" : row.borderTop }}>
              <span style={{ fontSize: "0.8125rem", color: C.ink, minWidth: 0 }}>
                {nameOf(m.user_id) || nameFetchFailedLabel || ""}
              </span>
              {/* ★★押せない 方には、★押しどころを 出しません（★§8⑤）。
                  ★★見本は 押すと「あなたの 役職では 変えられません」と 出します。
                    ★★こちらは **出さない** ほうに しました ──
                      ★押せる ように 見せて 断るより、★はじめから 出さない。 */}
              {ok ? (
                <button type="button" disabled={busy}
                  onClick={() => { setFailed(false); setOpen(m.user_id); }}
                  style={{
                    fontSize: "0.75rem", color: C.curtain, background: "none",
                    border: "none", cursor: busy ? "default" : "pointer", padding: 0
                  }}>
                  {post ? post.name : "役職なし"} ›
                </button>
              ) : (
                <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {post ? post.name : "役職なし"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ★★役職を 変える 1枚。★別の 画面に せず、★同じ ところで 開きます。 */}
      {target ? (
        <div style={{ ...card, padding: 12 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            {nameOf(target.user_id) || nameFetchFailedLabel || ""} の 役職
          </p>
          {(posts || []).map((p) => {
            // ★★付けられるかは lib が 決めます（★自分より 強い 人を 作れない）。
            const grantable = mayGrantPost(myPerms, p);
            return (
              <div key={p.id} style={row}>
                <span style={{ fontSize: "0.8125rem", color: grantable ? C.ink : C.inkSoft }}>
                  {p.name}
                </span>
                {grantable ? (
                  <button type="button" disabled={busy}
                    onClick={async () => {
                      const r = await onAssign(target.user_id, p.id);
                      if (r === false) { setFailed(true); return; }
                      setFailed(false); setOpen(null);
                    }}
                    style={{
                      fontSize: "0.75rem", color: C.curtain, background: "none",
                      border: "none", cursor: busy ? "default" : "pointer", padding: 0
                    }}>
                    {target.post_id === p.id ? "いま この 役職" : "この 役職に する"}
                  </button>
                ) : (
                  // ★★渡せない わけを 隠しません（★裁定 §7-4）。
                  <span style={small}>あなたが 持って いない できことは、渡せません。</span>
                )}
              </div>
            );
          })}
          <div style={row}>
            <span style={{ fontSize: "0.8125rem", color: C.ink }}>役職を 外す</span>
            <button type="button" disabled={busy}
              onClick={async () => {
                const r = await onAssign(target.user_id, null);
                if (r === false) { setFailed(true); return; }
                setFailed(false); setOpen(null);
              }}
              style={{
                fontSize: "0.75rem", color: C.curtain, background: "none",
                border: "none", cursor: busy ? "default" : "pointer", padding: 0
              }}>外す</button>
          </div>
          {/* ★★できなかった ことを、★画面に 出します。★黙って 閉じません。 */}
          {failed ? (
            <p style={{ ...small, color: C.curtain, margin: "8px 2px 0" }}>
              変えられませんでした。時間を おいて、もう一度 お試しください。
            </p>
          ) : null}
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => { setFailed(false); setOpen(null); }}
              style={{
                fontSize: "0.75rem", color: C.inkSoft, background: "none",
                border: "none", cursor: "pointer", padding: 0
              }}>閉じる</button>
          </div>
        </div>
      ) : null}

      {/* ★★出して いない 4列に ついて、★黙って いません。
          ★★「無い」ことを 言わないと、★お客さまは「壊れて いる」と 読みます。 */}
      <p style={small}>
        学部・学科・事務の 分野・確かめは、まだ お作りして いません。
      </p>
    </div>
  );
}
