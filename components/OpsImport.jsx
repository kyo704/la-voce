"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note, Pill, Btn, Li, Warn, H3, FieldLabel, Wl, EmptyBox } from "@/components/UiV2";
import {
  IMPORT_HEAD, IMPORT_WARN, STEPS, PICK_FILE, HEADLINE_NOTE, NOTHING_CHANGED,
  MISSING_HEAD, MISSING_LINES, ODD_HEAD, ODD_SUB, IMPORT_NOTES, IMPORT_NOT_YET,
  READABLE, IMPORT_TARGETS, SOURCE_PRESETS, MATCH_KEYS,
  sniffEncoding, parseTable, guessMapping, mappingProblems, planImport, changeBreakdown
} from "@/lib/opsImport";
import { importedLine, UNDO_LABEL, UNDO_NOTE } from "@/lib/rosterDrafts";

// ============================================================================
// ★読み込む（★見本 `stImport`・裁定 その109・2026-09-20）
//
//   ★★★入れる 先は 2つ です。
//     ①いま 居る 方 …… ★`enrollments` の 学年・学籍番号・所属 を 直します
//     ②まだ 居ない 方 … ★`roster_drafts`（★下書き）に 入ります
//       ★★名簿には まだ 入りません。★招いて、★ご本人が 入った ときです。
//
//   ★★★押すまで、★何も 変わりません。★先に 見せます。
//   ★★★1人でも お送りしたら、★取り消せません。
//
//   ★★決めは lib/opsImport.js ／ lib/rosterDrafts.js が 持ちます。
//
//   ★見張り components/tests/roster-drafts.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsImport({
  current = [], busy, error = "", lastImport, mayUndo, undoLine,
  onRun, onUndo
}) {
  const [段, set段] = useState(1);
  const [名, set名] = useState("");
  const [文字, set文字] = useState("");
  const [表, set表] = useState([]);
  const [つなぎ, setつなぎ] = useState({});
  const [もと, setもと] = useState("そのまま");
  const [見分け, set見分け] = useState("number");

  const 頭 = 表.length ? 表[0] : [];
  const 中 = 表.length > 1 ? 表.slice(1) : [];
  const 悪 = mappingProblems(つなぎ);
  const 案 = 表.length > 1
    ? planImport({ headers: 頭, rows: 中, mapping: つなぎ, current, matchKey: 見分け })
    : null;

  async function 読む(file) {
    if (!file) return;
    const buf = new Uint8Array(await file.arrayBuffer());
    const enc = sniffEncoding(buf);
    // ★★★読む ほうは Shift_JIS も できます（★書く ほうは できません）。
    const text = new TextDecoder(enc === "Shift_JIS" ? "shift_jis" : "utf-8").decode(buf);
    const t = parseTable(text);
    set名(file.name);
    set文字(enc);
    set表(t);
    setつなぎ(guessMapping(t[0] || [], もと));
    set段(2);
  }

  return (
    <div style={{ fontFamily: FONT_STACK, marginTop: 16 }} data-v2-import="1">
      <H3>{IMPORT_HEAD}</H3>
      <Warn>
        {IMPORT_WARN.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Warn>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: `${rem(8)} 0` }}>
        {STEPS.map((t, i) => (
          <Pill key={t} on={段 === i + 1}
            disabled={i + 1 > 段}
            onClick={() => (i + 1 <= 段 ? set段(i + 1) : undefined)}>
            {i + 1}　{t}
          </Pill>
        ))}
      </div>

      {/* ── ① ファイル ── */}
      {段 === 1 ? (
        <>
          <Card>
            <FieldLabel htmlFor="imp-file">{PICK_FILE}</FieldLabel>
            <input id="imp-file" type="file" accept=".csv,.txt,text/csv,text/plain"
              disabled={busy}
              onChange={(e) => { void 読む(e.target.files && e.target.files[0]); }}
              style={{ ...TYPE.mini, fontFamily: FONT_STACK }} />
            <p style={{ ...小, margin: "6px 0 0" }}>{HEADLINE_NOTE}</p>
          </Card>
          <H3>読めるもの</H3>
          <Card style={{ padding: 0, maxWidth: 640 }}>
            {READABLE.map((x, i) => (
              <Li key={x.name} last={i === READABLE.length - 1}
                style={x.ok ? undefined : { color: C.inkSoft }}
                right={<span style={小}>{x.note}</span>}>{x.name}</Li>
            ))}
          </Card>
        </>
      ) : null}

      {/* ── ② 列を つなぐ ── */}
      {段 === 2 ? (
        <>
          <p style={{ ...小, margin: 0 }}>
            {名}　／　{文字}　／　1行目を 見出しとして 読みました（{頭.length}列）
          </p>
          <FieldLabel>もとの システム</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(SOURCE_PRESETS).map((v) => (
              <Pill key={v} on={もと === v}
                onClick={() => { setもと(v); setつなぎ(guessMapping(頭, v)); }}>{v}</Pill>
            ))}
          </div>
          <Card style={{ padding: 0, marginTop: rem(8), maxWidth: 720 }}>
            {頭.map((h, i) => (
              <Li key={`${h}-${i}`} last={i === 頭.length - 1}>
                {h}
                <div style={小}>{中[0] ? 中[0][i] : ""}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {IMPORT_TARGETS.map((t) => (
                    <Pill key={t.label} on={つなぎ[h] === t.label}
                      onClick={() => setつなぎ((p) => ({ ...p, [h]: t.label }))}>
                      {t.label === "（取り込みません）" ? "入れない" : t.label}
                    </Pill>
                  ))}
                </div>
              </Li>
            ))}
          </Card>
          {悪.duplicated.length ? (
            <Warn>{悪.duplicated.join("・")} に、2つ以上の 列を つないで います。1つに してください。</Warn>
          ) : null}
          {悪.noName ? (
            <Warn>お名前が つながって いません。これが 無いと 取り込めません。</Warn>
          ) : null}
          <div style={{ marginTop: rem(10) }}>
            <Btn disabled={悪.duplicated.length > 0 || 悪.noName}
              onClick={() => set段(3)}>下読みへ ›</Btn>
          </div>
        </>
      ) : null}

      {/* ── ③ 下読み ── */}
      {段 === 3 ? (
        <>
          <p style={{ ...小, margin: 0 }}>{名}　／　先頭 5行だけ 出します</p>
          <Card style={{ padding: 0, marginTop: rem(8), overflowX: "auto" }}>
            {中.slice(0, 5).map((r, i) => (
              <Li key={i} last={i === Math.min(5, 中.length) - 1}>
                {頭.map((h, j) => (つなぎ[h] === "（取り込みません）" ? null : (
                  <span key={h} style={{ marginRight: 10 }}>
                    <span style={小}>{つなぎ[h]}　</span>{r[j]}
                  </span>
                )))}
              </Li>
            ))}
          </Card>
          <FieldLabel>どうやって 同じ人と 見分けるか</FieldLabel>
          <Card style={{ padding: 0, maxWidth: 640 }}>
            {MATCH_KEYS.map((k, i) => (
              <Li key={k.key} last={i === MATCH_KEYS.length - 1}
                style={k.ok ? undefined : { color: C.inkSoft }}
                onClick={k.ok ? () => set見分け(k.key) : undefined}
                right={<span style={小}>
                  {!k.ok ? "使えません" : 見分け === k.key ? "✓ これで 見分けます" : "これに する"}
                </span>}>
                {k.label}
                <div style={小}>{k.note}</div>
              </Li>
            ))}
          </Card>
          <p style={{ ...小, margin: "8px 0 0" }}>{NOTHING_CHANGED}</p>
          <div style={{ marginTop: rem(10) }}>
            <Btn onClick={() => set段(4)}>何が 起きるか 見る ›</Btn>
          </div>
        </>
      ) : null}

      {/* ── ④ 何が 起きるか ── */}
      {段 === 4 && 案 ? (
        <>
          <p style={{ ...小, margin: 0 }}>
            {名}　／　{MATCH_KEYS.find((k) => k.key === 見分け).label} で 見分けました
            　／　まだ 何も 変えて いません
          </p>
          <Card style={{ marginTop: rem(8) }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>
              新しい方 {案.add.length}人　／　直る {案.change.length}人　／　
              変わらない {案.same.length}人
            </p>
            <p style={{ ...小, margin: "4px 0 0" }}>
              あやしい {案.odd.length}件　／　ファイルに いない方 {案.missing.length}人
            </p>
          </Card>

          {案.change.length ? (
            <>
              <H3>直る 中身</H3>
              <Card style={{ padding: 0, maxWidth: 640 }}>
                {changeBreakdown(案.change).map((x, i, a) => (
                  <Li key={x.label} last={i === a.length - 1}
                    right={<span style={小}>{x.n}人</span>}>{x.label}</Li>
                ))}
              </Card>
            </>
          ) : null}

          {案.odd.length ? (
            <>
              <H3>{ODD_HEAD}　{案.odd.length}件</H3>
              <p style={{ ...小, margin: "-4px 0 6px" }}>{ODD_SUB}</p>
              <Card style={{ padding: 0, maxWidth: 640 }}>
                {案.odd.map((x, i) => (
                  <Li key={`${x.line}-${i}`} last={i === 案.odd.length - 1}
                    right={<span style={小}>入れません</span>}>
                    {x.line}行目　{x.what}
                  </Li>
                ))}
              </Card>
            </>
          ) : null}

          {案.missing.length ? (
            <>
              <H3>{MISSING_HEAD}　{案.missing.length}人</H3>
              <Warn>
                {MISSING_LINES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
              </Warn>
              <Card style={{ padding: 0, maxWidth: 640 }}>
                {案.missing.map((x, i) => (
                  <Li key={x.id} last={i === 案.missing.length - 1}
                    right={<span style={小}>そのまま</span>}>
                    {x.name}{x.student_number ? `　${x.student_number}` : ""}
                  </Li>
                ))}
              </Card>
            </>
          ) : null}

          <div style={{ marginTop: rem(12) }}>
            <Btn disabled={busy || (案.add.length === 0 && 案.change.length === 0)}
              onClick={() => { if (onRun) onRun(案, 見分け); set段(5); }}>
              この とおり 取り込む
            </Btn>
          </div>
        </>
      ) : null}

      {/* ── ⑤ 取り込んだ あと ── */}
      {段 === 5 ? (
        <>
          <Card style={{ borderColor: C.sage }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>
              {importedLine(lastImport ? lastImport.n : 0)}
            </p>
            <p style={{ ...小, margin: "4px 0 0" }}>{名}</p>
          </Card>
          {mayUndo ? (
            <div style={{ marginTop: rem(10) }}>
              <Btn disabled={busy} onClick={() => { if (onUndo) onUndo(); set段(1); }}>
                {UNDO_LABEL}</Btn>
              <p style={{ ...小, margin: "6px 0 0" }}>{UNDO_NOTE}</p>
            </div>
          ) : (
            <p style={{ ...小, margin: "8px 0 0" }}>{undoLine || ""}</p>
          )}
          <div style={{ marginTop: rem(10) }}>
            <Btn ghost small onClick={() => { set段(1); set表([]); set名(""); }}>
              もう1つ 読み込む</Btn>
          </div>
        </>
      ) : null}

      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      {/* ★★★まだ の ものを、★黙って 消しません。 */}
      <Wl style={{ marginTop: rem(10) }}>
        {IMPORT_NOT_YET.map((x) => (
          <span key={x.key} style={{ display: "block" }}>
            {x.line}　── まだ です。{x.why}。
          </span>
        ))}
      </Wl>

      <Note>
        {IMPORT_NOTES.map((n) => (
          <span key={n.text} style={{ display: "block" }}>{n.text}</span>
        ))}
      </Note>
    </div>
  );
}
