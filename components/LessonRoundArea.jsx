"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { DAYS, periodsOf } from "@/lib/myTimetable";
import { featureOn } from "@/lib/featureOn";
import {
  LESSON_ROUND_KEY, COLS_ROUND, COLS_PREF, COLS_NG, COLS_TIMETABLE,
  slotKey, canEdit, canConfirm, firstDateFor, slotOfLesson, placeableSlots,
  HUB_WARN, HUB_WARN_DONE, HUB_NOW_HEAD, HUB_START, HUB_START_SUB,
  HUB_ANSWERED, HUB_NOT_YET, HUB_PLACED, HUB_DUE,
  HUB_STEPS_HEAD, HUB_STEPS, HUB_STEP_DONE, HUB_NOTES, hubCounts
} from "@/lib/lessonRound";
import LessonPrefs from "./LessonPrefs";
import LessonPrefMap from "./LessonPrefMap";
import LessonRoundDone from "./LessonRoundDone";
// ★★★置ける 枠は `OpsOkeru`（★前から ある 画面）を 使います（★2026-09-24）。
//   ★★私は 同じ 見本（`P_okeru`）の 画面を **2つ 作って** いました。
//     ★`components/LessonPlaceSlots.jsx` を 消し、★こちらに 揃えました。
//   ★★どの 枠を 出すかの 決めは `lib/lessonRound.js` の `placeableSlots()` が 持ちます。
import OpsOkeru from "./OpsOkeru";
// ★★★回が 1つも 無い ときの 画面（★裁定185・2026-09-24）。
//   ★★これが 無いと、★先生は **回を 始められません**。
//     ★★2026-09-23 は「回が 無ければ 何も 出さない」で 止めて いました。
//       ★見た目は きれい ですが、★そこから 先へ 進めません。
import RoundStart from "./RoundStart";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★レッスン割の 4画面を 1つに まとめる ところ
//
//   ★出どころ 裁定139（レッスン割）／ 裁定176（作り終えて 隠して 置く）
//
//   ★★★2026-09-23 まで、★この 4画面は **どこからも 呼ばれて いません** でした。
//     ★作って あって、★見張りも 通って いて、★誰も たどり着けない ── という 形 です。
//     ★★「作った」と「届く」は 別 です。★ここが その 間を つなぎます。
//
//   ★★★出すか 出さないかは `featureOn(features, LESSON_ROUND_KEY)` **だけ** で 決めます。
//     ★裁定176 §1 …「判定は 1か所: feature_on(鍵)」
//     ★★★閉じて いる とき、★**入口ごと 出しません**（★裁定176 §3）──
//       ★「近日公開」も 出しません。★押せない 入口も 置きません。
//       ★★期待を 作らない、が 決め です。
//     ★★読み込み中も false です（★`featureOn` の 決め）。
//       ★一瞬 見えて 消えるのは、★見えたのと 同じ です。
//
//   ★★★決めは 1つも ここで 作りません ──
//     ★誰が 見て よいか …… ★台帳の RLS（`lesson_rounds_select` ほか）
//     ★何を 出すか   …… `lib/lessonRound.js`
//     ★列の 名前     …… `COLS_*`（★`select('*')` を 書かない）
//
//   ★見張り components/tests/lesson-round-area.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

/** ★いまの 立場で 見る 画面（★先生・事務）。 */
const 入口 = "hub";
const 地図 = "map";
const 確定 = "done";
const 置く = "place";

export default function LessonRoundArea({ supabase, userId, role, features }) {
  // ★★★鍵が 開いて いるか。★hooks より 先に 返さない ように、★値だけ 先に 出します。
  const 開 = featureOn(features, LESSON_ROUND_KEY);

  const [round, setRound] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [ngDates, setNgDates] = useState([]);
  const [counts, setCounts] = useState({});
  const [allPrefs, setAllPrefs] = useState([]);
  const [names, setNames] = useState({});
  const [monka, setMonka] = useState([]);
  const [placed, setPlaced] = useState({});
  const [placedBy, setPlacedBy] = useState({});
  const [view, setView] = useState(入口);
  const [who, setWho] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  // ★★★回を 始める ための もの（★回が 1つも 無い ときだけ 使います）。
  // ★★★どの 学校の 回か（★裁定140・design-v42・2026-09-24）。
  //   ★★「はじめの 1つ」を こちらで 選びません。★`my_orgs()` が 名前の 順で 返します。
  //   ★★1校 だけの 方には 札も 註も 出ません（★裁定73・`RoundStart` の 中で 判じます）。
  const [myOrgs, setMyOrgs] = useState([]);
  const [orgTeachers, setOrgTeachers] = useState([]);
  const [pickedOrg, setPickedOrg] = useState(null);

  const 教 = role === "teach";

  // ---- 読む --------------------------------------------------------------
  useEffect(() => {
    if (!開 || !supabase || !userId) return;
    let 生きている = true;
    (async () => {
      try {
        // ★★どの 回が 自分に 関わるかは、★台帳の RLS が 決めます。
        //   ★★ここで 誰の ものかを 絞りません。★絞ると 2か所で 決める ことに なります。
        const { data: rs, error: e1 } = await supabase
          .from("lesson_rounds").select(COLS_ROUND)
          .eq("status", "open").order("due_on", { ascending: true }).limit(1);
        if (e1) throw e1;
        const r = (rs || [])[0] || null;
        if (!生きている) return;
        setRound(r);

        // ★★★回が 1つも 無い とき ── ★先生なら「始める」ところを 出します。
        //   ★★学校が 分からないと 始められません。★在籍から 引きます。
        //   ★★先生の 一覧は `get_org_member_names`（★学校の 方 だけ が 引けます）。
        //     ★★学生の 行は 外します。★学生の 回は ありません。
        if (!r) {
          if (!教) return;
          // ★★★どの 学校に いるかは 台帳が 返します（`my_orgs()`・sql/71）。
          //   ★★`limit 1` を 書きません。★2校 で 教えて いる 先生が います。
          //   ★★学生と して いる 学校は 外します ── ★学生の 回は ありません。
          const { data: os } = await supabase.rpc("my_orgs");
          const 校 = (os || []).filter((o) => o && o.is_student !== true);
          if (!生きている) return;
          setMyOrgs(校);
          const 選 = 校.find((o) => o.org_id === pickedOrg) || 校[0] || null;
          if (選) {
            const { data: nm } = await supabase.rpc("get_org_member_names",
              { p_org_id: 選.org_id });
            if (!生きている) return;
            // ★★自分は 必ず 入れます。★先生は 自分の 回を 始められます。
            const 先 = (nm || []).filter((x) => x && x.role !== "student")
              .map((x) => ({ id: x.user_id, name: x.display_name || tx("お名前が まだ です") }));
            setOrgTeachers(先.length > 0 ? 先
              : [{ id: userId, name: tx("自分") }]);
          }
          return;
        }

        // ★★コマ ── ★学生は 自分の もの、★先生・事務は 学校の もの。
        const { data: ps } = 教
          ? await supabase.from("org_periods")
              .select("id, ord, name, start_min, end_min").eq("org_id", r.org_id).order("ord")
          : await supabase.from("my_periods")
              .select("id, ord, name, start_min, end_min").eq("user_id", userId).order("ord");
        if (!生きている) return;
        setPeriods(periodsOf(ps || []));

        if (!教) {
          const [{ data: tt }, { data: pf }, { data: ng }] = await Promise.all([
            supabase.from("my_timetable").select(COLS_TIMETABLE).eq("user_id", userId),
            supabase.from("lesson_prefs").select(COLS_PREF).eq("round_id", r.id).eq("user_id", userId),
            supabase.from("lesson_ng_dates").select(COLS_NG).eq("round_id", r.id).eq("user_id", userId)
          ]);
          if (!生きている) return;
          setTimetable(tt || []);
          const m = {};
          (pf || []).forEach((x) => { m[x.slot_key] = x.level; });
          setPrefs(m);
          setNgDates((ng || []).map((x) => x.ng_on).sort());
          return;
        }

        // ★★先生・事務 ── ★濃さは 台帳が 数えます（`pref_map`）。
        const { data: cm } = await supabase.rpc("pref_map", { p_round_id: r.id });
        if (!生きている) return;
        const c = {};
        (cm || []).forEach((x) => { c[x.slot_key] = { maru: x.maru, sankaku: x.sankaku }; });
        setCounts(c);

        // ★★★名前は **押されてから** 出します。★行そのものは 先に 読みますが、
        //   ★`namesOf` を 通さない かぎり どこにも 出ません（★`LessonPrefMap` の 決め）。
        const { data: ap } = await supabase
          .from("lesson_prefs").select(COLS_PREF).eq("round_id", r.id);
        if (!生きている) return;
        setAllPrefs(ap || []);

        // ★★門下（★担当の 学生）── ★終わって いない ものだけ。
        const { data: asg } = await supabase
          .from("assignments").select("student_id, ended_at")
          .eq("org_id", r.org_id).eq("teacher_id", userId).is("ended_at", null);
        if (!生きている) return;
        const ids = Array.from(new Set((asg || []).map((x) => x.student_id).filter(Boolean)));
        setMonka(ids);

        // ★★★名前は `profiles` を 直に 引けません。
        //   ★★`profiles` の 読みの 決めは 1つ だけ です ── `auth.uid() = id`。
        //     ★★★先生が 学生の 行を 引くと、★**0行** が 返ります。
        //       ★誤りには なりません。★名前が 空に なる だけ です ──
        //       ★★だから 見た目では 気づけません（★試しの 台帳で 数えて 見つけました）。
        //   ★★`get_connected_names` が「誰の 名前を 見て よいか」を 持って います。
        //     ★つながって いない 人を 渡すと、★その 行は 返って きません。
        //     ★★ここで 誰と つながって いるかを 決めません。★台帳が 決めます。
        if (ids.length > 0) {
          const { data: pr } = await supabase.rpc("get_connected_names", { p_ids: ids });
          if (!生きている) return;
          const nm = {};
          (pr || []).forEach((x) => { nm[x.id] = x.display_name || tx("お名前が まだ です"); });
          setNames(nm);
        }

        // ★★もう 置いた もの（★この 回の 期間の レッスン）。
        const { data: ls } = await supabase
          .from("lessons").select("id, student_id, scheduled_at, place_id")
          .eq("org_id", r.org_id).eq("teacher_id", userId)
          .gte("scheduled_at", r.period_from).lte("scheduled_at", r.period_to + "T23:59:59");
        if (!生きている) return;
        // ★★★`lessons` に 枠の 鍵は ありません（`place_id` は **部屋** です）。
        //   ★★置いた 時こく から 枠を 読み戻します（`slotOfLesson`）。
        const 置 = {}, 人 = {};
        (ls || []).forEach((x) => {
          const k = slotOfLesson(x.scheduled_at, periodsOf(ps || []));
          if (k) 置[k] = true;
          if (x.student_id) 人[x.student_id] = k || true;
        });
        setPlaced(置);
        setPlacedBy(人);
      } catch (e) {
        if (生きている) setError(String((e && e.message) || e));
      }
    })();
    return () => { 生きている = false; };
  }, [開, supabase, userId, 教, pickedOrg]);

  // ---- 学生の 操作 -------------------------------------------------------
  const onTap = useCallback((k, next) => {
    setSent(false);
    setPrefs((p) => {
      const m = { ...p };
      if (next === null || next === undefined) delete m[k]; else m[k] = next;
      return m;
    });
  }, []);

  const onSend = useCallback(async () => {
    if (!round || !supabase) return;
    setBusy(true); setError("");
    try {
      const 行 = Object.keys(prefs).map((k) => ({
        round_id: round.id, user_id: userId, slot_key: k, level: prefs[k]
      }));
      // ★★消した ものは 消します（★隠して 済ませない・CLAUDE.md）。
      const { error: e1 } = await supabase.from("lesson_prefs")
        .delete().eq("round_id", round.id).eq("user_id", userId);
      if (e1) throw e1;
      if (行.length > 0) {
        const { error: e2 } = await supabase.from("lesson_prefs").insert(行);
        if (e2) throw e2;
      }
      setSent(true);
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally { setBusy(false); }
  }, [round, supabase, prefs, userId]);

  const onAddNg = useCallback(async () => {
    if (!round || !supabase) return;
    const v = typeof window !== "undefined"
      ? window.prompt(tx("来られない 日（2026-10-01 の 形）")) : null;
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("lesson_ng_dates")
        .insert({ round_id: round.id, user_id: userId, ng_on: v });
      if (e) throw e;
      setNgDates((a) => Array.from(new Set([...a, v])).sort());
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [round, supabase, userId]);

  const onRemoveNg = useCallback(async (v) => {
    if (!round || !supabase) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("lesson_ng_dates")
        .delete().eq("round_id", round.id).eq("user_id", userId).eq("ng_on", v);
      if (e) throw e;
      setNgDates((a) => a.filter((x) => x !== v));
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [round, supabase, userId]);

  // ---- 先生の 操作 -------------------------------------------------------
  // ★★★押された コマの 名前だけ を 組み立てます。★押されるまで 呼ばれません。
  const namesOf = useCallback((k) => allPrefs
    .filter((x) => x.slot_key === k && (x.level === 2 || x.level === 1))
    .map((x) => ({ id: x.user_id, name: names[x.user_id] || tx("お名前が まだ です"),
      mark: x.level === 2 ? "◎" : "△" })), [allPrefs, names]);

  const notPlaced = useMemo(() => monka
    .filter((id) => !placedBy[id])
    .map((id) => ({ id, name: names[id] || tx("お名前が まだ です") })), [monka, placedBy, names]);

  const whoPrefs = useMemo(() => {
    const m = {};
    allPrefs.forEach((x) => { if (x.user_id === who) m[x.slot_key] = x.level; });
    return m;
  }, [allPrefs, who]);

  const onPlaceStudent = useCallback((id) => { setWho(id); setView(置く); }, []);

  const doPlace = useCallback(async (k) => {
    if (!round || !supabase || !who) return;
    setBusy(true); setError("");
    try {
      // ★★★どの 日に するかは `lib/lessonRound.js` が 決めます。
      //   ★ここでは 決めません。★決めが 変わる ときは lib だけ 直します。
      const 日 = firstDateFor(k, round, periods);
      if (!日) throw new Error(tx("その 枠に あたる 日が、この 回の 中に ありません。"));
      const { error: e } = await supabase.from("lessons").insert({
        org_id: round.org_id, teacher_id: userId, student_id: who,
        created_by: userId, scheduled_at: 日
      });
      if (e) throw e;
      setPlaced((p) => ({ ...p, [k]: true }));
      setPlacedBy((p) => ({ ...p, [who]: k }));
      setWho(null); setView(確定);
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [round, supabase, who, userId, periods]);

  const onConfirm = useCallback(async () => {
    if (!round || !supabase) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("lesson_rounds")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", round.id);
      if (e) throw e;
      setRound((r) => ({ ...r, status: "confirmed" }));
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [round, supabase]);

  // ---- 出す --------------------------------------------------------------
  // ★★★閉じて いる ときは、★何も 出しません（★入口も 出しません）。
  if (!開) return null;

  const 枠 = {
    borderTop: `1px solid ${C.line}`, marginTop: rem(16), paddingTop: rem(16)
  };

  // ★★★回が 1つも 無い とき（★2026-09-24 に 直しました）。
  //   ★★前は ここで `return null` で した。★見た目は きれい ですが、
  //     ★★先生は **始める ところに たどり着けません** でした。
  //   ★★学生には 出しません ── ★始めるのは 先生か 事務 です（★裁定185）。
  if (!round) {
    if (!教 || myOrgs.length === 0) return null;
    return (
      <div style={枠}>
        <RoundStart
          supabase={supabase} orgs={myOrgs}
          teachers={orgTeachers} today={new Date().toISOString().slice(0, 10)}
          monkaCount={monka.length}
          onPickOrg={setPickedOrg}
          onStarted={() => { setRound(null); setMyOrgs([]); }} />
      </div>
    );
  }

  if (!教) {
    return (
      <div style={枠}>
        <LessonPrefs
          round={round} periods={periods} timetable={timetable}
          prefs={prefs} ngDates={ngDates}
          onTap={onTap} onAddNg={onAddNg} onRemoveNg={onRemoveNg} onSend={onSend}
          busy={busy} error={error} sent={sent} />
      </div>
    );
  }

  return (
    <div style={枠}>
      {view === 置く && who ? (
        <OpsOkeru
          studentName={names[who] || tx("お名前が まだ です")}
          slots={placeableSlots({
            prefs: whoPrefs, placed, busy: {}, periods, days: DAYS.length, round
          })}
          busy={busy} error={error}
          onPut={(s) => doPlace(s.key)}
          onClose={() => { setWho(null); setView(確定); }} />
      ) : (
        <>
          {/* ==========================================================
              ★★★入口の 一枚（★見本 `P_wari`・2026-09-24）。
                ★★これが ありません でした。★開くと いきなり 地図 でした。
                  ★★何を する 画面なのか、★いま どこまで 進んで いるのか、
                    ★次に 何を 押せば よいのかが、★どこにも ありません でした。
                ★★字も 数も `lib/lessonRound.js` が 持ちます。★ここで 数えません。
             ========================================================== */}
          {view === 入口 ? (() => {
            const 数 = hubCounts({
              monkaCount: monka.length, prefs: counts, placed
            });
            const 済 = round && round.status === "confirmed";
            return (
              <>
                <div style={{
                  background: C.band, border: `1px solid ${C.line}`, borderRadius: 12,
                  padding: `${rem(10)} ${rem(12)}`, marginBottom: rem(10), ...小
                }}>
                  {(済 ? HUB_WARN_DONE : HUB_WARN).map((t) => (
                    <span key={t} style={{ display: "block" }}>{tx(t)}</span>
                  ))}
                </div>

                <p style={{ ...TYPE.li, color: C.ink, margin: `0 0 ${rem(4)}` }}>
                  {tx(HUB_NOW_HEAD)}
                </p>
                <div style={{
                  background: C.card, border: `1px solid ${C.line}`,
                  borderRadius: 12, overflow: "hidden", marginBottom: rem(12)
                }}>
                  {[
                    [tx(HUB_ANSWERED), `${数.answered} / ${数.total}人`],
                    [tx(HUB_NOT_YET), `${数.notYet}人`],
                    [tx(HUB_PLACED), `${数.placed} / ${数.total}人`],
                    [tx(HUB_DUE), (round && round.due_on) || ""]
                  ].map(([l, v], i, a) => (
                    <div key={l} style={{
                      display: "flex", justifyContent: "space-between", gap: rem(8),
                      padding: `${rem(9)} ${rem(12)}`, ...TYPE.li,
                      borderBottom: i === a.length - 1 ? "none" : `1px solid ${C.line2}`
                    }}>
                      <span>{l}</span><span style={{ color: C.inkSoft }}>{v}</span>
                    </div>
                  ))}
                </div>

                <p style={{ ...TYPE.li, color: C.ink, margin: `0 0 ${rem(4)}` }}>
                  {tx(HUB_STEPS_HEAD)}
                </p>
                <div style={{
                  background: C.card, border: `1px solid ${C.line}`,
                  borderRadius: 12, overflow: "hidden", marginBottom: rem(12)
                }}>
                  {HUB_STEPS.map((st, i) => (
                    <button key={st.key} type="button"
                      onClick={() => setView(st.key === "done" ? 確定 : 地図)}
                      style={{
                        display: "flex", width: "100%", justifyContent: "space-between",
                        alignItems: "center", gap: rem(8), minHeight: 52,
                        padding: `${rem(9)} ${rem(12)}`, background: "transparent",
                        border: "none", textAlign: "left", color: C.ink,
                        fontFamily: FONT_STACK, ...TYPE.li,
                        borderBottom: i === HUB_STEPS.length - 1 ? "none" : `1px solid ${C.line2}`
                      }}>
                      <span>
                        {tx(st.label)}
                        <span style={{ ...小, display: "block" }}>{tx(st.sub)}</span>
                      </span>
                      <span style={{ color: C.inkSoft }}>
                        {st.key === "done" && 済 ? tx(HUB_STEP_DONE) : "›"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ★★★4行 とも 確かめて から 書いて います（★わけは lib の 覚え書き）。 */}
                <div style={{ ...小 }}>
                  {HUB_NOTES.map((t) => (
                    <span key={t} style={{ display: "block" }}>{tx(t)}</span>
                  ))}
                </div>
              </>
            );
          })() : (
          <>
          <div style={{ display: "flex", gap: rem(6), marginBottom: rem(10) }}>
            {[[入口, "もどる"], [地図, "希望の 地図"], [確定, "確定して 配る"]].map(([v, w]) => (
              <button key={v} type="button" onClick={() => setView(v)}
                style={{
                  minHeight: 44, padding: `0 ${rem(13)}`, borderRadius: 999,
                  border: `1px solid ${view === v ? C.curtain : C.line}`,
                  background: view === v ? C.curtain : C.card,
                  color: view === v ? C.onCurtain : C.inkSoft,
                  fontFamily: FONT_STACK, ...TYPE.li
                }}>{tx(w)}</button>
            ))}
          </div>
          {view === 地図 ? (
            <LessonPrefMap
              round={round} periods={periods} counts={counts}
              namesOf={namesOf} placed={placed} busy={{}} />
          ) : (
            <LessonRoundDone
              round={round} total={monka.length} placed={placed} notPlaced={notPlaced}
              onPlace={onPlaceStudent} onConfirm={onConfirm} busy={busy} />
          )}
          </>
          )}
        </>
      )}
      {error ? (
        <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(10) }}>{error}</p>
      ) : null}
    </div>
  );
}
