"use client";

import { C } from "@/lib/tokens";
import {
  homeSections, EMPTY_LINE,
  // ★★★2026-09-19（★見本くらべ D1・D2）。
  //   ★★節 6つの うち 2つ しか 描いて いません でした。
  //   ★★数の 札は いつも 4枚で、★押せません でした。
  homeStats, SECTION_HEADS, NOTHING_YET, OPENED_LOG_LABEL, HOME_NOTES,
  // ★★裁定 その79 Q2 の 逃げ道。★書いて ありましたが、★呼ばれて いません でした。
  attendanceOrphan
} from "@/lib/opsHomeSections";
import { whenWord } from "@/lib/renraku";
import { METHOD_LABELS, NOT_SET_YET } from "@/lib/orgBilling";
// ★★つけ終わって いるかを、★行の 右に 出します（★2026-09-18）。
import { attendanceLabel, timeOf } from "@/lib/todayBand";
import { overlapsOf, dateOf } from "@/lib/opsSchedule";
import { rosterCount, countsByStatus } from "@/lib/orgRoster";
import { buildEvents, EVENT_STATES } from "@/lib/orgEventsView";

// ============================================================================
// 運営ホーム ── 見本①（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ①
//     「★重なりは 印をつけるだけです。★こちらで 勝手に 動かしません。」
//
//   ★★数えるだけの 画面です。★良し悪しを 言いません。
//   ★★％も 連続日数も 出しません。
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★数は lib（opsSchedule／orgRoster／orgEventsView）が 持ちます。
//     ★★ここで 数え直しません。★名簿の 人数を、★2通りに 数えないためです。
//
//   ★見張り components/tests/ops-home.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
// ★★★12より 小さい 字を 使いません（★裁定 その103・2026-09-19）。
//   ★★11 → 12.5。★役は どれも「添える 字」です。
//   ★★行の 字（13）と 数（24）・題（20）は そのまま です。
//   ★★★上下の 向きは 変わりません ── ★24 ＞ 20 ＞ 13 ＞ 12.5。
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };

/**
 * ★数の 札。
 *
 *   ★★★押すと その 一覧へ 行きます（★見本の note そのまま・2026-09-19）。
 *     ★★行き先が 無い とき（★その 帯が 開いて いない とき）は 押せません。
 *     ★★★押しても 何も 起きない 札を 置きません（★§8⑤）。
 */
function Stat({ label, value, unit, onGo }) {
  const 中 = (
    <>
      <p style={small}>{label}</p>
      <p style={{ color: C.ink, marginTop: 2 }}>
        <span className="ff-display" style={{ fontSize: "1.5rem" }}>{value}</span>
        <span style={{ fontSize: "0.78125rem", marginLeft: 2 }}>{unit}</span>
        {onGo ? <span style={{ ...small, marginLeft: 4 }}>›</span> : null}
      </p>
    </>
  );
  if (!onGo) return <div style={{ ...card, flex: 1, minWidth: 0 }}>{中}</div>;
  return (
    <button type="button" onClick={onGo}
      style={{
        ...card, flex: 1, minWidth: 0, minHeight: 44,
        textAlign: "left", cursor: "pointer", font: "inherit"
      }}>{中}</button>
  );
}

/**
 * ★節の 器。★題と 中身。★中身が 無ければ、★呼ぶ 側が 出しません。
 *
 *   ★★★題は `<h3>` に しました（★2026-09-20・坂本さんの お決め D109）。
 *     ★★きょうまで `<p>` でした。★見た目は 題 ですが、★印が ありません。
 *     ★★★読み上げの 道具が、★題として 拾えません でした。
 *     ★★★機械で くらべる ときも、★題に 見えず「見本にだけ ある」に なりました。
 *   ★★見た目は 変えません ── ★大きさも 太さも `small` の ままです。
 */
function Section({ head, children }) {
  return (
    <div style={card}>
      <h3 style={{ ...small, marginBottom: 6, fontWeight: "inherit" }}>{head}</h3>
      {children}
    </div>
  );
}

/** ★節の 中の 1行。★押せる ときは 押せます。 */
function Row({ left, right, onGo }) {
  const 形 = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 8, width: "100%", textAlign: "left",
    padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem"
  };
  const 中 = (
    <>
      <span style={{ color: C.ink }}>{left}</span>
      <span style={{ color: C.inkSoft, fontSize: "0.78125rem" }}>
        {right}{onGo ? "　›" : ""}
      </span>
    </>
  );
  if (!onGo) return <div style={形}>{中}</div>;
  return (
    <button type="button" onClick={onGo}
      style={{ ...形, minHeight: 44, background: "transparent", border: "none" }}>{中}</button>
  );
}

export default function OpsHome({
  todayISO, lessons, members, events, participants, targetOf,
  teacherCount, nameOf, studentNameOf, onSeeSchedule, onOpenAttendance, perms,
  // ★★★2026-09-19（★見本くらべ D1・D2 の お決め）。
  //   ★`userId` …… ★「きょうの レッスン」は **ご自分の コマ** だけ です
  //   ★`monkaStudios` …… ★[{teacherId, memberCount, lastAt}]（★ご自分の 門下）
  //   ★`announcements` …… ★学校からの お知らせ（★中身は 出しません）
  //   ★`openedLogCount` …… ★門下を 開いた 記録の 数（★誰が 見たかは 出しません）
  //   ★`billing` …… ★`org_billing` の いちばん 新しい 1行
  //   ★`onGoTab` …… ★数の 札と 節から、★その 帯へ
  userId, monkaStudios, announcements, openedLogCount, billing, onGoTab
}) {
  // ★★★節ごとに、★できことで 出す／出さない（★裁定 その79・2026-09-18）。
  //   ★★見本は 役職で 3つの 画面に 分けて います（P_home / P_homeS / P_homeT）。
  //   ★★★1つの 画面の まま に します。
  //     ★★「学長・副学長」「事務」「先生」は **役職の 名** で 束ねた もの です。
  //     ★★役職は 学校が 自由に 作れます（★裁定 その75）。
  //       ★★「特任教授」を 作った 日に、★どの 画面を 出すか 決められません。
  //   ★★決めは lib/opsHomeSections.js が 持ちます。★ここでは 決めません。
  const 出す = (key) => homeSections(perms).some((x) => x.key === key);
  const 節の数 = homeSections(perms).length;
  const today = (lessons || []).filter((l) => dateOf(l) === todayISO)
    .sort((a, b) => (String(a.scheduled_at) < String(b.scheduled_at) ? -1 : 1));
  const overlaps = overlapsOf(lessons, todayISO);
  const by = countsByStatus(members);
  // ★★★ご自分の コマ（★見本 `P_homeT` の「きょうの レッスン」）。
  //   ★★「きょうの ながれ」は 学校ぜんぶ です。★こちらは ご自分の 分 だけ。
  const myToday = today.filter((l) => userId && l.teacher_id === userId);
  // ★★ご自分の 門下の 方の 数。★`monkaStudios` は ご自分の 分 だけ 来ます。
  const 門下の人数 = (monkaStudios || [])
    .reduce((n, x) => n + (Number(x.memberCount) || 0), 0);
  const upcoming = buildEvents(events, participants, targetOf)
    .filter((x) => String(x.ev.event_date) >= todayISO && x.state !== EVENT_STATES.WITHDRAWN)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>ホーム</h2>
      <p style={small}>{todayISO}</p>

      {/* ★★★1つも 出ない 役職が あり得ます（★裁定 その79 の note）。
          ★★いま ひな型 10役職 の どれも 1つ以上 出ます（★数えました）。
            ★★いちばん 少ないのは 職員の 1つ（きょうの ながれ）です。
          ★★★けれど 学校は 役職を 自由に 作れます。
            ★★できことを 1つも 付けない 役職も 作れます。
          ★★空の 画面を 出しません。★白い 紙は「壊れた」と 読まれます。
            ★★何が できる かを 1行 書きます。★何が できないかでは ありません。 */}
      {節の数 === 0 ? <p style={small}>{EMPTY_LINE}</p> : null}

      {/* ★★★数の 札（★2026-09-19・★見本くらべ D1・D2）。
          ★★枚数が 役職で 変わります ── ★見本は 学長 4／先生 3／職員 2。
            ★★きょうまで いつも 4枚 でした。
            ★★★「名簿の 人数」を、★名簿の できことを 見ずに 出して いました。
          ★★押すと その 一覧へ 行きます。★行き先が 無ければ 押せません。
          ★★決めは lib/opsHomeSections.js が 持ちます。★ここでは 決めません。 */}
      {(() => {
        const 数 = {
          lessonToday: today.length,
          roster: rosterCount(members),
          // ★★門下の 人数 ── ★ご自分の 門下の 方の 数（★`monkaStudios` の 中）。
          //   ★★読めなかった ときは 0 では ありません。★札ごと 出しません。
          monka: 門下の人数,
          teachers: teacherCount || 0,
          overlap: overlaps.length
        };
        const 札 = homeStats(perms);
        const 対 = [];
        for (let i = 0; i < 札.length; i += 2) 対.push(札.slice(i, i + 2));
        return 対.map((組, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            {組.map((x) => (
              <Stat key={x.key} label={x.label} unit={x.unit} value={数[x.key]}
                onGo={x.tappable && onGoTab ? () => onGoTab(x.tab) : null} />
            ))}
          </div>
        ));
      })()}
      {/* ★★2026-09-13、★ようすは active／left の 2つ だけ。
          ★★休会・返事まちは 台帳に ありません。★出しません。 */}
      {by.left > 0 ? (
        <p style={small}>{`退会 ${by.left}人`}</p>
      ) : null}

      {/* ★★きょうの ながれ。★該当が なければ 出しません。
          ★「今日の予定はありません」と 書かないこと。 */}
      {/* ★★★逃げ道（★裁定 その79 Q2・★2026-09-19 に 繋ぎました）。
          ★★出欠を 持つ のに、★日程の できことを 1つも 持たない 方 ──
            ★★入口は 2つ とも 日程の できことで 開きます。
            ★★★どちらにも 行けません。★出欠を 持って いる のに、です。
          ★★その ときは「きょうの ながれ」を 出します。★入口①に なります。
          ★★判じは lib が 持ちます。★ここで もう一度 決めません。 */}
      {(出す("nagare") || attendanceOrphan(perms)) && today.length > 0 ? (
        <div style={card}>
          <h3 style={{ ...small, marginBottom: 6, fontWeight: "inherit" }}>きょうの ながれ</h3>
          {today.map((l) => {
            const dup = overlaps.some((o) => o.lessons.some((x) => x.id === l.id));
            // ★★★出欠の 入口 ①（★裁定 その79・2026-09-18）。
            //   ★★「ホーム → きょうの ながれ → その 行」。
            //   ★★★きょうまで、★この 行は 押せません でした。
            //     ★★裁定 その79 は 帯を 作らない と 決めて います。
            //     ★★入口は 2つ しか ありません。★どちらも 塞がって いました。
            //   ★★★開く 先が 無い ときは、★押せる ように しません（★§8⑤）。
            //     ★★`onOpenAttendance` が 渡されて はじめて 押せます。
            const 中身 = (
              <>
                <span style={{ color: C.ink }}>
                  {/* ★★★端末の 時計で 読みます（★2026-09-18・実機で 見つけました）。
                      ★★`slice(11,16)` は、★台帳の 字を そのまま 切って いました。
                      ★★台帳は UTC です。★15:00 の レッスンが「06:00」と 出ます。
                      ★★★9時間 ずれて いました。★イタリアに いらっしゃる ときも、
                        ★★その場の 時刻で 読みます（★`lib/todayBand.js` の `timeOf`）。 */}
                  {timeOf(l.scheduled_at) || ""}　
                  {nameOf ? nameOf(l.teacher_id) : ""}
                </span>
                <span style={{ color: C.inkSoft, fontSize: "0.78125rem" }}>
                  {/* ★★つけ終わって いるかを、★ここで お見せします。
                      ★★★開く 前に 分かります。★開いて から 知る、では ありません。 */}
                  {dup ? "★重なり" : (l.attendance
                    ? `済 ${attendanceLabel(l.attendance) || ""}`
                    : (studentNameOf ? studentNameOf(l.student_id) : ""))}
                  {onOpenAttendance ? "　›" : ""}
                </span>
              </>
            );
            const 並び = {
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 8, width: "100%", textAlign: "left",
              padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem"
            };
            return onOpenAttendance ? (
              <button key={l.id} type="button" onClick={() => onOpenAttendance(l)}
                style={{ ...並び, minHeight: 44, background: "transparent", border: "none" }}>
                {中身}
              </button>
            ) : (
              <div key={l.id} style={並び}>{中身}</div>
            );
          })}
        </div>
      ) : null}

      {/* ★★重なり。★印を つけるだけです。★勝手に 動かしません（★見本①）。 */}
      {overlaps.length > 0 ? (
        <div style={{ ...card, background: C.paper }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink }}>★重なり {overlaps.length}件</p>
          <p style={small}>重なりは印をつけるだけです。こちらで勝手に動かしません。</p>
          {onSeeSchedule ? (
            <button type="button" onClick={onSeeSchedule}
              className="w-full"
              style={{
                minHeight: 44, marginTop: 8, borderRadius: 10,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                fontSize: "0.8125rem"
              }}>日程で 見る</button>
          ) : null}
        </div>
      ) : null}

      {/* ★★★きょうの レッスン（★見本 `P_homeT`・2026-09-19）。
          ★★上の「きょうの ながれ」は 学校ぜんぶ です。★こちらは ご自分の 分 だけ。
          ★★★`sched_mine` を 持ち、★`sched_all` を 持たない 方には、
            ★★そもそも ながれに ご自分の コマ しか 来ません。
            ★★けれど 両方 持つ 方には、★2つは ちがう ものに なります。
          ★★無ければ 出しません。★「ありません」と 書きません。 */}
      {出す("lesson") && myToday.length > 0 ? (
        <Section head={SECTION_HEADS.lesson}>
          {myToday.map((l) => (
            <Row key={l.id}
              left={`${timeOf(l.scheduled_at) || ""}　${
                studentNameOf ? studentNameOf(l.student_id) : ""}`}
              right={l.attendance ? `済 ${attendanceLabel(l.attendance) || ""}` : "まだ"}
              onGo={onOpenAttendance ? () => onOpenAttendance(l) : null} />
          ))}
        </Section>
      ) : null}

      {/* ★★★門下の 連絡（★見本 `P_homeT`・2026-09-19）。
          ★★★中身（本文）を 出しません。★いつ 動いたか だけ です。
            ★★連絡の 決め ──「本文の 抜粋を 一覧に 出しません」（★裁定 その87）。
            ★★ホームでも 同じに します。★場所が 変わると 約束が 変わる、では 困ります。 */}
      {出す("monka") && (monkaStudios || []).length > 0 ? (
        <Section head={SECTION_HEADS.monka}>
          {(monkaStudios || []).map((x) => (
            <Row key={x.teacherId}
              left={`${nameOf ? nameOf(x.teacherId) : ""} の 門下`}
              right={x.lastAt ? whenWord(x.lastAt) : NOTHING_YET.monka}
              onGo={onGoTab ? () => onGoTab("threads") : null} />
          ))}
        </Section>
      ) : null}

      {/* ★★★お知らせ（★見本 `P_home`・2026-09-19）。
          ★★ここでも 本文を 出しません。★いつ・何件 だけ です。
          ★★★開いた 記録は 数 だけ です（★裁定 その76）。
            ★★誰が 見たかを ホームに 出しません。★報復を 避ける ため です。 */}
      {出す("oshirase")
        && ((announcements || []).length > 0 || Number(openedLogCount) > 0) ? (
        <Section head={SECTION_HEADS.oshirase}>
          {(announcements || []).slice(0, 2).map((a) => (
            <Row key={a.id} left="学校からの お知らせ"
              right={whenWord(a.created_at)}
              onGo={onGoTab ? () => onGoTab("threads") : null} />
          ))}
          {Number(openedLogCount) > 0 ? (
            <Row left={OPENED_LOG_LABEL} right={`${Number(openedLogCount)}件`}
              onGo={onGoTab ? () => onGoTab("threads") : null} />
          ) : null}
        </Section>
      ) : null}

      {/* ★★★ご請求の 要約（★裁定 その74 の 表の うち 1行 だけ・2026-09-19）。
          ★★金額を 出しません。★売上の 予測も 出しません（★下の 但し書き）。
          ★★決めは lib/orgBilling.js が 持ちます。★ここで 言い換えません。 */}
      {出す("bill") ? (
        <Section head={SECTION_HEADS.bill}>
          <Row left="お支払いの 方法"
            right={billing && billing.method
              ? (METHOD_LABELS[billing.method] || billing.method)
              : NOT_SET_YET}
            onGo={onGoTab ? () => onGoTab("settings") : null} />
          {billing && billing.atesaki_name ? (
            <Row left="宛先" right={billing.atesaki_name}
              onGo={onGoTab ? () => onGoTab("settings") : null} />
          ) : null}
        </Section>
      ) : null}

      {/* ★★近い 行事。★無ければ 出しません。★できことが 無ければ 出しません。 */}
      {出す("gyoji") && upcoming.length > 0 ? (
        <div style={card}>
          <h3 style={{ ...small, marginBottom: 6, fontWeight: "inherit" }}>近い 行事</h3>
          {upcoming.map((x) => (
            <div key={x.ev.id} className="flex items-center justify-between gap-2"
              style={{ padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
              <span style={{ color: C.ink }}>
                {Number(String(x.ev.event_date).slice(5, 7))}/{Number(String(x.ev.event_date).slice(8, 10))}　
                {x.ev.title || ""}
              </span>
              <span style={{ color: C.inkSoft, fontSize: "0.78125rem" }}>
                {x.countWord ? `出ます ${x.countWord}` : x.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ★★★但し書き（★見本 `P_home` の note・2026-09-19）。
          ★★きょうまで、★註（コメント）には 書いて ありました。
            ★★画面の 字に なって いません でした。
          ★★★見て いる 方に 伝わらない 約束は、★約束では ありません。 */}
      <div>
        {/* ★★★注記に `note` の 印を 付けます（★段3a 段階2・2026-09-20）。
             ★★注記は 約束 その もの です。★機械でも 拾える ように します。
             ★★見た目は 変わりません（★この 名に 形は 付けて いません）。 */}
        {HOME_NOTES.map((t) => (
          <p key={t} className="note" style={{ ...small, margin: 0 }}>{t}</p>
        ))}
      </div>
    </div>
  );
}
