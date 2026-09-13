"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, rem } from "@/lib/uiKit";
import {
  ScreenHead, HeadRound, H3, Card, Seg, Pill, Btn, Two, Li, Note, Back, Input, TextArea, FieldLabel
} from "@/components/UiV2";
import {
  PRACTICE_FIELDS, REPERTOIRE_STATUS, isPractice, emptyPractice, pickFields, practiceTitle, practiceSub
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

export default function NotesV2({ notes, onSave, onAddRepertoire, onDelete, saving, renraku, todayISO, repertoireNames }) {
  const [kind, setKind] = useState(DEFAULT_KIND);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);   // ★{ id, body } ★null なら 一覧
  const [error, setError] = useState("");
  const timer = useRef(null);
  const boxRef = useRef(null);

  const list = visibleNotes(notes, kind, isPractice(kind) ? q : "");

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
    if (kind === "repertoire" && onAddRepertoire) {
      const ok = await onAddRepertoire({
        id: draft.id, name: draft.repertoire_name, composer: draft.composer,
        positionIn: draft.position_in, language: draft.language,
        highNote: draft.high_note, lowNote: draft.low_note,
        status: draft.status, performance: draft.performance
      });
      if (!ok) { setError("まだ足せていません。開いたままにしています。"); return false; }
      setError("");
      return true;
    }
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
      <div className="reference-ui practice-editor">
        <div className="flex items-center justify-between">
          {/* ★★「もどる」で 閉じます。★「保存」は ありません。
              ★★戻る は 共通の 部品です（★見本 .back）。★写しを 置きません。 */}
          <Back onClick={close}>もどる</Back>
          <span style={small}>{saving ? "書いています" : ""}</span>
        </div>
        <div className="hd" style={{ paddingTop: 2 }}>
          <h2 style={{ ...TYPE.title }}>
            {isPractice(kind) ? "稽古の メモ" : kind === "repertoire" ? "曲を 足す" : "受診用の 1枚"}
          </h2>
        </div>
        <div className="warn">
          {isPractice(kind) ? (
            <>
              稽古と レパートリーは、<b>書くことが 違います</b>。ここは <b>その日 言われたこと</b>を 残す場所です。<br />
            </>
          ) : kind === "repertoire" ? (
            <>
              レパートリーは <b>曲の 台帳</b>です。稽古の メモとは 別の 項目を 聞きます。<br />
            </>
          ) : null}
          打ったものは、ほかを 押しても <b>消えません</b>。
        </div>
        {/* ★★稽古の メモは、★聞く項目を 分けます（★裁定 9月10日夜 §1）。
            ★★「＋を 押しても 同じ 白紙が 出ていました。
              ★書くことが 違うので、聞く項目を 分けました」
            ★★不要な 判定欄は 作らないこと。
            ★★「みた曲」は レパートリーから 選びます。★自由に 打たせません。
              ★打たせると、★同じ曲が 2つの 名前で 増えます。
              ★★そうなると「その曲の 稽古の メモ」が 引けません。
            ★★1つも 必須に しません。★書けない 日が あります。 */}
        {isPractice(kind) ? (
          <div className="practice-fields">
            {PRACTICE_FIELDS.map((f) => (
              <div key={f.key} className={`practice-field practice-field-${f.key}`}>
                <FieldLabel htmlFor={"pf-" + f.key} style={{ margin: "0 0 3px" }}>
                  {f.key === "repertoire_name" ? "みた 曲（レパートリーから）"
                    : f.key === "next_action" ? "次に 自分が すること（1つ）" : f.label}
                </FieldLabel>
                {f.key === "teacher_label" ? (
                  <div className="pills practice-pills">
                    {["斎藤 めぐみ", "渡辺 たける", "自主練"].map((name) => (
                      <Pill key={name} on={editing[f.key] === name}
                        onClick={() => setEditing({ ...editing, [f.key]: name })}>
                        {name}
                      </Pill>
                    ))}
                  </div>
                ) : f.kind === "date" ? (
                  <Input id={"pf-" + f.key} type="date"
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                ) : f.kind === "repertoire" ? (
                  <>
                    <select id={"pf-" + f.key} value={editing[f.key] || ""}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      aria-hidden="true" tabIndex={-1} className="practice-selection-source">
                      <option value="">えらばない</option>
                      {(repertoireNames || []).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <div className="pills practice-pills">
                    {(repertoireNames || []).map((n) => (
                      <Pill key={n} on={editing[f.key] === n}
                        onClick={() => setEditing({ ...editing, [f.key]: n })}>
                        {n}
                      </Pill>
                    ))}
                    <Pill on={false} onClick={() => setEditing({ ...editing, [f.key]: "" })}>えらばない</Pill>
                    </div>
                  </>
                ) : f.kind === "area" ? (
                  <TextArea id={"pf-" + f.key}
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    rows={f.key === "said_text" ? 4 : 2}
                    placeholder={f.key === "said_text" ? "そのまま、聞いたとおりに"
                      : f.key === "next_action" ? "れい：下降形で 肋骨を 開いたまま"
                        : "書かなくても かまいません"}
                    style={{ minHeight: f.key === "said_text" ? 88 : 52, lineHeight: 1.7 }} />
                ) : (
                  <Input id={"pf-" + f.key} type="text"
                    value={editing[f.key] || ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                )}
                {f.note ? <Note style={{ marginTop: 2 }}>{f.note}</Note> : null}
              </div>
            ))}
          </div>
        ) : kind === "repertoire" ? (
          <div className="repertoire-editor">
            <div className="fl">曲名</div>
            <Input value={editing.repertoire_name || ""} placeholder="れい：ラ・ボエーム"
              onChange={(e) => setEditing({ ...editing, repertoire_name: e.target.value })} />
            <div className="fl">作曲家</div>
            <Input value={editing.composer || ""} placeholder="れい：プッチーニ"
              onChange={(e) => setEditing({ ...editing, composer: e.target.value })} />
            <div className="fl">役・曲集の中の 位置（あれば）</div>
            <Input value={editing.position_in || ""} placeholder="れい：ミミ／第3幕"
              onChange={(e) => setEditing({ ...editing, position_in: e.target.value })} />
            <div className="fl">ことば</div>
            <div className="pills practice-pills">
              {["イタリア語", "ドイツ語", "フランス語", "日本語", "英語", "ラテン語", "ロシア語"].map((v) => (
                <Pill key={v} on={editing.language === v}
                  onClick={() => setEditing({ ...editing, language: v })}>{v}</Pill>
              ))}
            </div>
            <div className="fl">一番高い音・低い音（あれば）</div>
            <Two>
              <Input value={editing.high_note || ""} placeholder="高い　れい：B♭4"
                onChange={(e) => setEditing({ ...editing, high_note: e.target.value })} />
              <Input value={editing.low_note || ""} placeholder="低い　れい：G3"
                onChange={(e) => setEditing({ ...editing, low_note: e.target.value })} />
            </Two>
            <div className="fl">様子</div>
            <div className="pills practice-pills">
              {REPERTOIRE_STATUS.map((v) => (
                <Pill key={v} on={editing.status === v}
                  onClick={() => setEditing({ ...editing, status: v })}>{v}</Pill>
              ))}
            </div>
            <div className="fl">本番の 予定（あれば）</div>
            <Input value={editing.performance || ""} placeholder="れい：11月20日 定期演奏会"
              onChange={(e) => setEditing({ ...editing, performance: e.target.value })} />
            <div className="card repertoire-preview">
              <div style={{ fontSize: 12, lineHeight: 1.85 }}>
                いま 入っているもの<br />
                <b>{editing.repertoire_name || "（曲名 まだ）"}</b>{"　"}{editing.composer || ""}{"　"}{editing.position_in || ""}<br />
                {editing.language || "ことば 未選択"}{"　／　"}{editing.high_note || "—"}{" 〜 "}{editing.low_note || "—"}{"　／　"}{editing.status || "ようす 未選択"}
              </div>
            </div>
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
        <Two style={{ marginTop: 12 }}>
          <Btn ghost onClick={() => { if (timer.current) clearTimeout(timer.current); setEditing(null); setError(""); }}>やめる</Btn>
          <Btn onClick={close}>しまう</Btn>
        </Two>
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
    <div className="reference-ui">
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
              : kind === "repertoire"
                ? { id: null, body: "", repertoire_name: "", composer: "", position_in: "", language: "イタリア語", high_note: "", low_note: "", status: "はじめたばかり", performance: "" }
                : { id: null, body: "" });
            setError("");
          }} />
      )} />

      {/* ★★帯 4つ（★見本⑥ .seg）。★増やしません。★流れません。 */}
      <Seg activeKey={kind} onSelect={setKind}
        items={NOTE_KINDS.map((k) => ({ key: k.key, label: k.label }))} />

      {/* ★★一覧より先に置きます（★見本⑥）。
          ★★書いたものを探す入口を、最初に見つけられるようにします。 */}
      {isPractice(kind) ? (
        <>
          <H3>この中から さがす</H3>
          <Card>
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="🔍　ことばで さがす"
              style={{
                width: "100%", minHeight: SPACE.tapMin, padding: 0,
                border: "none", background: "transparent", color: C.ink,
                // ★★iOS で画面が寄らないよう、16pxを下回らせません。
                fontSize: rem(16)
              }} />
          </Card>
        </>
      ) : null}

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
        isPractice(kind) && q.trim() ? (
          <Card><p style={{ ...small, margin: 0 }}>見つかりませんでした。</p></Card>
        ) : (
          <Card style={{ minHeight: 44, cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isPractice(kind)) {
                setEditing({ id: null, body: "", ...emptyPractice(todayISO) });
              } else if (kind === "repertoire") {
                setEditing({ id: null, body: "", repertoire_name: "", composer: "", position_in: "", language: "イタリア語", high_note: "", low_note: "", status: "はじめたばかり", performance: "" });
              } else {
                setEditing({ id: null, body: "" });
              }
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
            }}>
            <p style={{ ...TYPE.body, margin: 0 }}>
              {isPractice(kind)
                ? "まだ、稽古の メモが ありません。"
                : kind === "repertoire"
                  ? "まだ、レパートリーが ありません。"
                  : "まだ、受診用の 1枚が ありません。"}
            </p>
            <p style={{ ...small, margin: "4px 0 0" }}>
              右上の ＋ から、書きはじめられます。
            </p>
          </Card>
        )
      ) : (
        <>
        {list.map((n) => (
          // ★★見本⑥の 1枚 ── ★本文が 2行、★その下に 日付（.usu）。
          //   ★★見出しと 抜粋を 別の 大きさに していました。
          //     ★見本は 同じ 大きさの 本文 2行です。★そちらに 合わせます。
          //   ★★見出しが 本文の 1行目である、という 決めは そのままです
          //     （★lib/notes.js の titleOf）。★見え方だけ 変えました。
          //   ★★狭い画面の 話です。★広い画面（決まりB）は 名前と 日付だけで、
          //     ★本文の 抜粋を 出しません。★あちらは 人に 見られる 画面です。
          <Card key={n.id} className={isPractice(kind) ? "nt" : kind === "repertoire" ? "rep" : "nt"} style={{ minHeight: 44 }}
            onClick={() => {
              // ★★開くときも、★6つの 欄を 一緒に 持ってきます。
              setEditing(isPractice(kind)
                ? {
                  id: n.id, body: n.body || "",
                  ...emptyPractice(todayISO), ...pickFields(n),
                  lesson_on: n.lesson_on || todayISO || null
                }
                : kind === "repertoire"
                  ? { id: n.id, body: n.body || "", repertoire_name: n.body || "", composer: "", position_in: "", language: "イタリア語", high_note: "", low_note: "", status: "はじめたばかり", performance: "" }
                : { id: n.id, body: n.body || "" });
              setError("");
            }}>
            <div style={{ ...TYPE.body, lineHeight: 1.7 }}>
              {/* ★★稽古の メモには 本文が ありません。
                  ★言われたことの 1行目を 見出しに します。 */}
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
        ))}
        {kind === "repertoire" ? (
          <Note fold>
            レパートリーは <b>曲の 台帳</b>です。稽古の メモとは 別の 項目です。<br />
            判定欄は ありません。「様子」は ご自分で 選ぶ段階です。<br />
            足した曲は、<b>稽古の「みた 曲」</b>にも 選べるようになります。
          </Note>
        ) : null}
        </>
      )}

    </div>
  );
}
