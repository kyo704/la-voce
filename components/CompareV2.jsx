"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { Card, Pill, Note, H3 } from "@/components/UiV2";
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

// ★★大きさ・間は lib/uiKit.js が 持ちます。★ここで 決めません（★design.zip B01・B02）。
const card = { ...cardStyle, marginBottom: SPACE.cardGap };
const small = { ...TYPE.note, lineHeight: 1.8 };

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

  return (
    <div>
      {/* ★★見本 B01 の 1枚（★内側 11px 12px 9px）。 */}
      <Card style={{ padding: "11px 12px 9px" }}>
        <div style={{ ...TYPE.mini, marginBottom: 2 }}>{item.label}</div>

        {/* ★★時間差 4種（★見本 B01 の .pill・10.5px）。
            ★★見た目は 4つとも 選べます。
            ★★判定に 使うのは 1つだけです（★§2）。★下に そう 書きます。 */}
        <div style={{ display: "flex", gap: 5, margin: "7px 0 2px", flexWrap: "wrap" }}>
          {LAGS.map((l) => (
            <Pill key={l.key} on={shownLag === l.key} onClick={() => setLag(l.key)}>
              {l.label}
            </Pill>
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
      </Card>

      {/* ★★見本 B01 の 但し書き（.q）。★1文字も 変えないこと。
          ★★「まだ 出ていません」は、★責める言葉では ありません。
            ★何が 足りないかを 言わず、★このまま でよい、と 言います。 */}
      <div style={{
        background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12,
        padding: "11px 12px", fontSize: 12.5, lineHeight: 1.75, color: C.ink
      }}>
        まだ、はっきりした差は 見えていません。<br />
        <span style={{ fontSize: 11, color: C.inkSoft }}>
          {data && data.nHard > 0
            ? `出なかった日が ${data.nHard}日 たまりました。この形のまま つづけてください。`
            : "この形のまま つづけてください。"}
        </span>
      </div>

      {/* ★★2つの 断り（★見本⑫）。★1文字も 変えないこと。 */}
      {/* ★★2つの 断り（★見本 B01 の .note・上に 9px）。★1文字も 変えないこと。 */}
      <Note style={{ marginTop: 9 }}>
        {data && data.anyLater ? (
          <>○は あとから書いた日です。目では見えますが、判定には 入れていません。<br /></>
        ) : null}
        判定に使うのは「{(LAGS.find((l) => l.key === judging) || {}).label}」だけです。ほかの3つは、見るためのものです。
      </Note>

      {/* ★★しらべる 項目を 変える。★見本 B02 の「疑っている順」の 手前の 形です。
          ★★順番の 仕組みは、★1文が 出るように なってから 作ります。
            ★いまは 誰にも 出ないので、★順番だけ 先に 作っても 確かめられません。 */}
      <H3>しらべていること</H3>
      <Card>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {ITEMS.map((it) => (
            <Pill key={it.key} on={itemKey === it.key}
              onClick={() => { setItemKey(it.key); setLag(null); }}>{it.label}</Pill>
          ))}
        </div>
      </Card>

      {/* ★★見本⑬の 切替。★既定は 入（★§1）。 */}
      {/* ★★見本 B02 の 切替（.sw）。★角 12・内側 10/12・12.5px。★既定は 入（★§1）。 */}
      <button type="button" onClick={() => setFirstDayOnly((v) => !v)}
        aria-pressed={firstDayOnly}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", textAlign: "left",
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: "10px 12px", marginBottom: SPACE.cardGap,
          minHeight: SPACE.tapMin, fontSize: 12.5, color: C.ink, fontFamily: FONT_STACK
        }}>
        <span>
          {FIRST_DAY_ONLY_LABEL}
          <span style={{
            fontSize: 10, color: C.inkSoft, background: C.paper,
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
