"use client";

import { useEffect, useRef, useState } from "react";
import {
  searchGroups, filterGroups, countItems,
  SEARCH_HEAD, SEARCH_HINT, NOTHING_LINE, CLOSE_KEY
} from "@/lib/opsSearch";
import { rem, FONT_STACK, TYPE } from "@/lib/uiKit";
import { v } from "@/lib/visualTokens";
// ★★後ろを 暗くする 幕（★2026-09-19・裁定 その81 §1）。
//   ★★この 画面は `v()` を 使うので、★`C` を 取り込みません。
//   ★★名前は lib/tokens.js が 持ちます。★字を ここに 書きません。
import { C as _C } from "@/lib/tokens";
const SCRIM = _C.scrim;
import OpsIcon from "@/components/OpsIcon";
import { tx } from "@/lib/t";

// ============================================================================
// ★さがす（⌘K）── ★見た目（★裁定 その78 §6 ／ その81 §4-5）
//
//   ★★★ナビの 代わりでは ありません。★足すだけ です。
//     ★★だから、★ここに 入れた 画面を ナビから 外しません。
//
//   ★★★持って いない ものは 出しません。★決めは lib/opsSearch.js です。
//
//   ★★Esc で 閉じます。★開く のは 呼ぶ 側が 決めます（★⌘K は 殻が 聞きます）。
//     ★★押しどころの 名を 2か所に 書きません。
//
//   ★見張り components/tests/ops-search.test.js
// ============================================================================

export default function OpsSearch({ perms, onGo, onClose }) {
  const [word, setWord] = useState("");
  const 入力 = useRef(null);

  // ★★開いたら すぐ 打てます。★1回 押す 手を 減らします。
  useEffect(() => { if (入力.current) 入力.current.focus(); }, []);

  const 組 = filterGroups(searchGroups(perms), word);
  const 数 = countItems(組);

  return (
    <div role="dialog" aria-label={SEARCH_HEAD}
      onKeyDown={(e) => { if (e.key === CLOSE_KEY && onClose) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: SCRIM,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: `${rem(60)} ${rem(14)} ${rem(14)}`, fontFamily: FONT_STACK
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "72vh", overflowY: "auto",
        background: v("card"), border: `1px solid ${v("line")}`,
        borderRadius: 14, padding: rem(12)
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: v("ink3"), display: "flex" }}>
            <OpsIcon name="search" />
          </span>
          <input ref={入力} type="text" value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={SEARCH_HINT}
            style={{
              flex: 1, minHeight: 44, border: "none", background: "transparent",
              // ★★16px を 下回らせません。★下回ると iOS が 勝手に 寄ります。
              fontSize: rem(16), color: v("ink"), fontFamily: FONT_STACK,
              outline: "none"
            }} />
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: v("ink3"),
              ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
            }}>{tx("とじる")}</button>
        </div>

        {数 === 0 ? (
          <p style={{ ...TYPE.mini, color: v("ink3"), margin: `${rem(10)} 0 0` }}>
            {NOTHING_LINE}
          </p>
        ) : 組.map((g) => (
          <div key={g.head} style={{ marginTop: rem(10) }}>
            <div style={{ ...TYPE.h3, color: v("ink4"), padding: `0 ${rem(4)}` }}>{g.head}</div>
            {g.items.map((it) => (
              <button key={g.head + it.key} type="button"
                onClick={() => { if (onGo) onGo(it.tab); if (onClose) onClose(); }}
                style={{
                  width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                  border: "none", background: "transparent", color: v("ink"),
                  fontSize: rem(14.5), fontFamily: FONT_STACK,
                  padding: `0 ${rem(4)}`, textAlign: "left", cursor: "pointer"
                }}>{it.label}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
