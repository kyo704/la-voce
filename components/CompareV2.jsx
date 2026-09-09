"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { LAGS, ITEMS, defaultLagOf, judgingLagOf } from "@/lib/lagChoice";
import { FIRST_DAY_ONLY_LABEL } from "@/lib/compareGroups";
import { buildCompare } from "@/lib/compareView";

// ============================================================================
// くらべる（見本⑫ ／ 2026-09-09）
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑫
//     「★⑫ くらべる ／ まだ 出ていない　★これが ふだんの画面です。消えません」
//     「★点数・順位・信号色・％・進捗は 1つも出しません。色は えんじの濃淡だけです。」
//
//   ★★いまは、★誰にも 1文が 出ません（★いちばん書いている方で 21日）。
//     ★★だから この画面が、★ふだんの 姿です。★作り込むべきは こちらです。
//
//   ★★出さないもの
//     ★点数・順位・信号色・％・進捗。★1つも。
//     ★「あと◯日で 見えます」。★実測が 出るまで 書かない（★査読 §8）。
//
//   ★★数と 決めは lib が 持ちます。★ここでは 決めません。
//     ★lib/compareView.js　群の 作り方と まんなか
//     ★lib/lagChoice.js　　時間差（★判定は 1つ、★表示は 4つ）
//     ★lib/compareGroups.js 初日だけ
//
//   ★見張り components/tests/compare-view.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★時間の 値を 言葉に します。★項目に よって 単位が ちがいます。 */
function valueWord(itemKey, v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (itemKey === "dinnerToBed" || itemKey === "sleepHours") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return `${h}時間${String(m).padStart(2, "0")}分`;
  }
  if (itemKey === "bedtime") {
    const t = v >= 24 ? v - 24 : v;
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    return `${h}時${String(m).padStart(2, "0")}分`;
  }
  if (itemKey === "sungMinutes" || itemKey === "speechMinutes") {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return h === 0 ? `${m}分` : `${h}時間${String(m).padStart(2, "0")}分`;
  }
  return String(Math.round(v * 10) / 10);
}

/**
 * ★点の 散らばり（★見本⑫）。
 *
 *   ★★軸に 数を 添えます。★点そのものには 添えません。
 *   ★★色は えんじ 1色。★群で 変えません。★良し悪しを 言わないためです。
 *   ★★あとから書いた点は、★中を 抜きます（★○）。★消しません。
 */
function Scatter({ data, itemKey }) {
  const pts = data.good.concat(data.hard);
  if (pts.length === 0) return null;
  const vals = pts.map((p) => p.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const H = 190;
  const y = (v) => H - 26 - ((v - lo) / span) * (H - 46);

  const col = (list, leftPct, label) => (
    <div style={{ position: "absolute", left: `${leftPct}%`, width: "34%", top: 0, bottom: 0 }}>
      {list.map((p, i) => (
        <span key={p.date} aria-hidden="true" style={{
          position: "absolute", width: 8, height: 8, borderRadius: "50%",
          // ★同じ値の点が 重ならないよう、★左右に わずかに ずらします。
          left: `${28 + ((i * 37) % 44)}%`, top: y(p.value), marginLeft: -4, marginTop: -4,
          background: p.judged ? C.curtain : "transparent",
          border: p.judged ? "none" : `1.4px solid ${C.curtain}`,
          opacity: p.judged ? 0.85 : 0.55
        }} />
      ))}
      <span style={{
        position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center",
        fontSize: "0.6875rem", color: C.inkSoft
      }}>{label}<br /><span style={{ fontSize: "0.625rem" }}>{list.length}日</span></span>
    </div>
  );

  const medLine = (v, leftPct) => {
    if (v == null) return null;
    return (
      <div style={{ position: "absolute", left: `${leftPct}%`, width: "34%", top: y(v) }}>
        <div style={{ borderTop: `1.6px dashed ${C.curtain}`, opacity: 0.85 }} />
        <span style={{
          position: "absolute", right: 0, top: -8, fontSize: "0.625rem", color: C.curtain,
          background: C.card, padding: "1px 3px", borderRadius: 3, whiteSpace: "nowrap"
        }}>{valueWord(itemKey, v)}</span>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", height: H, margin: "10px 0 2px" }}>
      {col(data.good, 14, "よく出た日")}
      {col(data.hard, 56, "出なかった日")}
      {medLine(data.goodMedian, 14)}
      {medLine(data.hardMedian, 56)}
    </div>
  );
}

export default function CompareV2({ entries, dates }) {
  const [itemKey, setItemKey] = useState(ITEMS[0].key);
  const [lag, setLag] = useState(null);
  const [firstDayOnly, setFirstDayOnly] = useState(true);

  const item = ITEMS.find((x) => x.key === itemKey) || ITEMS[0];
  const shownLag = lag || defaultLagOf(itemKey);
  const judging = judgingLagOf(itemKey, null);
  const data = buildCompare(entries, dates, itemKey, shownLag, { firstDayOnly });

  const chip = (on) => ({
    minHeight: 34, padding: "0 12px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? "#FFFDF8" : C.inkSoft, fontSize: "0.75rem"
  });

  return (
    <div className="space-y-3">
      <div style={card}>
        <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 10 }}>{item.label}</p>

        {/* ★★時間差 4種。★見た目は 4つとも 選べます。
            ★★判定に 使うのは 1つだけです（★§2）。★下に そう 書きます。 */}
        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 4 }}>
          {LAGS.map((l) => (
            <button key={l.key} type="button" onClick={() => setLag(l.key)} style={chip(shownLag === l.key)}>
              {l.label}
            </button>
          ))}
        </div>

        {data && data.good.length + data.hard.length > 0 ? (
          <>
            <Scatter data={data} itemKey={itemKey} />
            {/* ★★凡例（★見本⑫）。 */}
            <div className="flex gap-3" style={{ ...small, alignItems: "center" }}>
              <span><span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: C.curtain, marginRight: 4, verticalAlign: -1
              }} />書いた日</span>
              <span><span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                border: `1.4px solid ${C.curtain}`, marginRight: 4, verticalAlign: -1
              }} />あとから書いた日</span>
              <span>--- まんなか</span>
            </div>
          </>
        ) : (
          // ★★点が 1つも 無い日。★空の枠を 置きません。
          <p style={small}>この期間に、くらべられる記録がまだありません。</p>
        )}
      </div>

      {/* ★★見本⑫の 但し書き。★1文字も 変えないこと。
          ★★「まだ 出ていません」は、★責める言葉では ありません。
            ★何が 足りないかを 言わず、★このまま でよい、と 言います。 */}
      <div style={{ ...card, background: C.paper }}>
        <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 4 }}>
          まだ、はっきりした差は 見えていません。
        </p>
        <p style={small}>
          {data && data.nHard > 0
            ? `出なかった日が ${data.nHard}日 たまりました。この形のまま つづけてください。`
            : "この形のまま つづけてください。"}
        </p>
      </div>

      {/* ★★2つの 断り（★見本⑫）。★1文字も 変えないこと。 */}
      {data && data.anyLater ? (
        <p style={small}>
          ○は あとから書いた日です。目では見えますが、判定には 入れていません。
        </p>
      ) : null}
      <p style={small}>
        判定に使うのは「{(LAGS.find((l) => l.key === judging) || {}).label}」だけです。ほかの3つは、見るためのものです。
      </p>

      {/* ★★しらべる 項目を 変える。★見本⑬の「疑っている順」の 手前の 形です。
          ★★順番の 仕組みは、★1文が 出るように なってから 作ります。
            ★いまは 誰にも 出ないので、★順番だけ 先に 作っても 確かめられません。 */}
      <div style={card}>
        <p style={{ ...small, marginBottom: 8 }}>しらべていること</p>
        <div className="flex gap-1.5 flex-wrap">
          {ITEMS.map((it) => (
            <button key={it.key} type="button"
              onClick={() => { setItemKey(it.key); setLag(null); }}
              style={chip(itemKey === it.key)}>{it.label}</button>
          ))}
        </div>
      </div>

      {/* ★★見本⑬の 切替。★既定は 入（★§1）。 */}
      <button type="button" onClick={() => setFirstDayOnly((v) => !v)}
        aria-pressed={firstDayOnly}
        className="w-full flex items-center justify-between"
        style={{ ...card, minHeight: 52, fontSize: "0.8125rem", color: C.ink }}>
        <span>
          {FIRST_DAY_ONLY_LABEL}
          <span style={{
            fontSize: "0.625rem", color: C.inkSoft, background: C.paper,
            borderRadius: 6, padding: "2px 7px", marginLeft: 6
          }}>既定</span>
        </span>
        <span style={{
          width: 36, height: 20, borderRadius: 999, position: "relative", flex: "none",
          background: firstDayOnly ? C.curtain : C.line
        }}>
          <span style={{
            position: "absolute", width: 16, height: 16, borderRadius: "50%",
            background: "#FFFDF8", top: 2, left: firstDayOnly ? 18 : 2
          }} />
        </span>
      </button>
    </div>
  );
}
