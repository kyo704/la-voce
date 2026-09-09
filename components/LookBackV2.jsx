"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import LookBackPanel from "@/components/LookBackPanel";
import { LOOK_BACK_FIELDS, hardDays, lookBackableDays } from "@/lib/lookBack";
import { PERIODS, LINE_UP_NOTE, datesBack, seriesOf, sungMinutes } from "@/lib/lineUp";
import { SYMPTOM_LOCATION } from "@/lib/symptomLocations";
import { isLaterWritten } from "@/lib/entrySource";
import CompareV2 from "@/components/CompareV2";
import { tabIsOpen, quietReason } from "@/lib/quietDays";

// ============================================================================
// 「ふりかえる」の画面（見本④⑤ ／ 2026-09-09）
//
//   ★★見本の 決まり
//     ★★「文章を添えません。★確率も割合も出しません。」
//     ★一色の 濃淡だけです。★値で 色を 変えません。
//     ★書いていない日は、★空けます。★0 として 描きません。
//
//   ★★「さかのぼる」は、★前からある C1 を そのまま 使います。
//     ★★作り直しません。★同じものを 2つ 持つと、★片方だけ 直ります。
//     ★足したのは、★どの日から さかのぼれるか、だけです（★lib/lookBack.js）。
//
//   ★★「くらべる」「かぞえる」は、★まだ 置きません。
//     ★見本が 届いていません。★押せるのに 何も 起きないものを 出さないため。
//
//   ★数と 言葉は lib/lineUp.js と lib/lookBack.js が 持ちます。
//
//   ★見張り components/tests/line-up.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.7 };

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

/** ★一色の 濃淡の 帯（★見本④）。★値の 数字を 添えません。 */
function Bars({ title, rows, tint, entries }) {
  if (!rows) return null;
  // ★★あとから書いた日が 1日でも あれば、★凡例を 出します（★見本⑫）。
  //   ★1日も 無ければ 出しません。★読む人に、要らない断りを 増やしません。
  const anyLater = (entries || rows) &&
    rows.some((r) => isLaterWritten(((entries || {})[r.date] || {}).source));
  return (
    <div style={card}>
      <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 10 }}>{title}</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.date} className="flex items-center gap-2">
            <span className="ff-mono" style={{ ...small, minWidth: 34 }}>{mmdd(r.date)}</span>
            <div style={{ flex: 1, height: 10, borderRadius: 999, background: C.paper }}>
              {r.density == null ? null : (
                // ★★長さも 濃さも、★同じ1つの 値から 作ります。
                //   ★2つの 見え方に 分けると、★2つのことを 言ったことに なります。
                //
                // ★★あとから書いた日は、★中を 抜きます（★見本⑫の ○）。
                //   ★★消しません。★同じ長さで、★同じ所に 出ます。
                //     ★「目では見えますが、判定には 入れていません」（★見本⑫）。
                //   ★決めるのは lib/entrySource.js だけです。★ここで 決めません。
                isLaterWritten(((entries || {})[r.date] || {}).source) ? (
                  <div style={{
                    width: `${Math.round(r.density * 100)}%`, height: "100%", borderRadius: 999,
                    border: `1.4px solid ${tint}`, opacity: 0.55
                  }} />
                ) : (
                  <div style={{
                    width: `${Math.round(r.density * 100)}%`, height: "100%", borderRadius: 999,
                    background: tint, opacity: 0.35 + 0.65 * r.density
                  }} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ★★凡例（★見本⑫）。★あとから書いた日が あるときだけ 出します。 */}
      {anyLater ? (
        <p style={{ ...small, marginTop: 8 }}>
          ○は あとから書いた日です。目では見えますが、判定には 入れていません。
        </p>
      ) : null}
    </div>
  );
}

/**
 * ★「気になったこと」の 升目（★見本④）。
 *
 *   ★★書いたか、書いていないか、の 2つだけです。★強さを 出しません。
 *     ★★強さを 出すと、★「ひどい日」を こちらが 決めることに なります。
 *   ★★数えません。★「7日中5日」と 書きません。★割合を 出さないためです。
 *   ★1つも 書かれていなければ、★升目ごと 出しません。
 */
function Symptoms({ entries, dates }) {
  const names = Object.keys(SYMPTOM_LOCATION);
  const rows = dates
    .map((d) => ({ date: d, on: ((entries[d] || {}).throatSymptoms) || [] }))
    .filter((r) => r.on.length > 0);
  if (rows.length === 0) return null;
  return (
    <div style={card}>
      <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 10 }}>気になったこと</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.date} className="flex items-center gap-2">
            <span className="ff-mono" style={{ ...small, minWidth: 34 }}>{mmdd(r.date)}</span>
            <div style={{ display: "flex", gap: 3, flex: 1 }}>
              {names.map((n) => (
                <div key={n} title={n} style={{
                  flex: 1, height: 12, borderRadius: 3,
                  background: r.on.includes(n) ? C.curtain : C.paper,
                  opacity: r.on.includes(n) ? 0.75 : 1
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* ★★何の升目かを 書きます。★色の 意味を 当てさせないこと。 */}
      <p style={{ ...small, marginTop: 8 }}>{names.join("・")}　の順</p>
    </div>
  );
}

export default function LookBackV2({ entries, todayISO, notOutDays, performanceDays }) {
  const [tab, setTab] = useState("narabe");
  const [periodKey, setPeriodKey] = useState("14d");

  const period = PERIODS.find((p) => p.key === periodKey) || PERIODS[0];
  const dates = datesBack(todayISO, period.days);

  const chip = (on) => ({
    minHeight: 36, padding: "0 14px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? "#FFFDF8" : C.inkSoft, fontSize: "0.8125rem"
  });

  return (
    <div className="space-y-3">
      <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.ink }}>ふりかえる</h2>

      {/* ★★見本④の 但し書き。★1文字も 変えないこと。
          ★★飾りでは ありません。★この画面が 何を していないかの 断りです。 */}
      <div style={{ ...card, background: C.paper }}>
        <p style={{ ...small, whiteSpace: "pre-line" }}>{LINE_UP_NOTE}</p>
      </div>

      {/* ★★帯（★見本⑫〜⑮）。★「かぞえる」は、まだ 置きません。
          ★★押せるのに 何も 起きないものを、★出しません。 */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab("narabe")} style={chip(tab === "narabe")}>ならべる</button>
        <button type="button" onClick={() => setTab("sakanobore")} style={chip(tab === "sakanobore")}>さかのぼる</button>
        <button type="button" onClick={() => setTab("kuraberu")} style={chip(tab === "kuraberu")}>くらべる</button>
      </div>

      {tab === "narabe" && (
        <>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriodKey(p.key)} style={chip(periodKey === p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          {/* ★★書いた日が 1日も 無ければ、★その帯を 出しません。★空の枠を 置きません。 */}
          <Bars title="こえの ちょうし" tint={C.curtain} entries={entries}
            rows={seriesOf(entries, dates, (e) => e.throatCondition)} />
          <Bars title="歌った 時間" tint={C.sage} entries={entries}
            rows={seriesOf(entries, dates, (e) => sungMinutes(e))} />
          <Symptoms entries={entries} dates={dates} />
        </>
      )}

      {tab === "sakanobore" && (() => {
        // ★★前からある C1 を、そのまま 使います（★components/LookBackPanel.jsx）。
        //   ★足したのは、★どの日から さかのぼれるか、だけです。
        //   ★★本番で「出なかった」日と、★その日を「出づらい」と 書いた日。
        //     ★見本⑤は 後者です。★どちらも 要ります。★1つに しません。
        const days = lookBackableDays(notOutDays, hardDays(entries, todayISO, period.days));
        if (days.length === 0) {
          // ★★「まだ ありません」と 書きません。★責めに なります。
          //   ★何が あれば 出るかだけを、★静かに 置きます。
          return (
            <div style={card}>
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.8 }}>
                「出づらい」と書いた日が、この期間にはありません。
              </p>
            </div>
          );
        }
        return <LookBackPanel dates={days} entries={entries} fields={LOOK_BACK_FIELDS} />;
      })()}

      {tab === "kuraberu" && (() => {
        // ★★本番の 前後は お休みです（★見本⑮・査読 §1）。
        //   ★★「あなたは こうです」と 言う 2つだけを 休みます。
        //   ★ならべる と さかのぼる は、★いつでも 見られます。
        //   ★決めるのは lib/quietDays.js だけです。★ここで 日を 数えません。
        if (!tabIsOpen("kuraberu", todayISO, performanceDays)) {
          const q = quietReason(todayISO, performanceDays);
          return (
            <div style={{ ...card, textAlign: "center", padding: "28px 16px" }}>
              <p style={{ fontSize: "1rem", color: C.ink, lineHeight: 1.9, marginBottom: 10 }}>
                くらべる と かぞえる は、<br />いまは お休みです。
              </p>
              {q ? (
                <p style={{ ...small, marginBottom: 14 }}>
                  {q.daysUntil > 0
                    ? `${Number(q.performedOn.slice(5, 7))}月${Number(q.performedOn.slice(8, 10))}日の 本番まで あと${q.daysUntil}日です。`
                    : `${Number(q.performedOn.slice(5, 7))}月${Number(q.performedOn.slice(8, 10))}日の 本番のあとです。`}
                  <br />本番の 翌々日から、また 出ます。
                </p>
              ) : null}
              <p style={small}>
                ならべる と さかのぼる は、いつでも 見られます。<br />
                記録も、いつもどおり 書けます。
              </p>
              <div className="flex gap-2" style={{ marginTop: 14 }}>
                <button type="button" onClick={() => setTab("narabe")} style={{ ...chip(false), flex: 1 }}>
                  ならべる を見る
                </button>
                <button type="button" onClick={() => setTab("sakanobore")} style={{ ...chip(false), flex: 1 }}>
                  さかのぼる を見る
                </button>
              </div>
            </div>
          );
        }
        return <CompareV2 entries={entries} dates={dates} />;
      })()}
    </div>
  );
}
