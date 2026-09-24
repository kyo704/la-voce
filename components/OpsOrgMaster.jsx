"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import { H3, Card, Li, Note, Warn, Ask } from "@/components/UiV2";
import {
  KOMA_HEAD, KOMA_NOTE, PLACE_HEAD, PLACE_HINT, mayEditMaster,
  hhmm, lengthWord, periodOk, whyPeriodBad, overlaps, OVERLAP_WORD,
  placeOk, whyPlaceBad, DELETE_ASK, DELETE_NOTE
} from "@/lib/orgMaster";

// ============================================================================
// ★学校の 基本 ── ★時間の 割り方（`stKoma`）と 場所（`stPlace`）
//
//   ★★決めは lib/orgMaster.js が 持ちます。★ここでは 決めません。
//   ★★★直せない 方にも 見えます（★全員の 画面の もと だから です）。
//     ★★ただし 押しどころを 出しません（★押せない 札を 置きません）。
//   ★★★重なりは 印を つける だけ です。★止めません。
//     ★★学校に よっては、★重ねる ことも あります。★こちらで 決めません。
//
//   ★見張り components/tests/org-master.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsOrgMaster({
  kind = "koma", periods = [], places = [], perms,
  // ★★★2026-09-24・裁定194 §3 ── ★`onSavePeriod`／`onDeletePeriod` を 消しました。
  //   ★★中で 1度も 使われず、★呼ぶ 側からも 渡されて いません でした。
  //   ★★★「名前だけ ある」のが いちばん 危ない ── ★在ると 思われます。
  //   ★★コマを 直す 画面は 作りません（★裁定194 §3）。
  //     ★`org_periods` は 0行。★年に 1回 変わるか どうか の もの です。
  //     ★直す ときは「作り直す」で 足ります。
  onAddPeriod,
  onAddPlace, onDeletePlace, busy, error = ""
}) {
  const 直せる = mayEditMaster(perms);
  const [下書き, set下書き] = useState(null);
  const [場所, set場所] = useState("");
  const [消す, set消す] = useState(null);
  const 重なり = new Set(overlaps(periods).flat());

  if (kind === "place") {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <H3>{PLACE_HEAD}</H3>
        <Card style={{ padding: 0 }}>
          {places.length === 0 ? (
            <p style={{ ...小, margin: 0, padding: rem(14) }}>まだ ありません。</p>
          ) : places.map((p, i) => (
            <Li key={p.id} last={i === places.length - 1}
              right={直せる ? (
                <button type="button" disabled={busy} onClick={() => set消す(p)}
                  style={札の形}>消す</button>
              ) : ""}>{p.name}</Li>
          ))}
        </Card>

        {直せる ? (
          <>
            <input type="text" value={場所}
              onChange={(e) => set場所(e.target.value.slice(0, 40))}
              placeholder={PLACE_HINT}
              style={{ ...入力の形, marginTop: rem(10) }} />
            <button type="button" disabled={busy || !placeOk(場所, places)}
              onClick={() => { if (onAddPlace) onAddPlace(場所.trim()); set場所(""); }}
              style={{
                width: "100%", minHeight: 48, marginTop: rem(8), borderRadius: 12,
                border: `1px solid ${placeOk(場所, places) ? C.curtain : C.line}`,
                background: placeOk(場所, places) ? C.curtain : C.line,
                color: placeOk(場所, places) ? C.onCurtain : C.inkSoft,
                fontSize: rem(14.5), fontFamily: FONT_STACK
              }}>＋ 足す</button>
            {場所 && !placeOk(場所, places) ? (
              <p style={{ ...小, margin: "4px 0 0" }}>{whyPlaceBad(場所, places)}</p>
            ) : null}
          </>
        ) : null}
        {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}

        {消す ? (
          <Ask title={`「${消す.name}」を ${DELETE_ASK}`} note={DELETE_NOTE}
            okLabel="消す"
            onOk={() => { if (onDeletePlace) onDeletePlace(消す.id); set消す(null); }}
            onCancel={() => set消す(null)} />
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <H3>{KOMA_HEAD}</H3>
      <Warn>
        {KOMA_NOTE.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Warn>

      <div className={TABLE_CLASS} style={{ marginTop: rem(8) }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
          <tbody>
            <tr>
              <th className={ANCHOR_CLASSES[1]} style={見出し}>コマ</th>
              <th style={見出し}>はじまり</th>
              <th style={見出し}>終わり</th>
              <th style={見出し}>長さ</th>
            </tr>
            {periods.length === 0 ? (
              <tr><td style={ます} colSpan={4}>
                <span style={小}>まだ ありません。</span>
              </td></tr>
            ) : periods.map((p) => (
              <tr key={p.id}>
                <td className={ANCHOR_CLASSES[1]} style={ます}>
                  {p.name}
                  {重なり.has(p.id) ? (
                    <div style={小}>{OVERLAP_WORD}</div>
                  ) : null}
                </td>
                <td style={ます}>{hhmm(p.start_min)}</td>
                <td style={ます}>{hhmm(p.end_min)}</td>
                <td style={ます}>{lengthWord(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {直せる ? (
        <>
          {下書き ? (
            <Card style={{ marginTop: rem(10) }}>
              <label style={{ ...小, display: "block" }}>コマの 名前</label>
              <input type="text" value={下書き.name}
                onChange={(e) => set下書き((d) => ({ ...d, name: e.target.value.slice(0, 20) }))}
                placeholder="れい：2限" style={入力の形} />
              <div style={{ display: "flex", gap: 8, marginTop: rem(8) }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...小, display: "block" }}>はじまり</label>
                  <input type="time" step={300} value={下書き.start}
                    onChange={(e) => set下書き((d) => ({ ...d, start: e.target.value }))}
                    style={入力の形} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...小, display: "block" }}>終わり</label>
                  <input type="time" step={300} value={下書き.end}
                    onChange={(e) => set下書き((d) => ({ ...d, end: e.target.value }))}
                    style={入力の形} />
                </div>
              </div>
              {!periodOk(下書き) ? (
                <p style={{ ...小, margin: "4px 0 0" }}>{whyPeriodBad(下書き)}</p>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: rem(10) }}>
                <button type="button" disabled={busy || !periodOk(下書き)}
                  onClick={() => {
                    if (onAddPeriod) onAddPeriod(下書き);
                    set下書き(null);
                  }}
                  style={{
                    flex: 1, minHeight: 48, borderRadius: 12,
                    border: `1px solid ${periodOk(下書き) ? C.curtain : C.line}`,
                    background: periodOk(下書き) ? C.curtain : C.line,
                    color: periodOk(下書き) ? C.onCurtain : C.inkSoft,
                    fontSize: rem(14.5), fontFamily: FONT_STACK
                  }}>足す</button>
                <button type="button" onClick={() => set下書き(null)}
                  style={{
                    minHeight: 48, padding: `0 ${rem(14)}`, borderRadius: 12,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.inkSoft, fontSize: rem(14.5), fontFamily: FONT_STACK
                  }}>やめる</button>
              </div>
            </Card>
          ) : (
            <button type="button"
              onClick={() => set下書き({ name: "", start: "09:00", end: "10:30" })}
              style={{
                minHeight: 44, marginTop: rem(10), padding: `0 ${rem(14)}`,
                borderRadius: 999, border: `1px solid ${C.line}`,
                background: C.card, color: C.ink, fontSize: rem(12.5),
                fontFamily: FONT_STACK
              }}>＋ コマを 足す</button>
          )}
        </>
      ) : null}
      {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}

      <Note>
        <span style={{ display: "block" }}>
          重なって いる ところには 印を つけます。止めません。
        </span>
        <span style={{ display: "block" }}>
          学校に よっては、重ねる ことも あります。こちらでは 決めません。
        </span>
      </Note>
    </div>
  );
}

const 見出し = {
  padding: `${rem(9)} ${rem(8)}`, textAlign: "left",
  fontSize: rem(12.5), color: C.inkSoft, fontWeight: 400,
  borderBottom: `1px solid ${C.line}`
};
const ます = { padding: `${rem(9)} ${rem(8)}`, fontSize: rem(13), color: C.ink };
const 入力の形 = {
  width: "100%", minHeight: 48, borderRadius: 10, marginTop: 4,
  padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
  background: C.paper, color: C.ink, fontSize: rem(16), fontFamily: FONT_STACK
};
const 札の形 = {
  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
  border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
  fontSize: rem(12.5), fontFamily: FONT_STACK
};
