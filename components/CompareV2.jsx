"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
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

/**
 * ★時間の 値を 言葉に します。★項目に よって 単位が ちがいます。
 *
 *   @param short ★軸の 目盛り用。★短く します。
 *
 *   ★★2026-09-11、★実機で 軸の 字が 2行に 折れ、★線と 重なっていました。
 *     ★「5時間00分」は 9px でも 54px あり、★軸の 幅 40px に 入りません。
 *     ★★目盛りは 切りの よい 数なので、★分は たいてい 00 です。
 *       ★★00分の ときは 書きません。★短くすると 折れません。
 */
function valueWord(itemKey, v, short) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (itemKey === "dinnerToBed" || itemKey === "sleepHours") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    if (short && m === 0) return `${h}時間`;
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
 * ★目盛りの 刻み。★3〜5本に なる、★切りの よい 数を えらびます。
 *
 *   ★★見本 B01 は 0時間・2時間・4時間・6時間 の 4本です。
 *   ★★点に 数を 添えません。★軸に だけ 添えます。
 */
function niceTicks(lo, hi) {
  const span = (hi - lo) || 1;
  const raw = span / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw) || mag * 10;
  const first = Math.ceil((lo - 1e-9) / step) * step;
  const out = [];
  for (let v = first; v <= hi + 1e-9 && out.length < 8; v += step) {
    out.push(Number(v.toFixed(6)));
  }
  return out;
}

/**
 * ★点の 散らばり（★見本 B01）。
 *
 *   ★出どころ docs/design/pack/screens/B01-くらべるまだ出ていない.html
 *     .dp  高さ 206px ／ 上に 12px
 *     .dpg 左 40px（★目盛りの ぶん）・右 2px・上 10px・下 22px
 *     .d   8px の 丸。★あとから 書いた日は 中を 抜く（.d.o）
 *     .gl  横の 目盛り線 1px（--line2）／ .yl 9px の 目盛りの 字
 *     .med まんなかの 破線 1.6px（★えんじ）／ .medl その 数
 *     .xl  下の 名前 10.5px ＋ 日数 9px
 *
 *   ★★2026-09-10、★実機で「見本と 全く ちがう」と ご指摘を いただきました。
 *     ★★軸も 目盛りも ありませんでした。★点の 高さが 何を 指すのか、
 *       ★画面から 読み取れませんでした。
 *
 *   ★★色は えんじ 1色。★群で 変えません。★良し悪しを 言わないためです。
 *   ★★あとから書いた点は、★中を 抜きます（★○）。★消しません。
 *     ★「目では 見えますが、判定には 入れていません」。
 */
function Scatter({ data, itemKey }) {
  const pts = data.good.concat(data.hard);
  if (pts.length === 0) return null;
  const vals = pts.map((p) => p.value);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const ticks = niceTicks(lo, hi);
  if (ticks.length > 0) {
    lo = Math.min(lo, ticks[0]);
    hi = Math.max(hi, ticks[ticks.length - 1]);
  }
  const span = (hi - lo) || 1;

  // ★見本の 寸法。★画素で そのまま 置きます。
  //   ★★2026-09-11、★軸と 下の 余白を 広げました。
  //     ★軸 40 → 56　★「5時間00分」が 入らず、2行に 折れていました。
  //     ★下 22 → 36　★下の 名前は 2行（名前＋日数）です。★22 では 足りません。
  //   ★★見本の 寸法から 離れます。★けれど 見本の 図は 3行の 字を 持ちません。
  //     ★字が 重なったままより、★入る ほうを 採ります。
  const H = 214, AXIS = 56, TOP = 14, BOTTOM = 36, RIGHT = 2;
  const plotH = H - TOP - BOTTOM;
  /** ★値 → .dp の 中の 上からの 画素。 */
  const yOf = (v) => TOP + (1 - (v - lo) / span) * plotH;

  // ★2つの かたまりの 中心（★.dpg の 幅に 対する ％）。
  const CENTER = [25, 75];

  const dots = (list, ci) => list.map((p, i) => (
    <span key={p.date} aria-hidden="true" style={{
      position: "absolute",
      // ★★同じ値の点が 重ならないよう、★左右に わずかに ずらします。
      //   ★ずらすのは 見るためだけです。★値を 変えていません。
      left: `${CENTER[ci] + (((i * 7) % 9) - 4) * 1.6}%`,
      top: yOf(p.value) - TOP,
      width: 8, height: 8, borderRadius: "50%", margin: "-4px 0 0 -4px",
      background: p.judged ? C.curtain : "transparent",
      border: p.judged ? "none" : `1.4px solid ${C.curtain}`,
      opacity: p.judged ? 0.8 : 0.55
    }} />
  ));

  const medLine = (v, ci) => {
    if (v == null) return null;
    // ★★2026-09-11、★数を 線の 横から 上へ 移しました。
    //   ★★横に 置くと、★下の ほうの まんなかで、
    //     ★★下の 名前（「よく出た日」）と 重なっていました。
    //     ★実機の 写真で「よく出た日3時間06分」と 重なって 見えていました。
    //   ★★上に 置けば、★下の 名前とは 決して ぶつかりません。
    //   ★★いちばん 上に 近い ときだけ、★下に 出します（★はみ出さないため）。
    const y = yOf(v) - TOP;
    const above = y > 16;
    return (
      <div key={"m" + ci} style={{ position: "absolute", left: 0, right: 0, top: y }}>
        <div style={{
          position: "absolute", left: `${CENTER[ci]}%`, width: 52, marginLeft: -26,
          borderTop: `1.6px dashed ${C.curtain}`, opacity: 0.85
        }} />
        <span style={{
          position: "absolute", left: `${CENTER[ci]}%`,
          transform: "translateX(-50%)",
          top: above ? -13 : 4,
          fontSize: rem(9), color: C.curtain, background: C.card,
          padding: "1px 4px", borderRadius: 3, whiteSpace: "nowrap"
        }}>{valueWord(itemKey, v)}</span>
      </div>
    );
  };

  const xLabel = (label, n, ci) => (
    <span key={label} style={{
      position: "absolute", bottom: 0,
      left: `calc(${AXIS}px + (100% - ${AXIS + RIGHT}px) * ${CENTER[ci] / 100})`,
      transform: "translateX(-50%)",
      // ★★下の 名前は 2行です（★名前と 日数）。★重ならないよう 行の 高さを 決めます。
      lineHeight: 1.4,
      fontSize: rem(10.5), color: C.inkSoft, textAlign: "center", whiteSpace: "nowrap"
    }}>
      {label}
      {/* ★★日数です。★点数でも 割合でも ありません。 */}
      <span style={{ display: "block", fontSize: rem(9), color: C.inkSoft, marginTop: 2 }}>{n}日</span>
    </span>
  );

  return (
    <div style={{ position: "relative", height: H, margin: "12px 0 2px" }}>
      {/* ★★横の 目盛り線と、★その 数（★見本の .gl と .yl）。
          ★★数を 添えるのは 軸だけです。★点には 添えません。 */}
      {ticks.map((v) => (
        <span key={"t" + v}>
          <span style={{
            position: "absolute", left: AXIS, right: RIGHT, top: yOf(v),
            height: 1, background: C.line2
          }} />
          <span style={{
            position: "absolute", left: 0, width: AXIS - 6, top: yOf(v),
            transform: "translateY(-50%)", textAlign: "right",
            fontSize: rem(9), color: C.inkSoft,
            // ★★折り返させません。★折れると 線と 重なります。
            whiteSpace: "nowrap", overflow: "hidden"
          }}>{valueWord(itemKey, v, true)}</span>
        </span>
      ))}
      {/* ★★点の 置き場（★見本の .dpg）。 */}
      <div style={{ position: "absolute", left: AXIS, right: RIGHT, top: TOP, bottom: BOTTOM }}>
        {dots(data.good, 0)}
        {dots(data.hard, 1)}
        {medLine(data.goodMedian, 0)}
        {medLine(data.hardMedian, 1)}
      </div>
      {xLabel("よく出た日", data.good.length, 0)}
      {xLabel("出なかった日", data.hard.length, 1)}
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
        padding: "11px 12px", fontSize: rem(12.5), lineHeight: 1.75, color: C.ink
      }}>
        まだ、はっきりした差は 見えていません。<br />
        <span style={{ fontSize: rem(11), color: C.inkSoft }}>
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
          minHeight: SPACE.tapMin, fontSize: rem(12.5), color: C.ink, fontFamily: FONT_STACK
        }}>
        <span>
          {FIRST_DAY_ONLY_LABEL}
          <span style={{
            fontSize: rem(10), color: C.inkSoft, background: C.paper,
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
