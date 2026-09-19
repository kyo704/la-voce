"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  ScreenHead, H3, Box, Li, Warn, Note, Usu, FieldLabel, Input
} from "@/components/UiV2";
import {
  HEAD, SCOPE_HEAD, LEAD, BIO_MAX, bioTooLong,
  SCOPES, scopesFor, ENTRY_KINDS, inGivenOrder, NOTES, SCOPE_NOTES, NOT_YET
} from "@/lib/portfolio";

// ============================================================================
// ★経歴（ポートフォリオ）── ★見本 `SC['経歴']` ／ `SC['公開の範囲']`
//
//   ★★★字の もの だけ です（★2026-09-19・坂本さんの お決め D6）。
//     ★★録画と 宣材写真は、★置き場（Storage）が 要ります。★後に します。
//     ★★★「えらぶ」の 札を 置きません。★押しても 何も 起きない 札に なります（§8⑤）。
//
//   ★★決めは lib/portfolio.js が 持ちます。★ここでは 決めません。
//     ★公開の 範囲・字の 長さ・並べ方・但し書き、すべて あちら です。
//
//   ★★★賞の 有無で 並べ替えません。★渡された 順の まま 出します。
//
//   ★見張り components/tests/portfolio-screen.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

/**
 * ★1つの まとまり（★学んだところ ／ 賞・コンクール ／ 師事）。
 *
 *   ★★★「＋ 足す」を 押すと、★その場に 2つの 欄が 出ます。
 *     ★★別の 画面へ 移りません。★戻る 道を 1本 増やさない ため です。
 *   ★★消すのは 1度 押すだけ です。★「よろしいですか」を 出しません。
 *     ★★もう一度 足せます。★取り返しが つきます。
 *   ★★★並べ替えません。★渡された 順の まま です（★賞で 順位を 作りません）。
 */
function Kind({ kind, entries, saving, onAddEntry, onRemoveEntry }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const 並 = inGivenOrder((entries || []).filter((x) => x && x.kind === kind.key));

  async function 足す() {
    if (!String(title).trim() || !onAddEntry) return;
    const ok = await onAddEntry({
      kind: kind.key, title: title.trim(), detail: detail.trim() || null
    });
    if (ok !== false) { setTitle(""); setDetail(""); setOpen(false); }
  }

  return (
    <div>
      <H3>{kind.label}</H3>
      {並.length > 0 ? (
        <Box>
          {並.map((x, i) => (
            <Li key={x.id || i} last={i === 並.length - 1}
              right={onRemoveEntry ? "消す" : null}
              onClick={onRemoveEntry ? () => onRemoveEntry(x) : null}>
              {x.title}
              {x.detail ? <div style={小}>{x.detail}</div> : null}
            </Li>
          ))}
        </Box>
      ) : null}

      {open ? (
        <div style={{ marginTop: rem(6) }}>
          <FieldLabel>{kind.hint}</FieldLabel>
          <Input value={title} placeholder="" onChange={(e) => setTitle(e.target.value)} />
          <FieldLabel>そえがき（年など・なくても かまいません）</FieldLabel>
          <Input value={detail} placeholder="" onChange={(e) => setDetail(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: rem(8) }}>
            <button type="button" disabled={saving || !String(title).trim()}
              onClick={() => { void 足す(); }}
              style={{
                minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 999,
                border: `1px solid ${C.curtain}`,
                background: String(title).trim() ? C.curtain : C.line,
                color: "#FFFDF8", ...TYPE.mini, fontFamily: FONT_STACK
              }}>足す</button>
            <button type="button" onClick={() => { setOpen(false); setTitle(""); setDetail(""); }}
              style={{
                minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                ...TYPE.mini, fontFamily: FONT_STACK
              }}>やめる</button>
          </div>
        </div>
      ) : (
        onAddEntry ? (
          <button type="button" disabled={saving} onClick={() => setOpen(true)}
            style={{
              minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink,
              ...TYPE.mini, fontFamily: FONT_STACK, marginTop: rem(6)
            }}>＋ 足す</button>
        ) : null
      )}
      {!open ? <Usu>{kind.hint}</Usu> : null}
    </div>
  );
}

export default function PortfolioV2({
  // ★いまの 中身（★null なら まだ 1行も ありません）
  value, entries = [],
  // ★書き換え（★押した その場で 上へ 返します。★ためこみません）
  onChange, onAddEntry, onRemoveEntry,
  // ★公開の 範囲を 選ぶ 1枚を 出して いるか
  scopeOpen, onOpenScope, onCloseScope,
  // ★18歳未満の 方に `link` を 出さない ため に 要ります
  profile,
  saving, error = ""
}) {
  const p = value || {};
  const 範囲 = scopesFor(profile);
  const いま = SCOPES.find((s) => s.key === (p.visibility || "self")) || SCOPES[0];

  // ==========================================================================
  // ★公開の 範囲（★見本 `SC['公開の範囲']`）
  // ==========================================================================
  if (scopeOpen) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <ScreenHead title={SCOPE_HEAD} right={
          <button type="button" onClick={onCloseScope}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, fontFamily: FONT_STACK
            }}>閉じる</button>
        } />
        <Box>
          {範囲.map((s, i) => (
            <Li key={s.key} last={i === 範囲.length - 1}
              right={p.visibility === s.key
                ? <span style={{ color: C.sage }}>いま これです</span> : "これに する"}
              onClick={() => onChange && onChange({ visibility: s.key })}>
              {s.label}
              <div style={小}>{s.note}</div>
            </Li>
          ))}
        </Box>
        {/* ★★★まだ 無い ものを、★在る ように 見せません。
            ★★URL・QR・紙・PDF は、★外に 出す 道 です。★その 道が ありません。 */}
        <Note>
          {SCOPE_NOTES.map((t) => (<div key={t}>{t}</div>))}
        </Note>
        <H3>まだ できない こと</H3>
        <Box>
          {NOT_YET.map((x, i) => (
            <Li key={x.key} last={i === NOT_YET.length - 1} right="まだ">
              {x.label}
              <div style={小}>{x.needs}</div>
            </Li>
          ))}
        </Box>
      </div>
    );
  }

  // ==========================================================================
  // ★経歴（★見本 `SC['経歴']`）
  // ==========================================================================
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} />
      <Warn>{LEAD}</Warn>

      <H3>お名前</H3>
      <Input value={p.display_name || ""} placeholder="日本語でも、ローマ字でも"
        onChange={(e) => onChange && onChange({ display_name: e.target.value })} />
      <Usu>書いた ままに 出ます。芸名でも かまいません。</Usu>

      <H3>声種・楽器</H3>
      <Input value={p.instrument || ""} placeholder="れい：テノール"
        onChange={(e) => onChange && onChange({ instrument: e.target.value })} />

      <H3>じぶんのことば</H3>
      <textarea value={p.bio || ""}
        onChange={(e) => onChange && onChange({ bio: e.target.value })}
        placeholder="何を 書いても かまいません"
        style={{
          width: "100%", minHeight: 132, borderRadius: 12, padding: 10,
          border: `1px solid ${bioTooLong(p.bio) ? C.curtain : C.line}`,
          background: C.paper, color: C.ink, fontSize: "1rem", lineHeight: 1.85,
          resize: "vertical", fontFamily: FONT_STACK
        }} />
      {/* ★★★数を 出しますが、★切りません。★書いた ものを 消しません。 */}
      <Usu>{BIO_MAX}字まで。改行できます。{
        bioTooLong(p.bio) ? `　いまは ${String(p.bio || "").length}字 です。` : ""}</Usu>

      {/* ★★学んだところ ／ 賞・コンクール ／ 師事 */}
      {ENTRY_KINDS.map((k) => (
        <Kind key={k.key} kind={k} entries={entries} saving={saving}
          onAddEntry={onAddEntry} onRemoveEntry={onRemoveEntry} />
      ))}

      {/* ★★だれが 見られますか（★見本では 別の 画面 です） */}
      <H3>{SCOPE_HEAD}</H3>
      <Box>
        <Li last right={いま.label} onClick={onOpenScope}>公開の 範囲</Li>
      </Box>

      {error ? (
        <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
      ) : null}
      {saving ? <p style={小}>書いて います…</p> : null}

      <Note>
        {NOTES.map((t) => (<div key={t}>{t}</div>))}
      </Note>
    </div>
  );
}
