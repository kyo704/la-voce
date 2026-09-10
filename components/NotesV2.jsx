"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, cardStyle, rem } from "@/lib/uiKit";
import { ScreenHead, HeadRound, H3, Card, Seg, Li, Note } from "@/components/UiV2";
import {
  PRACTICE_FIELDS, isPractice, emptyPractice, pickFields, practiceTitle, practiceSub
} from "@/lib/practiceNote";
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

export default function NotesV2({ notes, onSave, onDelete, saving, renraku, todayISO, repertoireNames }) {
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
    // ★★稽古の メモは、★6つの 欄の どれが 変わっても 書きます。
    //   ★本文だけを 見ていると、★分けた とたん 1文字も 残らなく なります。
  }, [editing && editing.body, editing && PRACTICE_FIELDS.map((f) => editing[f.key]).join("\u0001")]);

  async function push(draft) {
    if (!draft || !onSave) return true;
    // ★★何も 書いていないものは、★送りません。★空の行を 作りません。
    if (isEmpty(draft)) return true;
    // ★★稽古の メモは、★6つの 欄も 一緒に 渡します（★裁定 §1）。
    //   ★★知らない 欄は 落とします（pickFields）。
    const ok = await onSave({
      id: draft.id, kind, body: draft.body,
      ...(isPractice(kind) ? pickFields(draft) : {})
    });
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
        {/* ★★稽古の メモは、★聞く項目を 分けます（★裁定 9月10日夜 §1）。
            ★★「＋を 押しても 同じ 白紙が 出ていました。
              ★書くことが 違うので、聞く項目を 分けました」
            ★★出来ばえ・点数の 欄は ありません。★作らないこと。
            ★★「みた曲」は レパートリーから 選びます。★自由に 打たせません。
              ★打たせると、★同じ曲が 2つの 名前で 増えます。
              ★★そうなると「その曲の 稽古の メモ」が 引けません。
            ★★1つも 必須に しません。★書けない 日が あります。 */}
        {isPractice(kind) ? (
          <div>
            {PRACTICE_FIELDS.map((f) => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label htmlFor={"pf-" + f.key}
                  style={{ ...TYPE.mini, display: "block", marginBottom: 3 }}>{f.label}</label>
                {f.kind === "date" ? (
                  <input id={"pf-" + f.key} type="date"
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    style={{
                      width: "100%", minHeight: 44, borderRadius: 10, padding: "0 12px",
                      border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: rem(16)
                    }} />
                ) : f.kind === "repertoire" ? (
                  <select id={"pf-" + f.key}
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    style={{
                      width: "100%", minHeight: 44, borderRadius: 10, padding: "0 12px",
                      border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: rem(16)
                    }}>
                    <option value="">えらばない</option>
                    {(repertoireNames || []).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                ) : f.kind === "area" ? (
                  <textarea id={"pf-" + f.key}
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    rows={f.key === "said_text" ? 6 : 3}
                    style={{
                      width: "100%", borderRadius: 10, padding: 12,
                      border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                      fontSize: rem(16), lineHeight: 1.9, resize: "vertical"
                    }} />
                ) : (
                  <input id={"pf-" + f.key} type="text"
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    style={{
                      width: "100%", minHeight: 44, borderRadius: 10, padding: "0 12px",
                      border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: rem(16)
                    }} />
                )}
                {f.note ? <Note style={{ marginTop: 2 }}>{f.note}</Note> : null}
              </div>
            ))}
          </div>
        ) : (
          /* ★★ほかの 帯は、★これまでどおり 本文だけです。
              ★タイトルの 欄が ありません。 */
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
        )}
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
      {/* ★★「連絡」の 帯では、★＋を 出しません（★2026-09-11・Opus の 裁定 案A）。
          ★★不具合　★連絡の 帯で ＋を 押すと、★稽古の メモが 開いていました。
            ★★書く 先が ちがいます。★書いたつもりの ものが、
              ★連絡板では なく 稽古の ノートに 入ります。
          ★★裁定の 理由　★連絡は 読む ところで、★書く 場所では ありません。
            ★★書く 道は すでに あります（★「◯◯先生に 伝える」）。
            ★★入口を 2つに しません。
          ★★＋そのものを 消していません。★ほかの 3つの 帯では 出ます。 */}
      <ScreenHead title="ノート" right={isRenrakuKind(kind) ? null : (
        <HeadRound mark="＋" label="ノートを書く"
          onClick={() => {
            // ★★稽古の メモは、★はじめから 6つの 欄を 持たせます。
            //   ★「いつ」だけ、★きょうを 入れておきます。★あとは 空です。
            setEditing(isPractice(kind)
              ? { id: null, body: "", ...emptyPractice(todayISO) }
              : { id: null, body: "" });
            setError("");
          }} />
      )} />

      {/* ★★帯 4つ（★見本⑥ .seg）。★増やしません。★流れません。 */}
      <Seg activeKey={kind} onSelect={setKind}
        items={NOTE_KINDS.map((k) => ({ key: k.key, label: k.label }))} />

      {/* ★★「連絡」の 帯だけ、★ノートでは なく 連絡板が 開きます（★見本④）。
          ★★タブを 増やさずに 置くための 形です。
          ★何を 出すかは lib/notes.js が 決めます。★ここでは 決めません。 */}
      {isRenrakuKind(kind) ? renraku : list.length === 0 ? (
        // ★★2026-09-10、★ここが 押せませんでした。
        //   ★★「＋から、思いついたことを 書けます」と 書いてあるのに、
        //     ★ただの 文でした。★押しても 何も 開きません。
        //   ★★お決めが あります ──「★行き先を 出すなら、
        //     ★その行き先は 押せる ものに すること」。
        //   ★★探して 見つからなかった ときは、★別の 話です。
        //     ★そこは 押しても 意味が ないので、★文の ままです。
        q.trim() ? (
          <Card><p style={{ ...small, margin: 0 }}>見つかりませんでした。</p></Card>
        ) : (
          <Card style={{ minHeight: 44 }}
            onClick={() => { setEditing({ id: null, body: "" }); setError(""); }}>
            <p style={{ ...small, margin: 0 }}>＋から、思いついたことを書けます。</p>
          </Card>
        )
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
            onClick={() => {
              // ★★開くときも、★6つの 欄を 一緒に 持ってきます。
              setEditing(isPractice(kind)
                ? {
                  id: n.id, body: n.body || "",
                  ...emptyPractice(todayISO), ...pickFields(n),
                  lesson_on: n.lesson_on || todayISO || null
                }
                : { id: n.id, body: n.body || "" });
              setError("");
            }}>
            <div style={{ ...TYPE.body, lineHeight: 1.7 }}>
              {/* ★★稽古の メモには 本文が ありません。
                  ★言われたことの 1行目を 見出しに します。
                  ★★点も 出来ばえも 出しません。 */}
              {isPractice(kind)
                ? (practiceTitle(n) || "（まだ何も書いていません）")
                : (titleOf(n.body) || "（まだ何も書いていません）")}
              {isPractice(kind)
                ? (practiceSub(n) ? <><br />{practiceSub(n)}</> : null)
                : (previewOf(n.body) ? <><br />{previewOf(n.body)}</> : null)}
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
            fontSize: rem(16)
          }} />
      </div>
      </>
      )}
    </div>
  );
}
