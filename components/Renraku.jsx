"use client";

import { useState, useRef } from "react";
import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
import {
  NOTICE_LINE, NO_ATTACH_LINE,
  HIDE_AFTER_DAYS, HIDE_LINE, GO_MISOU_LABEL, GO_MISOU_SUB, SOON_LINE, visibleMessages, mayPost, studioName, isTwoPane, BODY_WIDTH,
  // ★★裁定 その87（2026-09-18）。★字も 幅も lib が 持ちます。
  LIST_WIDTH, NO_READ_TRACKING_LINE, MONKA_READ_SELF_LINE, showMonkaReadSelfBanner,
  MONKA_READ_PAUSED_LINE, monkaReadOpen,
  SECTION_ANNOUNCE, SECTION_MONKA,
  SCREEN_HEAD, EMPTY_HEAD, EMPTY_HOW, isEmptyBoard,
  // ★★2026-09-19（★実機の ご報告）── ★一覧に 本文を 出しません。
  announceRow, ANNOUNCE_OPEN_HINT, ANNOUNCE_READ_LINE,
  // ★★2026-09-19 ── ★いつ の 字。★ホームと 同じ ものを 使います。
  whenWord
} from "@/lib/renraku";

// ============================================================================
// 連絡 ── 門下の連絡板（見本①〜⑤ ／ 2026-09-10）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
//            docs/opus/woolsong-見本-連絡-パソコンiPad（9月10日）.png
//
//   ★★名前は「連絡」です。★「掲示板」とは 呼びません。
//
//   ★★書く欄の 下に、★いつも 1行 出します（★§6-1 の 対処①）。
//     ★★これが 実際の 守りです。★安く、正直で、これ以上のものは ありません。
//
//   ★★運営の方は、★読むだけです。★書き込めません（★見本③）。
//     ★開いたことは 記録に 残り、★先生と 学生の 画面から 見られます。
//
//   ★★休むことは、★ここに 書かせません（★§6-1 の 対処②）。
//     ★別の道（★見本⑥）へ 分けています。
//
//   ★★広い画面は 決まりB（★2026-09-10・坂本さんの お決め）。
//     ★本文 640px ／ 2ペイン ／ 一覧には 名前と 最終更新だけ
//     ★★本文の 抜粋を 出しません。★肩ごしに 読まれないためです。
//
//   ★数と 決めは lib/renraku.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/renraku.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
// ★★★6段に 寄せました（★裁定 その103・2026-09-19）。
//   ★★この 画面が 出るのは 2つ だけ です（`tools/screen_gate_check.py`）──
//     ★①門の 中（記録の「つたえる」）②運営の 画面（★12画面は 6段 済み）。
//   ★★★古い 個人画面には 出ません。★だから 丸ごと 寄せます。
//   ★★11→12.5／9→12／14→14.5／15→15.5（★役で 寄せます）。
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };

// ★★幅を 見る 仕掛けは `components/useWindowWidth.js` に 移しました（★2026-09-18）。
//   ★★同じ ものが 4か所に あり、★2つだけ 向きの 変化を 聞いて いました。

// ★★★`whenWord` は `lib/renraku.js` へ 移しました（★2026-09-19）。
//   ★★ホームの「門下の 連絡」でも 同じ 字を 出します。
//   ★★★ここに 写しを 置くと、★片方だけ 直る 日が 来ます。
//   ★★あわせて、★字の 切り出しを やめました。★端末の 時計で 読みます。

/** ★書き込みの 1つ。★取り消したものは、★1行だけ 残します。 */
function Message({ m, nameOf }) {
  if (m.withdrawn) {
    return (
      <div style={{ ...card, opacity: 0.55 }}>
        <p style={small}>取り消されました</p>
      </div>
    );
  }
  return (
    <div style={card}>
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: "0.8125rem", color: C.ink }}>
          {nameOf ? nameOf(m.author_id) : ""}
          {m.role_badge ? (
            <span style={{
              fontSize: "0.75rem", color: C.inkSoft, background: C.paper,
              border: `1px solid ${C.line}`, borderRadius: 999,
              padding: "2px 7px", marginLeft: 6
            }}>{m.role_badge}</span>
          ) : null}
        </span>
        <span style={small}>{whenWord(m.created_at)}</span>
      </div>
      <p style={{ fontSize: "0.90625rem", color: C.ink, lineHeight: 1.85, marginTop: 4, whiteSpace: "pre-wrap" }}>
        {m.body}
      </p>
      {/* ★★もうすぐ 消えるものに、★1行 添えます（★見本③）。 */}
      {/* ★★「90日で 消えます」→「90日で 画面から 消えます」（★裁定 その77）。
          ★★消して いません。★消す 仕掛けが どこにも ありません。 */}
      {m.soon ? (
        <p style={small}>{SOON_LINE.replace("{n}", HIDE_AFTER_DAYS)}</p>
      ) : null}
    </div>
  );
}

export default function Renraku({
  studios, announcements, messages, openStudio, onOpenStudio,
  role, isTeacherOf, isMemberOf, nameOf, teacherNameOf,
  onPost, reads, posting, onCompose,
  // ★★★未送信へ（★お決め D82・2026-09-19）。★渡されなければ 出しません。
  onGoMisou,
  // ★★できこと（★裁定 その87 Q2）。★門下を 読める 方 ご本人に 断りを 出します。
  perms,
  // ★★★開いた 記録 ── ★学校ぜんぶ（★見本 `P_kaita`・2026-09-19）。
  //   ★★門下を 1つ 開いて いない ときに 出します。
  //   ★★誰が・いつ・どの 門下 だけ です。★何を 読んだかは 残して いません。
  readsAll = []}) {
  const [draft, setDraft] = useState("");
  // ★★どの お知らせを 開いて いるか（★2026-09-19・実機の ご報告）。
  //   ★★一覧には 名と いつ だけ。★本文は 開いた ときだけ 出ます。
  const [openAnnounce, setOpenAnnounce] = useState(null);
  const width = useWindowWidth();
  const twoPane = isTwoPane(width);
  const boxRef = useRef(null);

  const canWrite = mayPost({
    perms,
    isTeacher: isTeacherOf ? isTeacherOf(openStudio) : false,
    isMember: isMemberOf ? isMemberOf(openStudio) : false,
    isAnnouncement: false
  });
  const shown = visibleMessages(messages, new Date().toISOString().slice(0, 10));

  // ★★★入口（★裁定 その120・2026-09-21）。★一覧の **外** に 出します。
  //
  //   ★★★きょうまで、★この 2つは `list` の 中に ありました。
  //     ★★`list` は「お知らせ 0件 かつ 門下 0件」の とき、★丸ごと 出して いません。
  //     ★★★だから、★最初の 1件を 書き始める 口が ありません でした。
  //       ★★画面には「＋ から 書けます」と 出て いて、★その ＋ が ありません。
  //       ★★字と 実物が 食い違って います。★機能が 無いのと 同じ です。
  //   ★★★「0件なら 節ごと 出さない」（★裁定 その73）は **中身** の 話 です。
  //     ★★入口には 広げません。★入口は 残します。
  const 入口 = (
    <div className="space-y-2">
    {/* ★★おしらせを 書く（★見本①）。
        ★★書ける方にだけ 出します。★決めるのは lib/renraku.js です。
          ★★押せるのに 何も 起きないものを 出さない、という 決めです。 */}
    {onCompose && mayPost({ perms, isAnnouncement: true }) ? (
      <button type="button" onClick={onCompose}
        className="w-full"
        style={{
          minHeight: 48, borderRadius: 12, border: `1px solid ${C.line}`,
          background: C.card, color: C.ink, fontSize: "0.90625rem"
        }}>＋ おしらせを 書く</button>
    ) : null}

    {/* ★★★未送信（★見本 `P_misou`・お決め D82・2026-09-19）。
         ★★書ける 方 だけ に 出します（★書けない 方に 下書きは ありません）。
         ★★★渡されなければ 出しません（★押せない 札を 置きません）。 */}
    {onGoMisou && mayPost({ perms, isAnnouncement: true }) ? (
      <button type="button" onClick={onGoMisou}
        className="w-full"
        style={{
          minHeight: 48, marginTop: 6, borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "0.90625rem", textAlign: "left", padding: "0 14px"
        }}>
        {GO_MISOU_LABEL}
        <span style={{ display: "block", fontSize: "0.78125rem", color: C.inkSoft }}>
          {GO_MISOU_SUB}
        </span>
      </button>
    ) : null}
    </div>
  );

  // ★★一覧（★決まりB：★名前と 最終更新だけ。★本文の 抜粋を 出しません）。
  const list = (
    <div className="space-y-2">
      {(announcements || []).length > 0 ? (
        <>
          <p style={small}>{SECTION_ANNOUNCE}</p>
          {/* ★★★一覧に 本文を 出しません（★2026-09-19・実機の ご報告）。
              ★★左の 列に 書いた 字が ずっと 出た ままに なって いました。
              ★★★見本 `P_renraku` は、★左は 名と いつ だけ です。
                ★★本文は 押して 開けた ときに 出ます。
              ★★決めは lib/renraku.js の `announceRow` が 持ちます。 */}
          {announcements.map((a) => {
            const 行 = announceRow(a);
            const 開 = openAnnounce === a.id;
            return (
              <div key={a.id} style={card}>
                <button type="button"
                  onClick={() => setOpenAnnounce(開 ? null : a.id)}
                  style={{
                    display: "flex", width: "100%", alignItems: "center",
                    justifyContent: "space-between", gap: 8, minHeight: 44,
                    background: "transparent", border: "none", padding: 0,
                    textAlign: "left", color: C.ink, fontSize: "0.90625rem"
                  }}>
                  <span>{行.title}</span>
                  <span style={small}>{行.when}　{開 ? "▲" : "›"}</span>
                </button>
                {/* ★★★本文は ここに 出しません（★2026-09-19・実機の ご報告）。
                    ★★左の 一覧は 狭い 列 です（292px）。★本文は 読みにくく なります。
                    ★★★右の 広い 面に 出します。★狭い 画面では 1枚に なります。 */}
              </div>
            );
          })}
          <p style={small}>{ANNOUNCE_OPEN_HINT}</p>
        </>
      ) : null}
      <p style={small}>{SECTION_MONKA}</p>
      {(studios || []).map((s) => {
        const on = openStudio === s.teacherId;
        return (
          <button key={s.teacherId} type="button" onClick={() => onOpenStudio(s.teacherId)}
            className="w-full text-left"
            style={{
              ...card, minHeight: 56, display: "block",
              borderColor: on ? C.curtain : C.line,
              borderWidth: on ? 2 : 1
            }}>
            <div className="flex items-center justify-between gap-2">
              {/* ★★名前と、★最終更新だけ。★本文の 抜粋を 出しません（★決まりB）。 */}
              <span style={{ fontSize: "0.8125rem", color: C.ink }}>
                {studioName(teacherNameOf ? teacherNameOf(s.teacherId) : "")}
              </span>
              <span style={small}>{s.lastAt ? whenWord(s.lastAt) : "まだ ありません"}</span>
            </div>
            <p style={small}>{s.memberCount}人</p>
          </button>
        );
      })}
      <p style={small}>
        {HIDE_LINE}<br />
        書かれたものを、こちらで 読み取って 調べることは しません。
      </p>
    </div>
  );

  // ★★本文（★決まりB：★640px で 止めます）。
  const body = (
    <div style={{ maxWidth: BODY_WIDTH, width: "100%" }} className="space-y-3">
      {/* ★★★2026-09-18、★この 断りを 外しました（★裁定 その88 Q1）。
           ★★2026-09-10 の 見本③ から ある もの でした ──
             ★★「運営の方は、読むだけです。書き込めません。」
             ★★「読める理由は、苦情や 事故が あったときに 確かめるためです。」
             ★★「開いたことは 記録に残り、先生と学生の画面から 見られます。」
           ★★★門が **役割の 名**（owner／admin）の まま でした。
             ★★裁定 その76・その77 で、★門下を 読むのは `monka_read` に なりました。
             ★★だから、★`monka_read` を 持たない 学長・事務長にも 出て いました。
             ★★★「読める」と 書いて ある のに、★実は 読めない 方が いました。
           ★★★同じ ことを、★画面の いちばん 上の 帯 が 言って います
             （★`MONKA_READ_SELF_LINE`・★裁定 その87）。★1つに します。
           ★★台帳 08-1（役割の 名の 門）の 解消が、★1件 進みました。
           ★★中身は `git show fd3688fd:components/Renraku.jsx` で 引けます。 */}

      {shown.length === 0 ? (
        <div style={card}><p style={small}>まだ 書き込みは ありません。</p></div>
      ) : (
        shown.map((m) => <Message key={m.id} m={m} nameOf={nameOf} />)
      )}

      {/* ★★書く欄。★書ける人にだけ 出します。
          ★★下に、★いつも 1行（★§6-1 の 対処①）。 */}
      {canWrite ? (
        <div style={card}>
          <textarea
            ref={boxRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="ここに 書きます"
            style={{
              width: "100%", minHeight: 88, borderRadius: 10, padding: 10,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", lineHeight: 1.85, resize: "vertical"
            }} />
          {/* ★★1文字も 変えないこと。★これが 実際の 守りです。 */}
          <p style={{ ...small, whiteSpace: "pre-line", marginTop: 6 }}>{NOTICE_LINE}</p>
          <button type="button" disabled={posting || !draft.trim()}
            onClick={async () => {
              const ok = await onPost(draft);
              if (ok) setDraft("");
            }}
            className="w-full"
            style={{
              minHeight: 52, marginTop: 8, borderRadius: 12,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
              background: draft.trim() ? C.curtain : C.line, color: "#FFFDF8",
              fontSize: "0.96875rem"
            }}>出す</button>
          <p style={{ ...small, marginTop: 6 }}>
            {NO_ATTACH_LINE}<br />
            {HIDE_LINE}
          </p>
        </div>
      ) : null}

      {/* ★★★開いた 記録 ── ★学校ぜんぶ（★見本 `P_kaita`・2026-09-19）。
          ★★門下を 開いて いない ときに 出します。★表の 形 です。
          ★★★絞りは 決まりが します。★読める 方 だけ に 返って います。
          ★★何を 読んだかは 残して いません。★列ごと ありません。 */}
      {!openStudio && (readsAll || []).length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 4 }}>開いた 記録（学校ぜんぶ）</p>
          {readsAll.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2"
              style={{ padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.75rem" }}>
              <span style={{ color: C.ink }}>
                {nameOf ? nameOf(r.reader_id) : ""}（{r.reader_role}）
              </span>
              <span style={small}>
                {teacherNameOf ? studioName(teacherNameOf(r.teacher_id)) : ""}
                {"　"}{whenWord(r.read_at)}
              </span>
            </div>
          ))}
          <p style={{ ...small, marginTop: 6 }}>
            誰が・いつ・どの門下を、だけです。何を読んだかは 残しません。
          </p>
        </div>
      ) : null}

      {/* ★★開いた記録（★見本③・パソコン③）。
          ★★読んだ側にも、★読まれた側にも 見えます。
            ★片方だけが 見られる 記録は、★見張りに なりません。 */}
      {(reads || []).length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 4 }}>開いた 記録</p>
          {reads.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2"
              style={{ padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.75rem" }}>
              <span style={{ color: C.ink }}>
                {nameOf ? nameOf(r.reader_id) : ""}（{r.reader_role}）が 開きました
              </span>
              <span style={small}>{whenWord(r.read_at)}</span>
            </div>
          ))}
          <p style={{ ...small, marginTop: 6 }}>
            誰が・いつ・どの門下を、だけです。何を読んだかは 残しません。
          </p>
        </div>
      ) : null}
    </div>
  );

  /**
   * ★いちばん 上の 帯（★裁定 その87 Q2・2026-09-18）。
   *
   *   ★★★門下を 読める 役職の 方 ご本人 に だけ 出します。
   *     ★★裁定 その76 で、★生徒側には 知らせる と 決めました。
   *     ★★★読む 側が 気づいて いなければ、★知らせだけ が 届きます。
   *   ★★★閉じられません。★閉じられると 自覚が 消えます（★裁定 その87）。
   *     ★★だから 閉じる 押しどころを 置いて いません。
   *   ★★字は lib/renraku.js が 持ちます。★「監査員」とは 書きません。
   */
  const 上の帯 = showMonkaReadSelfBanner(perms) ? (
    <div style={{
      ...card, background: C.paper, borderColor: C.curtain, marginBottom: 12
    }}>
      <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.85, margin: 0 }}>
        {MONKA_READ_SELF_LINE}
      </p>
      {/* ★★★いまは 開けません（★2026-09-21・STEP_0）。
           ★★上の 1行が 約束して いる「記録に 残ります」が、まだ 本当では
             ★ありません。★本当に なるまで 開けません。
           ★★台帳の 側でも 閉じて います。★ここは お知らせ だけ です。
           ★★決めは lib/renraku.js が 持ちます。★ここで 判じません。 */}
      {!monkaReadOpen() ? (
        <p style={{
          fontSize: "0.8125rem", color: C.ink, lineHeight: 1.85,
          margin: "8px 0 0", fontWeight: 600
        }}>
          {MONKA_READ_PAUSED_LINE}
        </p>
      ) : null}
    </div>
  ) : null;

  /**
   * ★いちばん 下の 断り（★裁定 その87 Q1・2026-09-18）。
   *
   *   ★★★「未読」を 作りません。★端末の 中 だけ でも 作りません。
   *     ★★青い点が ある → ★消す ために 開く → ★消化の 道具に なります。
   *   ★★★作らない こと を、★書いて おきます。
   *     ★★書かないと、★「壊れて いる」と 読まれます。
   */
  /**
   * ★題（★見本の `h2`・★2026-09-18）。
   *
   *   ★★きょうまで、★この 部品に 題が ありません でした。
   *     ★★殻の 帯が「連絡」と 出して いる から です。
   *   ★★★けれど 名簿も 役職も 日程も、★自分の 題を 持って います。
   *     ★★ここだけ 無いのは、★揃って いない だけ です。
   */
  const 題 = (
    <h2 style={{ fontSize: "1.25rem", color: C.ink, margin: "0 0 8px" }}>{SCREEN_HEAD}</h2>
  );

  /**
   * ★何も 無い とき（★見本の `stBlock('空')`）。
   *
   *   ★★★白紙に しません。★何を すると 埋まるかを 1行 書きます。
   *   ★★2行目は、★書ける 方に だけ 出します。
   *     ★★書けない 方に「＋ から 書けます」と 言うと、★探して しまいます。
   */
  const 空っぽ = isEmptyBoard(announcements, studios) ? (
    <div style={{ ...card, textAlign: "center", padding: "26px 15px" }}>
      <p style={{ fontSize: "0.96875rem", color: C.ink, margin: 0 }}>{EMPTY_HEAD}</p>
      {onCompose && mayPost({ perms, isAnnouncement: true }) ? (
        <p style={{ ...small, marginTop: 6 }}>{EMPTY_HOW}</p>
      ) : null}
    </div>
  ) : null;

  // ★★注記の 印（★段3a 段階2・2026-09-20）。★見た目は 変わりません。
  const 読んだ断り = (
    <p className="note" style={{ ...small, marginTop: 10 }}>{NO_READ_TRACKING_LINE}</p>
  );

  // ★★★開いて いる お知らせの 本文（★右の 面・2026-09-19）。
  //   ★★門下の やりとりと 同じ ところに 出します。★狭い 列に 押し込みません。
  const お知らせ本文 = (() => {
    const a = (announcements || []).find((x) => x && x.id === openAnnounce);
    if (!a) return null;
    const 行 = announceRow(a);
    return (
      <div style={{ ...card, maxWidth: BODY_WIDTH }}>
        <p style={{ fontSize: "1.125rem", fontWeight: 700, color: C.ink, margin: 0 }}>
          {行.title}
        </p>
        <p style={small}>{行.when}</p>
        <p style={{ fontSize: "0.96875rem", color: C.ink, lineHeight: 1.95,
          marginTop: 10, whiteSpace: "pre-wrap" }}>{a.body}</p>
        <p style={{ ...small, marginTop: 12 }}>{ANNOUNCE_READ_LINE}</p>
      </div>
    );
  })();

  if (twoPane) {
    // ★★決まりB：★2ペイン。★左に 一覧、★右に 本文。
    return (
      <div>
      {題}
      {上の帯}
      {/* ★★★入口は いつも 出します（★裁定 その120・2026-09-21）。
           ★★空でも 出します。★最初の 1件は、★空の ときに 書く もの です。 */}
      {入口}
      {空っぽ}
      {空っぽ ? null : (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: `0 0 ${LIST_WIDTH}px`, minWidth: 0 }}>{list}</div>
        {/* ★★★右の 面 ── ★お知らせを 開いて いれば そちら、★なければ 門下。 */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "flex-start" }}>
          {お知らせ本文 || body}
        </div>
      </div>
      )}
      {読んだ断り}
      </div>
    );
  }
  // ★狭い画面：★門下を 開いていなければ 一覧、★開いていれば 本文。
  //   ★★帯は どちらの 姿でも 出します。★狭い ときに 消えると、
  //     ★★iPhone で 見て いる 方 だけ が 自覚を 失います。
  // ★★狭い 画面で お知らせを 開いた とき（★2026-09-19）。
  if (!openStudio && openAnnounce && お知らせ本文) {
    return (
      <div className="space-y-3">
        {上の帯}
        <button type="button" onClick={() => setOpenAnnounce(null)}
          style={{
            minHeight: 44, border: "none", background: "transparent",
            color: C.curtain, fontSize: "0.90625rem", padding: 0
          }}>‹ もどる</button>
        {お知らせ本文}
        {読んだ断り}
      </div>
    );
  }

  return openStudio ? (
    <div className="space-y-3">
      {上の帯}
      <button type="button" onClick={() => onOpenStudio(null)}
        style={{
          minHeight: 44, border: "none", background: "transparent",
          color: C.curtain, fontSize: "0.90625rem", padding: 0
        }}>‹ もどる</button>
      {body}
      {読んだ断り}
    </div>
  ) : (
    <div>
      {題}
      {上の帯}
      {/* ★★★入口は いつも 出します（★裁定 その120・2026-09-21）。 */}
      {入口}
      {空っぽ || list}
      {読んだ断り}
    </div>
  );
}
