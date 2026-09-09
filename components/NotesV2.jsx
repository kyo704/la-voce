"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, cardStyle } from "@/lib/uiKit";
import { ScreenHead, HeadRound, H3, Card, Seg, Li } from "@/components/UiV2";
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
    <div>
      {/* ★★見本⑥ .hd。★右は ＋ の 丸です（★歯車では ありません）。
          ★★押した その場で 書けます。★名前を 先に 聞きません。 */}
      <ScreenHead title="ノート" right={
        <HeadRound mark="＋" label="ノートを書く"
          onClick={() => { setEditing({ id: null, body: "" }); setError(""); }} />
      } />

      {/* ★★帯 4つ（★見本⑥ .seg）。★増やしません。★流れません。 */}
      <Seg activeKey={kind} onSelect={setKind}
        items={NOTE_KINDS.map((k) => ({ key: k.key, label: k.label }))} />

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
          // ★★見本⑥の 1枚 ── ★本文が 2行、★その下に 日付（.usu）。
          //   ★★見出しと 抜粋を 別の 大きさに していました。
          //     ★見本は 同じ 大きさの 本文 2行です。★そちらに 合わせます。
          //   ★★見出しが 本文の 1行目である、という 決めは そのままです
          //     （★lib/notes.js の titleOf）。★見え方だけ 変えました。
          //   ★★狭い画面の 話です。★広い画面（決まりB）は 名前と 日付だけで、
          //     ★本文の 抜粋を 出しません。★あちらは 人に 見られる 画面です。
          <Card key={n.id} style={{ minHeight: 44 }}
            onClick={() => { setEditing({ id: n.id, body: n.body || "" }); setError(""); }}>
            <div style={{ ...TYPE.body, lineHeight: 1.7 }}>
              {titleOf(n.body) || "（まだ何も書いていません）"}
              {previewOf(n.body) ? <><br />{previewOf(n.body)}</> : null}
            </div>
            <div style={{ ...TYPE.usual, marginTop: 7 }}>
              {dayWord(String(n.updated_at || n.created_at || "").slice(0, 10))}
              {n.source_label ? `　${n.source_label}` : ""}
            </div>
          </Card>
        ))
      )}

      {/* ★★連絡の 帯では、★ノートの さがすを 出しません。
          ★★探す 相手が ちがいます。★連絡は 連絡の 中で 探します。 */}
      {isRenrakuKind(kind) ? null : (
      <>
      {/* ★★この中から さがす（★見本⑥）。★一覧の あとです。
          ★★見本⑥では、★さがすが 下に あります。★そのとおりに します。
            ★ノートは 一覧を 眺めて 思い出すもので、★名簿とは ちがいます。 */}
      <H3>この中から さがす</H3>
      {/* ★★見本⑥は、★1枚の カードの 中の 1行です。★入力欄の 枠を 見せません。 */}
      <div style={{ ...cardStyle, marginBottom: SPACE.cardGap }}>
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="🔍　ことばで さがす"
          style={{
            width: "100%", minHeight: SPACE.tapMin, padding: 0,
            border: "none", background: "transparent", color: C.ink,
            // ★★iOS で 画面が 寄らないよう、★16px を 下回らせません（globals.css）。
            fontSize: 16
          }} />
      </div>
      </>
      )}
    </div>
  );
}
