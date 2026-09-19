"use client";

import { useState } from "react";
import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import {
  HEAD, SUB_LINE, NOTES, NOTES_BOLD, EDIT_NOTES, EMPTY_HEAD, EMPTY_HOW,
  emptyPreset, mayEdit, canSave, whyCannotSave, targetsWord, totalWord,
  TOTAL_MIN, TOTAL_MAX, NEED_LABEL, NEED_HINT
} from "@/lib/lessonPresets";
import { showEventTable } from "@/lib/opsEventTable";
import { tx } from "@/lib/t";

// ============================================================================
// ★授業の 型（★裁定 その90 §6・2026-09-18）
//
//   ★★★見るのは 事務 と 先生。★作る・消すのは 事務 だけ。
//     ★★見るだけ の 方に、★作る 札を 出しません（★§8⑤）。
//     ★★台帳も 同じ 門 です。★画面だけ では 守りに なりません。
//
//   ★★★型を 消しても、★出席の 記録は 消えません。★そう 書いて おきます。
//
//   ★★決めは lib/lessonPresets.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/lesson-presets-screen.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };
const 罫 = `1px solid ${C.line}`;

/** ★注の 1行（★太い ところは 行の 中 ── ★役職の 表と 同じ 形）。 */
function Note({ items, bold }) {
  return (
    <p style={{ ...小, marginTop: rem(10) }}>
      {items.map((t) => {
        const b = (bold || []).find((x) => t.includes(x));
        return (
          <span key={t} style={{ display: "block" }}>
            {b ? (
              <>
                {t.slice(0, t.indexOf(b))}
                <b style={{ color: C.ink }}>{b}</b>
                {t.slice(t.indexOf(b) + b.length)}
              </>
            ) : t}
          </span>
        );
      })}
    </p>
  );
}

export default function OpsPresets({
  presets = [], teachers = [], perms, teacherNameOf,
  onSave, onDelete, onClose, busy, error = ""
}) {
  const width = useWindowWidth();
  const [form, setForm] = useState(null);
  const 直せる = mayEdit(perms);

  // ── 型 1つ（★作る／なおす）──────────────────────────────
  if (form) {
    const わけ = whyCannotSave(form);
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ ...TYPE.title, color: C.ink, margin: 0 }}>
            {form.id ? form.name || HEAD : tx("型を 作る")}
          </h2>
          <button type="button" onClick={() => setForm(null)}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
            }}>{tx("もどる")}</button>
        </div>

        <p style={{ ...小, margin: `${rem(8)} 0 4px` }}>{tx("名前")}</p>
        <input type="text" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 60) }))}
          placeholder={tx("れい：声楽実技（前期）")}
          style={入力の形} />

        <p style={{ ...小, margin: `${rem(10)} 0 4px` }}>{tx("年間の 回数")}</p>
        <input type="number" min={TOTAL_MIN} max={TOTAL_MAX} value={form.total_count}
          onChange={(e) => setForm((f) => ({ ...f, total_count: Number(e.target.value) }))}
          style={{ ...入力の形, maxWidth: 160 }} />

        {/* ★★★足りると される 回数（★2026-09-19・お決め Q1）。
             ★★空の ままで かまいません。★空なら ★印は 出ません。
             ★★★こちらで 2/3 などと 決めません。★学校の お決め です。 */}
        <p style={{ ...小, margin: `${rem(10)} 0 4px` }}>{NEED_LABEL}</p>
        <input type="number" min={1} max={form.total_count || TOTAL_MAX}
          value={form.need_count === null || form.need_count === undefined ? "" : form.need_count}
          onChange={(e) => setForm((f) => ({
            ...f, need_count: e.target.value === "" ? "" : Number(e.target.value)
          }))}
          style={{ ...入力の形, maxWidth: 160 }} />
        <p style={{ ...小, margin: "4px 0 0" }}>{NEED_HINT}</p>

        <p style={{ ...小, margin: `${rem(10)} 0 4px` }}>
          {tx("覚え書き")}　<span style={{ color: C.ink4 }}>{tx("任意")}</span>
        </p>
        <textarea value={form.note || ""}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 200) }))}
          style={{ ...入力の形, minHeight: 62, padding: rem(10), lineHeight: 1.7 }} />

        {/* ★★★当てる 門下 ── ★いくつ でも 選べます（★裁定 その90 §5-1）。
             ★★1人も 居なければ、★その 列を 出しません（★押せない 札を 置きません）。 */}
        {teachers.length > 0 ? (
          <>
            <p style={{ ...小, margin: `${rem(12)} 0 4px` }}>
              {tx("当てる 門下")}　<span style={{ color: C.ink4 }}>{tx("複数 選べます")}</span>
            </p>
            <div style={{ ...cardStyle, padding: 0 }}>
              {teachers.map((t, i) => {
                const on = (form.teachers || []).includes(t.id);
                return (
                  <button key={t.id} type="button" disabled={busy}
                    onClick={() => setForm((f) => ({
                      ...f,
                      teachers: on
                        ? (f.teachers || []).filter((x) => x !== t.id)
                        : (f.teachers || []).concat([t.id])
                    }))}
                    aria-pressed={on}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", minHeight: 48, padding: `0 ${rem(13)}`,
                      border: "none", borderTop: i === 0 ? "none" : 罫,
                      background: "transparent", color: C.ink,
                      ...TYPE.usual, fontFamily: FONT_STACK, textAlign: "left"
                    }}>
                    <span>{(teacherNameOf && teacherNameOf(t.id)) || t.id}</span>
                    <span aria-hidden="true" style={{
                      width: 17, height: 17, borderRadius: 4,
                      border: `1.6px solid ${on ? C.curtain : C.line}`,
                      background: on ? C.curtain : "transparent",
                      boxShadow: on ? `inset 0 0 0 3px ${C.card}` : "none"
                    }} />
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {error ? <p style={{ ...小, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}
        {/* ★★出せない わけを、★押す 前に 書きます。★黙って 灰色に しません。 */}
        {わけ ? <p style={{ ...小, color: C.curtain, marginTop: rem(8) }}>{わけ}</p> : null}

        <button type="button" disabled={busy || !canSave(form)}
          onClick={() => { if (onSave) onSave(form); }}
          style={{
            width: "100%", minHeight: 52, marginTop: rem(12), borderRadius: 12,
            border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
            background: canSave(form) ? C.curtain : C.line,
            color: C.onCurtain, fontSize: rem(15), fontFamily: FONT_STACK
          }}>{tx("保存")}</button>

        {form.id && onDelete ? (
          <button type="button" disabled={busy}
            onClick={() => onDelete(form)}
            style={{
              width: "100%", minHeight: 48, marginTop: rem(9), borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              ...TYPE.li, fontFamily: FONT_STACK
            }}>{tx("この型を 消す")}</button>
        ) : null}

        <Note items={EDIT_NOTES} bold={["いくつの 門下に 当てても", "1回 作れば 足ります", "出席の 記録は 消えません"]} />
      </div>
    );
  }

  // ── 一覧 ────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ ...TYPE.title, color: C.ink, margin: 0 }}>{HEAD}</h2>
        {onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
            }}>{tx("もどる")}</button>
        ) : null}
      </div>
      <p style={小}>{SUB_LINE}</p>

      {presets.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: `${rem(26)} ${rem(15)}` }}>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{EMPTY_HEAD}</p>
          {直せる ? <p style={{ ...小, marginTop: 6 }}>{EMPTY_HOW}</p> : null}
        </div>
      ) : showEventTable(width) ? (
        /* ★★広い ときは 表（★見本 `P_presets`）。★狭い ときは 札。
           ★★境目は 行事の 表と 同じ ものを 使います。★新しい 数を 作りません。 */
        <div className={TABLE_CLASS}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
            <thead>
              <tr>
                <th className={ANCHOR_CLASSES[1]} style={{ ...見出しの形, minWidth: 190 }}>{tx("名前")}</th>
                <th style={{ ...見出しの形, textAlign: "right" }}>{tx("回数")}</th>
                <th style={見出しの形}>{tx("当てている 門下")}</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((p) => (
                <tr key={p.id}>
                  <td className={ANCHOR_CLASSES[1]} style={ますの形}>
                    <押す p={p} 直せる={直せる} setForm={setForm} />
                  </td>
                  <td style={{ ...ますの形, textAlign: "right" }}>{totalWord(p.total_count)}</td>
                  <td style={ますの形}>
                    {targetsWord((p.teachers || []).map((id) =>
                      (teacherNameOf && teacherNameOf(id)) || ""))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        presets.map((p) => (
          <div key={p.id} style={{ ...cardStyle, marginBottom: rem(7) }}>
            <押す p={p} 直せる={直せる} setForm={setForm} />
            <p style={{ ...小, margin: "2px 0 0" }}>
              {totalWord(p.total_count)}　{targetsWord((p.teachers || []).map((id) =>
                (teacherNameOf && teacherNameOf(id)) || ""))}
            </p>
          </div>
        ))
      )}

      {/* ★★★作る 札は、★事務の 方にだけ（★裁定 その90 §5-4）。
           ★★見るだけ の 方に 出すと、★押して 断られます。 */}
      {直せる ? (
        <button type="button" disabled={busy}
          onClick={() => setForm(emptyPreset())}
          style={{
            width: "100%", minHeight: 48, marginTop: rem(10), borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            ...TYPE.li, fontFamily: FONT_STACK
          }}>＋ {tx("型を 作る")}</button>
      ) : null}

      <Note items={NOTES} bold={NOTES_BOLD} />
    </div>
  );
}

/** ★名前の ところ。★事務なら 押せます。★先生なら ただの 字 です。 */
function 押す({ p, 直せる, setForm }) {
  if (!直せる) {
    return <span style={{ ...TYPE.usual, color: C.ink }}>{p.name}</span>;
  }
  return (
    <button type="button"
      onClick={() => setForm({
        id: p.id, name: p.name, total_count: p.total_count,
        need_count: p.need_count === null || p.need_count === undefined ? "" : p.need_count,
        note: p.note || "", teachers: (p.teachers || []).slice()
      })}
      style={{
        background: "transparent", border: "none", padding: 0, minHeight: 44,
        color: C.curtain, ...TYPE.usual, fontFamily: FONT_STACK, textAlign: "left"
      }}>{p.name} ›</button>
  );
}

const 入力の形 = {
  width: "100%", minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
  border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
  fontSize: "1rem", fontFamily: FONT_STACK
};
const 見出しの形 = {
  padding: `${rem(9)} ${rem(10)}`, borderBottom: 罫,
  ...TYPE.mini, color: C.inkSoft, fontWeight: 400
};
const ますの形 = {
  padding: `${rem(9)} ${rem(10)}`, borderBottom: 罫, ...TYPE.usual, color: C.ink
};
