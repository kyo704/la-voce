"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  composersFor, composerLabel, ROLE_MAXES, CHORUS_CHOICES, showsChorusFilter,
  toSearchParams, hasDraft, pickedWord, workLine, kindLabel, KIND_COUNTS,
  EMPTY_WORD, KIND_NOTE, SEARCH_PLACEHOLDER, OTHER_COMPOSER_WORD, footNotes
} from "@/lib/worksSearch";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★作品を さがす ── ★見本 `SC['作品をさがす']`
//
//   ★出どころ 裁定174 ／ woolsong-2026-09-21_8.zip
//     ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333・2026-09-23 展開）
//
//   ★★決めは `lib/worksSearch.js` が 持ちます。★ここでは 1つも 決めません。
//   ★★しぼりこみと 並べ替えは **台帳**（`search_works`）が します。
//     ★★★画面で 並べ替えません。★「よく 使われて いる 順」を 2か所に 置かない ため です。
//
//   ★★★種類を 選ぶ 欄は 作りません（★見本の 註）──
//     「ここで ジャンルを 選び直させません（前の画面で 決めています）」
//
//   ★★★「下書き あり」は **札を 出す だけ** です。★別の 画面へ 行きません。
//     ★design-v36 の 直し ① ── ★前は 偽の 雛形の 番号で 配役へ 飛んで いました。
//
//   ★見張り components/tests/works-search-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

/** ★札。★押せる ところは 44 以上。 */
function 札({ on, children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
        border: `1px solid ${on ? C.curtain : C.line}`,
        background: on ? C.curtain : C.card,
        color: on ? C.onCurtain : C.inkSoft,
        fontFamily: FONT_STACK, whiteSpace: "nowrap", ...TYPE.usual
      }}>{children}</button>
  );
}

function 欄({ label, children }) {
  return (
    <div style={{ marginTop: rem(10) }}>
      <div style={{ ...小, marginBottom: rem(4) }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: rem(6) }}>{children}</div>
    </div>
  );
}

export default function WorksSearch({ supabase, kind = "opera", onPick, onBack }) {
  const [q, setQ] = useState("");
  const [composer, setComposer] = useState("");
  const [maxRoles, setMaxRoles] = useState(0);
  const [chorus, setChorus] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  // ★★台帳に 尋ねます。★しぼるのは あちら です。
  useEffect(() => {
    if (!supabase) return;
    let 生きている = true;
    const 待 = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const { data, error: e } = await supabase.rpc(
          "search_works", toSearchParams({ q, kind, composer, maxRoles, chorus }));
        if (e) throw e;
        if (生きている) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (生きている) setError(String((e && e.message) || e));
      } finally {
        if (生きている) setBusy(false);
      }
    }, 200);   // ★打ち込むたびに 尋ねません
    return () => { 生きている = false; clearTimeout(待); };
  }, [supabase, q, kind, composer, maxRoles, chorus]);

  const 押す = useCallback((w) => {
    setWord(tx(pickedWord(w)));
    if (onPick) onPick(w);
  }, [onPick]);

  const 家 = composersFor(kind);

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>‹ {tx("公演を作る")}</button>
      ) : null}

      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx("作品を さがす")}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {tx(kindLabel(kind))}　{KIND_COUNTS[kind] || 0}{tx("の 作品から")}　／　{tx(KIND_NOTE)}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: rem(12)
      }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tx(SEARCH_PLACEHOLDER)}
          style={{
            width: "100%", minHeight: 44, borderRadius: 10, padding: `0 ${rem(10)}`,
            border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
            fontFamily: FONT_STACK, ...TYPE.li
          }} />

        {家.length > 0 ? (
          <欄 label={tx(composerLabel(kind))}>
            <札 on={composer === ""} onClick={() => setComposer("")}>{tx("ぜんぶ")}</札>
            {家.map((c) => (
              <札 key={c} on={composer === c} onClick={() => setComposer(c)}>{c}</札>
            ))}
            {/* ★★札を 増やしません。★打ち込みで さがして いただきます。 */}
            <札 on={false} onClick={() => setWord(tx(OTHER_COMPOSER_WORD))}>…{tx("ほか")}</札>
          </欄>
        ) : null}

        <欄 label={tx("役の 人数")}>
          {ROLE_MAXES.map((v) => (
            <札 key={v.value} on={maxRoles === v.value} onClick={() => setMaxRoles(v.value)}>
              {tx(v.word)}
            </札>
          ))}
        </欄>

        {showsChorusFilter(kind) ? (
          <欄 label={tx("合唱")}>
            {CHORUS_CHOICES.map((v) => (
              <札 key={v.value || "any"} on={chorus === v.value} onClick={() => setChorus(v.value)}>
                {tx(v.word)}
              </札>
            ))}
          </欄>
        ) : null}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
        marginTop: rem(11), overflow: "hidden"
      }}>
        {rows.length === 0 ? (
          <div style={{ padding: `${rem(14)} ${rem(12)}`, ...小 }}>
            {busy ? tx("さがしています") : tx(EMPTY_WORD)}
          </div>
        ) : rows.map((w) => (
          <button key={w.id} type="button" onClick={() => 押す(w)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: rem(8), textAlign: "left",
              padding: `${rem(10)} ${rem(12)}`, background: "transparent",
              border: "none", borderBottom: `1px solid ${C.line2}`,
              color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }}>
            <span>
              {w.title}
              {hasDraft(w) ? (
                <span style={{
                  marginLeft: rem(6), padding: `${rem(1)} ${rem(7)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.band2,
                  color: C.inkSoft, ...TYPE.usual
                }}>{tx("下書き あり")}</span>
              ) : null}
              <span style={{ ...小, display: "block" }}>{w.title_original}</span>
              <span style={{ ...小, display: "block" }}>{workLine(w)}</span>
            </span>
            <span style={{ color: C.inkSoft }}>›</span>
          </button>
        ))}
      </div>

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {footNotes(kind).map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
