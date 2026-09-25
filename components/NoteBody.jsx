// ============================================================================
// ★ノートの 本文 ── ★たぶん／稽古 の どちらも これ 1つ（★2026-09-25・C群 束4）
//
//   ★見本 `SC['たぶん本文']`／`SC['ノート本文']`（★design-v51）。
//
//   ★★★同じ 形 なので 1つに します。★字は 鍵で 分けます。
//     ★★2つの 画面を 作ると、★片方だけ 直る 日が 来ます。
//   ★★「保存」を 押させません。★手が 止まってから 送ります。
//   ★★字と 決めは `lib/noteBody.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TABUN, TABUN_TITLE, TABUN_BACK, PRACTICE_BACK, TABUN_PLACEHOLDER,
  BTN_OK, BTN_DELETE, BTN_META, TABUN_NOTES, PRACTICE_NOTES,
  SAVE_AFTER_MS, bodyTitle, isNew
} from "@/lib/noteBody";

export default function NoteBody({ kind, note, onSave, onDelete, onOpenMeta, onBack }) {
  const たぶん = kind === TABUN;
  const [body, setBody] = useState((note && note.body) || "");
  const 待 = useRef(null);

  // ★★手が 止まってから 送ります。★打つ たび 送りません。
  useEffect(() => {
    if (body === ((note && note.body) || "")) return undefined;
    if (待.current) clearTimeout(待.current);
    待.current = setTimeout(() => { if (onSave) onSave(body); }, SAVE_AFTER_MS);
    return () => { if (待.current) clearTimeout(待.current); };
  }, [body]);

  // ★★★画面を 出る とき、★待って いた ぶんを 送ります。
  //   ★★送らないと、★打った 直後に 戻った 方の 字が 消えます。
  useEffect(() => () => {
    if (待.current) clearTimeout(待.current);
  }, []);

  const 題 = たぶん ? (isNew(note) ? TABUN_TITLE : bodyTitle(note) || TABUN_TITLE)
                   : (bodyTitle(note) || "");

  return (
    <div>
      <Back onClick={onBack}>{たぶん ? TABUN_BACK : PRACTICE_BACK}</Back>
      <ScreenHead title={題} />

      <textarea value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={たぶん ? TABUN_PLACEHOLDER : ""}
        style={{
          width: "100%", minHeight: たぶん ? 240 : 300, padding: "11px 12px",
          fontSize: "1rem", lineHeight: 1.85, borderRadius: 10,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          resize: "vertical"
        }} />

      {/* ★★新しい ものは「これで いい」。★すでに ある ものは「消す」。
          ★★★見本の とおり です ── ★新しい ものを 消す ボタンは 要りません。 */}
      {たぶん && isNew(note) ? (
        <button type="button" onClick={onBack}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 10,
            borderRadius: 10, border: "none", background: C.curtain,
            color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_OK}</button>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => onDelete && onDelete()}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: `1px solid ${C.line}`, background: C.card,
              color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
            }}>{BTN_DELETE}</button>
          {!たぶん ? (
            <button type="button" onClick={() => onOpenMeta && onOpenMeta()}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10,
                border: `1px solid ${C.line}`, background: C.card,
                color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
              }}>{BTN_META}</button>
          ) : null}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {(たぶん ? TABUN_NOTES : PRACTICE_NOTES).map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
