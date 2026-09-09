"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import {
  NOTE_KINDS, DEFAULT_KIND, kindOrDefault, visibleNotes, isRenrakuKind,
  titleOf, previewOf, isEmpty, dayWord, AUTOSAVE_MS
} from "@/lib/notes";

// ============================================================================
// ノート ── Apple メモ方式（見本⑥ ／ 2026-09-09）
//
//   ★出どころ docs/opus/woolsong-見本-画面11点（9月9日）.png ⑥
//     「★タイトル欄は ありません。★保存ボタンも ありません。」
//     「★開いてから 1文字目までを、★いちばん短く。」
//
//   ★★だから、★＋を 押した その場で 書けます。
//     ★名前を 先に 聞きません。★帯を 選ばせません（★いま見ている帯に 入ります）。
//
//   ★★保存ボタンが ありません。★黙って 上書きします。
//     ★★だから、★消えないことに いちばん 気を配ります。
//       ★手が 止まってから 送ります。
//       ★★閉じるとき・画面を 離れるときは、★待たずに 送ります。
//       ★送れなかったら、★開いたまま に します。★黙って 閉じません。
//
//   ★★消しても、★行を 消しません（★deleted_at を 入れるだけ）。
//
//   ★数と 決めは lib/notes.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/notes.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

export default function NotesV2({ notes, onSave, onDelete, saving, renraku }) {
  const [kind, setKind] = useState(DEFAULT_KIND);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);   // ★{ id, body } ★null なら 一覧
  const [error, setError] = useState("");
  const timer = useRef(null);
  const boxRef = useRef(null);

  const list = visibleNotes(notes, kind, q);

  // ★★開いたら、★すぐ 書けます（★見本⑥「1文字目までを いちばん短く」）。
  useEffect(() => {
    if (editing && boxRef.current) boxRef.current.focus();
  }, [editing && editing.id]);

  // ★★手が 止まってから 送ります。★打っている あいだは 送りません。
  useEffect(() => {
    if (!editing) return undefined;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void push(editing); }, AUTOSAVE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [editing && editing.body]);

  async function push(draft) {
    if (!draft || !onSave) return true;
    // ★★何も 書いていないものは、★送りません。★空の行を 作りません。
    if (isEmpty(draft)) return true;
    const ok = await onSave({ id: draft.id, kind, body: draft.body });
    if (!ok) { setError("まだ送れていません。開いたままにしています。"); return false; }
    setError("");
    return true;
  }

  async function close() {
    // ★★閉じるときは、★待たずに 送ります。
    if (timer.current) clearTimeout(timer.current);
    const ok = await push(editing);
    // ★★送れなかったら、★開いたまま に します。★黙って 閉じません。
    if (ok) { setEditing(null); setError(""); }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {/* ★★「もどる」で 閉じます。★「保存」は ありません。 */}
          <button type="button" onClick={close}
            style={{
              minHeight: 44, border: "none", background: "transparent",
              color: C.curtain, fontSize: "0.875rem", padding: 0
            }}>‹ もどる</button>
          <span style={small}>{saving ? "書いています" : ""}</span>
        </div>
        {/* ★★タイトルの 欄が ありません。★本文だけです。 */}
        <textarea
          ref={boxRef}
          value={editing.body}
          onChange={(e) => setEditing({ ...editing, body: e.target.value })}
          placeholder="ここに書きます"
          style={{
            width: "100%", minHeight: "56vh", borderRadius: 14, padding: 14,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            fontSize: "1rem", lineHeight: 1.9, resize: "vertical"
          }} />
        {error ? <p style={{ ...small, color: C.curtain }}>{error}</p> : null}
        {/* ★★消すのは、★下半分に。★誤って 触らないためです。 */}
        {editing.id && onDelete ? (
          <button type="button"
            onClick={async () => { await onDelete(editing.id); setEditing(null); }}
            className="w-full"
            style={{
              minHeight: 48, borderRadius: 10, border: `1px solid ${C.line}`,
              background: C.card, color: C.inkSoft, fontSize: "0.8125rem"
            }}>このノートを 消す</button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.ink }}>ノート</h2>
        {/* ★★＋。★押した その場で 書けます。★名前を 先に 聞きません。 */}
        <button type="button" onClick={() => { setEditing({ id: null, body: "" }); setError(""); }}
          aria-label="ノートを書く"
          style={{
            minWidth: 44, minHeight: 44, borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            fontSize: "1.125rem"
          }}>＋</button>
      </div>

      {/* ★★帯 4つ（★見本⑥）。★増やしません。 */}
      <div className="flex gap-2 overflow-x-auto nav-scroll">
        {NOTE_KINDS.map((k) => (
          <button key={k.key} type="button" onClick={() => setKind(k.key)}
            style={{
              minHeight: 44, padding: "0 14px", borderRadius: 999, whiteSpace: "nowrap",
              border: `1px solid ${kind === k.key ? C.curtain : C.line}`,
              background: kind === k.key ? C.curtain : C.card,
              color: kind === k.key ? "#FFFDF8" : C.inkSoft, fontSize: "0.8125rem"
            }}>{k.label}</button>
        ))}
      </div>

      {/* ★★「連絡」の 帯だけ、★ノートでは なく 連絡板が 開きます（★見本④）。
          ★★タブを 増やさずに 置くための 形です。
          ★何を 出すかは lib/notes.js が 決めます。★ここでは 決めません。 */}
      {isRenrakuKind(kind) ? renraku : list.length === 0 ? (
        <div style={card}>
          <p style={small}>
            {q.trim() ? "見つかりませんでした。" : "＋から、思いついたことを書けます。"}
          </p>
        </div>
      ) : (
        list.map((n) => (
          <button key={n.id} type="button"
            onClick={() => { setEditing({ id: n.id, body: n.body || "" }); setError(""); }}
            className="w-full text-left"
            style={{ ...card, minHeight: 44, display: "block" }}>
            {/* ★★見出しは 本文の 1行目です。★列に していません。 */}
            <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: 1.8 }}>
              {titleOf(n.body) || "（まだ何も書いていません）"}
            </p>
            {previewOf(n.body) ? (
              <p style={{ ...small, marginTop: 2 }}>{previewOf(n.body)}</p>
            ) : null}
            <p style={{ ...small, marginTop: 4 }}>
              {dayWord(String(n.updated_at || n.created_at || "").slice(0, 10))}
              {n.source_label ? `　${n.source_label}` : ""}
            </p>
          </button>
        ))
      )}

      {/* ★★連絡の 帯では、★ノートの さがすを 出しません。
          ★★探す 相手が ちがいます。★連絡は 連絡の 中で 探します。 */}
      {isRenrakuKind(kind) ? null : (
      <>
      {/* ★★この中から さがす（★見本⑥）。★一覧の あとです。
          ★★見本⑥では、★さがすが 下に あります。★そのとおりに します。
            ★ノートは 一覧を 眺めて 思い出すもので、★名簿とは ちがいます。 */}
      <p style={small}>この中から さがす</p>
      <input
        type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="ことばで さがす"
        style={{
          width: "100%", minHeight: 44, borderRadius: 12, padding: "0 14px",
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "1rem"
        }} />
      </>
      )}
    </div>
  );
}
