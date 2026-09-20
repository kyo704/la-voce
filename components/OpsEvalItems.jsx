"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { H3, Card, Li, Note, Pill, Ask } from "@/components/UiV2";
import {
  HEAD, SUB_LINE, STEPS, mayEditItems, mayChangeItem, whyCannotChangeItem,
  OFF_LABEL, OFF_NOTE, DELETE_LABEL, deleteNote, NOT_YET_LINES,
  MAX_MIN, MAX_MAX
} from "@/lib/evaluation";

// ============================================================================
// ★評価の 型（★見本 `stSaiten` ／ `P_hyokaItem`・裁定 その105 §Q3）
//
//   ★★決めは lib/evaluation.js が 持ちます。★ここでは 決めません。
//   ★★★こちらからの 既定を 置きません。★学校が お決めに なります。
//   ★★★点が 入った あとは 変えられません ── ★宙に 浮く 点を 作りません。
//     ★★「使わない に する」なら いつでも できます（★点は 残ります）。
//
//   ★見張り components/tests/evaluation.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsEvalItems({
  items = [], countOf, perms, onSave, onSetInUse, onDelete, busy, error = ""
}) {
  const 直せる = mayEditItems(perms);
  const [開き, set開き] = useState(null);   // ★null ／ "new" ／ 項目の id
  const [下書き, set下書き] = useState(null);
  const [消す, set消す] = useState(null);

  const 数 = (it) => (countOf ? Number(countOf(it)) || 0 : 0);

  function 開く(it) {
    set開き(it ? it.id : "new");
    set下書き(it
      ? { name: it.name, max_points: String(it.max_points), step: String(it.step), note: it.note || "" }
      : { name: "", max_points: "10", step: "1", note: "" });
  }

  const 名あり = !!(下書き && String(下書き.name).trim());
  const 満点 = Number(下書き && 下書き.max_points);
  const 満点よし = Number.isFinite(満点) && 満点 >= MAX_MIN && 満点 <= MAX_MAX;
  const 出せる = !busy && 名あり && 満点よし;

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <H3>{HEAD}</H3>
      <p style={{ ...小, margin: "-4px 0 10px" }}>{SUB_LINE}</p>

      <Card style={{ padding: 0 }}>
        {items.length === 0 ? (
          <p style={{ ...小, margin: 0, padding: rem(14) }}>
            まだ 項目が ありません。
          </p>
        ) : items.map((it, i) => (
          <Li key={it.id} last={i === items.length - 1}
            onClick={直せる ? () => 開く(it) : undefined}
            right={直せる ? (it.in_use ? "なおす" : "もどす") : ""}>
            <span style={it.in_use ? undefined : { color: C.ink4 }}>
              {it.name}
              <br />
              <span style={小}>
                {it.in_use ? `${it.max_points}点満点` : "使って いません"}
                {数(it) > 0 ? `　／　${数(it)}人ぶんの 点` : ""}
              </span>
            </span>
          </Li>
        ))}
      </Card>

      {直せる ? (
        <button type="button" onClick={() => 開く(null)}
          style={{
            minHeight: 44, marginTop: rem(10), padding: `0 ${rem(14)}`,
            borderRadius: 999, border: `1px solid ${C.line}`,
            background: C.card, color: C.ink, fontSize: rem(12.5),
            fontFamily: FONT_STACK
          }}>＋ 項目を 足す</button>
      ) : null}

      {/* ★★★1枚（★見本 `P_hyokaItem`）。★開いた ときだけ 出します。 */}
      {下書き ? (() => {
        const いま = items.find((x) => x.id === 開き) || null;
        const n = いま ? 数(いま) : 0;
        const 変えられる = mayChangeItem(いま, n);
        return (
          <Card style={{ marginTop: rem(10) }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>
              {いま ? いま.name : "項目を 足す"}
            </p>
            {n > 0 ? (
              <p style={{ ...小, margin: "2px 0 0" }}>{whyCannotChangeItem(n)}</p>
            ) : null}

            <label style={{ ...小, display: "block", marginTop: rem(8) }}>名前</label>
            <input type="text" value={下書き.name} disabled={!変えられる}
              onChange={(e) => set下書き((d) => ({ ...d, name: e.target.value.slice(0, 40) }))}
              placeholder="れい：音程"
              style={入力の形} />

            <label style={{ ...小, display: "block", marginTop: rem(8) }}>満点</label>
            <input type="number" value={下書き.max_points} disabled={!変えられる}
              onChange={(e) => set下書き((d) => ({ ...d, max_points: e.target.value }))}
              style={入力の形} />

            <label style={{ ...小, display: "block", marginTop: rem(8) }}>きざみ</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {STEPS.map((s) => (
                <Pill key={s.key} on={String(下書き.step) === s.key}
                  disabled={!変えられる}
                  onClick={() => set下書き((d) => ({ ...d, step: s.key }))}>{s.label}</Pill>
              ))}
            </div>

            <label style={{ ...小, display: "block", marginTop: rem(8) }}>
              審査員への 説明　（任意）
            </label>
            <textarea value={下書き.note}
              onChange={(e) => set下書き((d) => ({ ...d, note: e.target.value.slice(0, 200) }))}
              placeholder="何を 見る 項目か。審査員の 画面に 出ます"
              style={{ ...入力の形, minHeight: 70, padding: rem(8) }} />

            <div style={{ display: "flex", gap: 8, marginTop: rem(10) }}>
              <button type="button" disabled={!出せる || (いま && !変えられる)}
                onClick={() => {
                  if (onSave) onSave(開き === "new" ? null : 開き, {
                    name: 下書き.name.trim(),
                    max_points: Number(下書き.max_points),
                    step: Number(下書き.step),
                    note: 下書き.note.trim() || null
                  });
                  set開き(null); set下書き(null);
                }}
                style={{
                  flex: 1, minHeight: 48, borderRadius: 12,
                  border: `1px solid ${出せる ? C.curtain : C.line}`,
                  background: 出せる ? C.curtain : C.line,
                  color: 出せる ? C.onCurtain : C.inkSoft,
                  fontSize: rem(14.5), fontFamily: FONT_STACK
                }}>{開き === "new" ? "足す" : "なおす"}</button>
              <button type="button"
                onClick={() => { set開き(null); set下書き(null); }}
                style={{
                  minHeight: 48, padding: `0 ${rem(14)}`, borderRadius: 12,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, fontSize: rem(14.5), fontFamily: FONT_STACK
                }}>やめる</button>
            </div>

            {/* ★★★減らす ── ★2つを 分けます（★見本の とおり）。 */}
            {いま ? (
              <>
                <H3>この 項目を 減らす</H3>
                <Card style={{ padding: 0 }}>
                  <Li right={
                    <button type="button" disabled={busy}
                      onClick={() => onSetInUse && onSetInUse(いま.id, !いま.in_use)}
                      style={小さい札}>{いま.in_use ? "これに する" : "もどす"}</button>
                  }>
                    <b>{いま.in_use ? OFF_LABEL : "使う に もどす"}</b>
                    <div style={小}>{OFF_NOTE}</div>
                  </Li>
                  <Li last right={
                    <button type="button" disabled={busy}
                      onClick={() => set消す(いま)}
                      style={小さい札}>これに する</button>
                  }>
                    <b>{DELETE_LABEL}</b>
                    <div style={小}>{deleteNote(n)}</div>
                  </Li>
                </Card>
                <p style={{ ...小, margin: "6px 0 0" }}>
                  どちらを 選んでも、ほかの 項目の 点は 変わりません。
                </p>
              </>
            ) : null}
            {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
          </Card>
        );
      })() : null}

      <Note>
        {NOT_YET_LINES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>

      {消す ? (
        <Ask title={`「${消す.name}」を 消しますか。`}
          note={deleteNote(数(消す))}
          danger
          okLabel={DELETE_LABEL}
          onOk={() => { if (onDelete) onDelete(消す.id); set消す(null); set開き(null); set下書き(null); }}
          onCancel={() => set消す(null)} />
      ) : null}
    </div>
  );
}

const 入力の形 = {
  width: "100%", minHeight: 48, borderRadius: 10, marginTop: 4,
  padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
  background: C.paper, color: C.ink, fontSize: rem(16), fontFamily: FONT_STACK
};
const 小さい札 = {
  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
  border: `1px solid ${C.line}`, background: C.card, color: C.ink,
  fontSize: rem(12.5), fontFamily: FONT_STACK
};
