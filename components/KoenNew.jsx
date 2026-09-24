"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_WORDS } from "@/lib/koenSheet";
import { KIND_LABELS } from "@/lib/worksSearch";
import {
  canCreate, toKoenRow, shownFields,
  NEW_HEAD, NEW_KIND_HEAD, NEW_KIND_SUB, NEW_KIND_ROW, NEW_KIND_CHANGE,
  NEW_PRICE_HEAD, NEW_PRICE_MAKE, NEW_PRICE_FREE, NEW_PRICE_15, NEW_PRICE_15V,
  NEW_PRICE_16, NEW_PRICE_16V, NEW_PRICE_NOTE, NEW_NEED_TITLE, NEW_MADE,
  NEW_KIND_NOTE, NEW_NOTE
} from "@/lib/koenArea";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★公演を 作る ── ★見本 `P_koenNew`
//   ★出どころ 裁定143 ／ 裁定148 ／ 裁定141
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★種類の 一覧も 言葉も **台帳** から 引きます（`koen_kind_words`）。
//     ★ここに 写しません。★台帳を 直した ときに 画面だけ 古く なります。
//
//   ★★★台帳に 列の 無い 欄（作品・稽古の はじまり）は **出しません**。
//     ★打ち込めて、★押したら 消える ── ★それが いちばん 悪い 形 です。
//
//   ★★★作れるのは「公演」の できことを 渡された 方 だけ。
//     ★止めるのは 台帳（`koen_insert`）。★画面は 先に 隠す だけ です。
//
//   ★見張り components/tests/koen-new-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(7)} 0`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};
const 入 = {
  width: "100%", minHeight: 44, borderRadius: 10, padding: `0 ${rem(10)}`,
  border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
  fontFamily: FONT_STACK, ...TYPE.li
};

export default function KoenNew({ supabase, orgId, userId, onMade, onBack }) {
  const [kinds, setKinds] = useState([]);
  const [form, setForm] = useState({ title: "", opens_on: "", venue: "", kind: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let 生 = true;
    (async () => {
      const { data } = await supabase.from("koen_kind_words").select(COLS_WORDS);
      if (生) setKinds(data || []);
    })();
    return () => { 生 = false; };
  }, [supabase]);

  const 選ばれた = useMemo(() =>
    kinds.find((k) => k.kind === form.kind) || null, [kinds, form.kind]);

  const 作る = useCallback(async () => {
    if (!supabase || !userId) return;
    if (!canCreate(form)) { setWord(tx(NEW_NEED_TITLE)); return; }
    setBusy(true); setError("");
    try {
      const { data, error: e } = await supabase.from("koen")
        .insert(toKoenRow(form, { orgId, userId })).select("id");
      if (e) throw e;
      const id = ((data || [])[0] || {}).id;
      if (!id) throw new Error(tx("作れませんでした。"));
      setWord(tx(NEW_MADE));
      if (onMade) onMade(id);
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, form, orgId, userId, onMade]);

  // ★① どんな 公演か（★種類を 選ぶまで、★ほかは 出しません）
  if (!form.kind) {
    return (
      <div>
        {onBack ? (
          <button type="button" onClick={onBack}
            style={{
              minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
              border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
              fontFamily: FONT_STACK, ...TYPE.usual
            }}>‹ {tx("行事")}</button>
        ) : null}
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(NEW_HEAD)}</h2>
        <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(NEW_KIND_HEAD)}</div>
        <div style={{ ...小, marginBottom: rem(8) }}>{tx(NEW_KIND_SUB)}</div>

        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          overflow: "hidden", maxWidth: 760
        }}>
          {kinds.map((k) => (
            <button key={k.kind} type="button"
              onClick={() => setForm((f) => ({ ...f, kind: k.kind }))}
              style={{
                width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: rem(8), textAlign: "left",
                padding: `${rem(10)} ${rem(12)}`, background: "transparent",
                border: "none", borderBottom: `1px solid ${C.line2}`,
                color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
              }}>
              <span>
                {tx(KIND_LABELS[k.kind] || k.kind)}
                {/* ★★台帳の 言葉を そのまま。★ここで 作りません。 */}
                <span style={{ ...小, display: "block" }}>
                  {k.tbl_word}（{k.row_word} × {k.col_word}）
                </span>
              </span>
              <span style={{ color: C.inkSoft }}>›</span>
            </button>
          ))}
        </div>

        <div style={{ ...小, marginTop: rem(12) }}>
          {NEW_KIND_NOTE.map((l) => (
            <span key={l} style={{ display: "block" }}>{tx(l)}</span>
          ))}
        </div>
      </div>
    );
  }

  // ★② 中身を 入れる
  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(NEW_HEAD)}</h2>

      <button type="button" onClick={() => setForm((f) => ({ ...f, kind: "" }))}
        style={{
          width: "100%", maxWidth: 760, minHeight: 44, display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: rem(8),
          textAlign: "left", padding: `${rem(10)} ${rem(12)}`, marginBottom: rem(10),
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
        }}>
        <span>
          {tx(NEW_KIND_ROW)}
          <span style={{ ...小, display: "block" }}>
            {tx(KIND_LABELS[form.kind] || form.kind)}　／　
            {選ばれた ? 選ばれた.tbl_word + "（" + 選ばれた.row_word + " × " + 選ばれた.col_word + "）" : ""}
          </span>
        </span>
        <span style={{ color: C.inkSoft }}>{tx(NEW_KIND_CHANGE)} ›</span>
      </button>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...札, flex: 1.4, minWidth: 300 }}>
          {/* ★★★台帳に 列の ある 欄 だけ です。 */}
          {shownFields().map((f) => (
            <div key={f.key} style={{ marginBottom: rem(8) }}>
              <div style={{ ...小, marginBottom: rem(3) }}>{tx(f.label)}</div>
              <input
                type={f.key === "opens_on" ? "date" : "text"}
                value={form[f.key] || ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                style={入} />
            </div>
          ))}
          <button type="button" onClick={作る} disabled={busy}
            style={{
              minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13, marginTop: rem(6),
              border: "none", background: C.curtain, color: C.onCurtain,
              fontFamily: FONT_STACK, fontWeight: 700,
              opacity: busy ? 0.5 : 1, ...TYPE.li
            }}>
            {tx("作って、")}{選ばれた ? 選ばれた.cast_word : ""}{tx("へ")}
          </button>
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(NEW_PRICE_HEAD)}</div>
          <div style={行}><span>{tx(NEW_PRICE_MAKE)}</span><span>{tx(NEW_PRICE_FREE)}</span></div>
          <div style={行}><span>{tx(NEW_PRICE_15)}</span><span>{tx(NEW_PRICE_15V)}</span></div>
          <div style={行}><span>{tx(NEW_PRICE_16)}</span><span>{tx(NEW_PRICE_16V)}</span></div>
          <div style={{ ...小, marginTop: rem(8) }}>{tx(NEW_PRICE_NOTE)}</div>
        </div>
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {NEW_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
