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
import RangeCalendar from "@/components/RangeCalendar";
import {
  CLINIC_ALWAYS, CLINIC_OPTIONAL, CLINIC_DEFAULT, CLINIC_HEADINGS,
  CLINIC_NOTICE, isOn, togglePick, writePick
} from "@/lib/clinicSheet";

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

export default function NotesV2({ notes, onSave, onAddRepertoire, onDelete, onDeleteRepertoire, saving, renraku, todayISO, repertoireNames, repertoireItems = [], teacherOptions = [], onOpenClinicSummary }) {
  const [kind, setKind] = useState(DEFAULT_KIND);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);   // ★{ id, body } ★null なら 一覧
  const [error, setError] = useState("");
  const [clinicMode, setClinicMode] = useState("doctor");
  const [clinicRange, setClinicRange] = useState({});
  const [clinicPick, setClinicPick] = useState(CLINIC_DEFAULT);
  const [clinicOwnWords, setClinicOwnWords] = useState("");
  const [clinicGenerated, setClinicGenerated] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);
  // ★★見本の レパートリー一覧 ── ★曲を 開くと、★右上の … から 直す・消す。
  //   ★直す は 既存の 編集画面を そのまま 開きます（★同じ 入口）。
  //   ★消す は 確認を 1回だけ 出してから 送ります。
  const [repMenuOpen, setRepMenuOpen] = useState(null);
  const [repDeleteConfirm, setRepDeleteConfirm] = useState(null);

  const list = visibleNotes(notes, kind, isPractice(kind) ? q : "");
  const noteRows = list.map((n) => n);
  const rows = kind === "repertoire" ? repertoireItems : noteRows;

  function clinicScreen() {
    const days = (notes || []).filter((n) => n && !n.deleted_at && String(n.created_at || n.updated_at || "").slice(0, 10)
      >= String(clinicRange.start || "0000-00-00").slice(0, 10)
      && String(n.created_at || n.updated_at || "").slice(0, 10)
      <= String(clinicRange.end || "9999-99-99").slice(0, 10)).length;
    if (clinicGenerated) {
      return (
        <div className="reference-ui clinic-editor">
          <Back onClick={() => setClinicGenerated(false)}>もどる</Back>
          <div className="hd"><h2>{clinicMode === "doctor" ? "お医者さんに 見せる 1枚" : "レッスンに 持っていく 1枚"}</h2></div>
          <Card>
            <b>{clinicRange.start && clinicRange.end ? `${clinicRange.start} 〜 ${clinicRange.end}` : "期間未選択"}</b>
            <p style={small}>この期間に 記録した日数：{days}日</p>
            {clinicPick.map((key) => <p key={key} style={small}>{CLINIC_OPTIONAL.find((x) => x.key === key)?.label}</p>)}
            {clinicOwnWords ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{clinicOwnWords}</p> : null}
          </Card>
          <Btn onClick={() => onOpenClinicSummary?.({ mode: clinicMode, range: clinicRange, pick: clinicPick, ownWords: clinicOwnWords })}>一枚を 表示する</Btn>
        </div>
      );
    }
    return (
      <div className="reference-ui clinic-editor">
        <div className="pills">
          <Pill on={clinicMode === "doctor"} onClick={() => setClinicMode("doctor")}>お医者さんに 見せる 1枚</Pill>
          <Pill on={clinicMode === "lesson"} onClick={() => setClinicMode("lesson")}>レッスンに 持っていく 1枚</Pill>
        </div>
        <div className="warn">この1枚を作ります。<br /><b>載せるものは、自分で1つずつ選びます。</b></div>
        <FieldLabel>期間</FieldLabel>
        <RangeCalendar value={clinicRange} todayISO={todayISO} max={todayISO} onChange={setClinicRange} />
        <FieldLabel>{CLINIC_HEADINGS.always}</FieldLabel>
        <Card>{CLINIC_ALWAYS.map((x) => <div key={x.key} className="li">{x.label}<span>載せる</span></div>)}</Card>
        <FieldLabel>{CLINIC_HEADINGS.optional}</FieldLabel>
        <Card>{CLINIC_OPTIONAL.map((x) => (
          <button key={x.key} type="button" className="li w-full text-left"
            onClick={() => setClinicPick(writePick(togglePick(clinicPick, x.key)))}>
            <span>{x.label}</span><span>{isOn(clinicPick, x.key) ? "✓ 載せる" : "載せない"}</span>
          </button>
        ))}</Card>
        <FieldLabel>本人の ことば</FieldLabel>
        <TextArea value={clinicOwnWords} onChange={(e) => setClinicOwnWords(e.target.value)}
          placeholder="例：高い音の 入りが 不安です。息が 続かない日が ありました。" style={{ minHeight: 90 }} />
        <Btn onClick={() => setClinicGenerated(true)}>2項目で 1枚に する</Btn>
        <Note>{CLINIC_NOTICE.map((line) => <span key={line}>・{line}<br /></span>)}</Note>
      </div>
    );
  }
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
    if (kind !== "repertoire" && isEmpty(draft)) return true;
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

  if (!editing && kind === "clinic") {
    return (
      <div className="reference-ui">
        <ScreenHead title="ノート" right={<HeadRound mark="＋" label="ノートを書く" onClick={() => setClinicGenerated(false)} />} />
        <Seg activeKey={kind} onSelect={setKind}
          items={NOTE_KINDS.map((k) => ({ key: k.key, label: k.label }))} />
        {clinicScreen()}
      </div>
    );
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
                    {(teacherOptions.length > 0 ? teacherOptions : ["斎藤 めぐみ", "渡辺 たける", "自主練"]).map((name) => (
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
        {((kind === "repertoire" && onDeleteRepertoire && editing.repertoire_name) || (kind !== "repertoire" && editing.id && onDelete)) ? (
          <button type="button"
            onClick={async () => {
              const ok = kind === "repertoire"
                ? await onDeleteRepertoire(editing.repertoire_name, editing.id)
                : await onDelete(editing.id);
              if (ok !== false) setEditing(null);
            }}
            className="w-full"
            style={{
              minHeight: 48, borderRadius: 10, border: `1px solid ${C.line}`,
              background: C.card, color: C.inkSoft, fontSize: "0.8125rem"
            }}>この{kind === "repertoire" ? "曲" : "ノート"}を 消す</button>
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
      <ScreenHead title="ノート" right={(
        <HeadRound mark="＋" label="ノートを書く"
          onClick={() => {
            const nextKind = isRenrakuKind(kind) ? "practice" : kind;
            if (nextKind !== kind) setKind(nextKind);
            // ★★稽古の メモは、★はじめから 6つの 欄を 持たせます。
            //   ★「いつ」だけ、★きょうを 入れておきます。★あとは 空です。
            setEditing(isRenrakuKind(kind) || isPractice(kind)
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
      {isRenrakuKind(kind) ? renraku : (kind === "repertoire" ? repertoireItems : list).length === 0 ? (
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
              if (isRenrakuKind(kind) || isPractice(kind)) {
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
              {isPractice(kind) ? "まだ、稽古の メモが ありません。" : kind === "repertoire" ? "＋ 曲を 足す" : "まだ、受診用の 1枚が ありません。"}
            </p>
          </Card>
        )
      ) : (
        <>
        {rows.map((n) => (
          kind === "repertoire" ? (
            // ★★見本の レパートリー一覧 ── ★曲名（太字）／作曲家　役／ようす／記録N日。
            //   ★末尾に「＋ 曲を 足す」を 常に 1つだけ 置きます（★下に あります）。
            <Card key={`${n.noteId || "repertoire"}-${n.name || ""}`} className="rep" style={{ minHeight: 44 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ ...TYPE.body, lineHeight: 1.8, flex: 1, minWidth: 0 }}>
                  <b>{n.name || "（曲名 まだ）"}</b>
                  {(n.composer || n.positionIn) ? (
                    <><br />{n.composer}{n.composer && n.positionIn ? "　" : ""}{n.positionIn}</>
                  ) : null}
                  {n.status ? <><br />{n.status}</> : null}
                  <br />記録 {n.recordDays || 0}日
                </div>
                <button type="button"
                  aria-label={(n.name || "曲") + "を 直す・消す"}
                  onClick={() => {
                    setRepMenuOpen(repMenuOpen === n.name ? null : n.name);
                    setRepDeleteConfirm(null);
                  }}
                  style={{
                    minWidth: 44, minHeight: 44, margin: "-10px -6px",
                    background: "transparent", border: "none",
                    color: C.inkSoft, fontSize: 15
                  }}>…</button>
              </div>
              {repMenuOpen === n.name ? (
                <div className="rounded-xl" style={{ background: C.paper, marginTop: 8, padding: 10 }}>
                  {repDeleteConfirm === n.name ? (
                    <>
                      <p style={{ ...small, marginBottom: 8 }}>
                        「{n.name}」を 消します。もとに 戻せません。
                      </p>
                      <Two>
                        <Btn ghost onClick={() => setRepDeleteConfirm(null)}>やめる</Btn>
                        <Btn onClick={async () => {
                          const ok = onDeleteRepertoire ? await onDeleteRepertoire(n.name, n.noteId) : false;
                          if (ok !== false) { setRepMenuOpen(null); setRepDeleteConfirm(null); }
                        }}>消す</Btn>
                      </Two>
                    </>
                  ) : (
                    <Two>
                      <Btn ghost onClick={() => {
                        setEditing({
                          id: n.noteId || null, body: n.name || "",
                          repertoire_name: n.name || "",
                          composer: n.composer || "", position_in: n.positionIn || "",
                          language: n.language || "イタリア語", high_note: n.highNote || "",
                          low_note: n.lowNote || "", status: n.status || "はじめたばかり",
                          performance: n.performance || ""
                        });
                        setError(""); setRepMenuOpen(null);
                      }}>直す</Btn>
                      <Btn onClick={() => setRepDeleteConfirm(n.name)}>消す</Btn>
                    </Two>
                  )}
                </div>
              ) : null}
            </Card>
          ) : (
          // ★★見本⑥の 1枚 ── ★本文が 2行、★その下に 日付（.usu）。
          //   ★★見出しと 抜粋を 別の 大きさに していました。
          //     ★見本は 同じ 大きさの 本文 2行です。★そちらに 合わせます。
          //   ★★見出しが 本文の 1行目である、という 決めは そのままです
          //     （★lib/notes.js の titleOf）。★見え方だけ 変えました。
          //   ★★狭い画面の 話です。★広い画面（決まりB）は 名前と 日付だけで、
          //     ★本文の 抜粋を 出しません。★あちらは 人に 見られる 画面です。
          <Card key={n.id || `note-${n.body || ""}`} className="nt" style={{ minHeight: 44 }}
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
          )
        ))}
        {kind === "repertoire" ? (
          <>
            <Card onClick={() => {
              setEditing({ id: null, body: "", repertoire_name: "", composer: "", position_in: "", language: "イタリア語", high_note: "", low_note: "", status: "はじめたばかり", performance: "" });
              setError("");
            }} style={{ minHeight: 44, cursor: "pointer" }}>
              <p style={{ ...TYPE.body, margin: 0 }}>＋ 曲を 足す</p>
            </Card>
            <Note>
              曲を 開くと、右上の … から 直す・消す ことが できます。
            </Note>
          </>
        ) : null}
        </>
      )}

    </div>
  );
}
