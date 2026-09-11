"use client";

import { useState, useEffect } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
import { Card, Pill, Note, Li, Warn } from "@/components/UiV2";
import { LAGS, ITEMS, defaultLagOf, judgingLagOf } from "@/lib/lagChoice";
import { LINE_UP_NOTE } from "@/lib/lineUp";
import { FIRST_DAY_ONLY_LABEL } from "@/lib/compareGroups";
import {
  buildCompare, compareVerdict, compareSentence,
  STOP_DAYS, STOP_EFFECT, STOP_Q, STOP_NO_DATA
} from "@/lib/compareView";
import {
  ORDER_COPY, ORDER_MAX, readOrder, writeOrder, moveUp, firstOf, testedCount
} from "@/lib/compareOrder";

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
/**
 * ★軸を 0 から 始めるか。
 *
 *   ★★見本の dotplot は、★0・2・4・6時間 の 4本で 固定です
 *     （★sy(v) = H - v/6*H）。★0 から 始まります。
 *   ★★長さ（時間・分）は、★0 に 意味が あります。
 *     ★「食べ終えてから 寝るまで 0時間」は、★食べて すぐ 寝た、です。
 *   ★★むくみ（0〜2）や 湿度（％）は、★0 から 始めません。
 *     ★湿度を 0 から 描くと、★40〜70％ が 下の ほうに 潰れます。
 *   ★★2026-09-11、★比較画像で 軸が 2時間から 始まって いました。
 */
const ZERO_BASED = ["dinnerToBed", "sleepHours", "sungMinutes", "speechMinutes"];

/**
 * ★端が 動かない 軸（★坂本さんの お決め・2026-09-11）。
 *
 *   ★「見本どおり（0〜6時間の 固定）に してください。6時間を 超える 点は
 *     外に 出ることに なりますが、実際の 利用データを 見て、必要であれば、
 *     後で、調整します。」
 *
 *   ★★見本の dotplot は sy(v) = H - v/6*H です。★0〜6時間の 固定。
 *     ★その 図は「食べ終えてから 寝るまでの間」の ものです。
 *
 *   ★★ほかの 項目に 0〜6 を そのまま あてると、★おかしく なります。
 *     ★昨夜の 睡眠は 7〜8時間が ふつうです。★ほとんどの 点が 外に 出ます。
 *     ★声を使った 時間は 分です。★6分では ありません。
 *   ★★だから、★見本に 図が ある 1つだけを 固定に します。
 *     ★ほかは 0 から 始めて、★上だけ 点に 合わせます。
 *     ★★この 判断を、★坂本さんに お伝えします。★黙って 広げません。
 */
const FIXED_AXIS = Object.freeze({ dinnerToBed: [0, 6] });

function Scatter({ data, itemKey }) {
  const pts = data.good.concat(data.hard);
  if (pts.length === 0) return null;
  const vals = pts.map((p) => p.value);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (ZERO_BASED.includes(itemKey)) lo = Math.min(0, lo);
  const fixed = FIXED_AXIS[itemKey];
  if (fixed) { lo = fixed[0]; hi = fixed[1]; }
  const ticks = niceTicks(lo, hi);
  if (ticks.length > 0 && !fixed) {
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
  const H = 214, AXIS = 56, TOP = 14, BOTTOM = 22, RIGHT = 2;
  const plotH = H - TOP - BOTTOM;
  /** ★値 → .dp の 中の 上からの 画素。 */
  const yOf = (v) => TOP + (1 - (v - lo) / span) * plotH;

  // ★2つの かたまりの 中心（★.dpg の 幅に 対する ％）。
  const CENTER = [25, 75];

  // ★★端の 外の 点は、★描きません。★端に 貼り付けると、
  //   ★★そこに 点が あるように 見えます。★嘘に なります。
  //   ★★何件 外に 出たかは、★図の 下に 書きます。★黙って 消しません。
  const outside = pts.filter((p) => p.value < lo || p.value > hi).length;

  const dots = (list, ci) => list.filter((p) => p.value >= lo && p.value <= hi).map((p, i) => (
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
          // ★★見本は stroke-width 1.6・stroke-dasharray "4 3" の 実線の 破線です。
          //   ★★2026-09-11、★薄くて 見えませんでした。★濃さを 上げます。
          borderTop: `1.6px dashed ${C.curtain}`, opacity: 1
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
      {/* ★★見本は「よく出た日 14日」で 1行です（★dotplot の <text>）。
          ★★2026-09-11 まで 2行に 割って いました。★1行に 戻します。
            ★★下の 余白（BOTTOM）も、★2行ぶんから 1行ぶんに 戻します。 */}
      {label}　{n}日
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
      {/* ★★端の 外に 出た 点が あれば、★数だけ 書きます。
          ★★黙って 消しません。★「無かった」ことに しません。
          ★責める 言葉に しません。★数と、どこまでの 図か、だけ です。 */}
      {outside > 0 ? (
        <span style={{
          position: "absolute", right: RIGHT, top: 0,
          fontSize: rem(9), color: C.inkSoft
        }}>{valueWord(itemKey, hi, true)}より 外に {outside}日</span>
      ) : null}
    </div>
  );
}

/**
 * ★空の 姿（★見本 stateBlock）。
 *
 *   ★★白紙に しません。★「まだ ありません」だけで 終わりません。
 *   ★★何を すると 埋まるかを 1行 書きます（★見本の 決め）。
 */
function Empty() {
  return (
    <>
      <div style={{
        ...cardStyle, textAlign: "center", padding: "26px 16px",
        marginBottom: SPACE.cardGap
      }}>
        <div style={{ ...TYPE.body, marginBottom: 6 }}>まだ、くらべる ものが ありません。</div>
        <div style={{ ...TYPE.usual, lineHeight: 1.9 }}>
          記録を 10日ぶん 書くと、点が 2つの 山に 分かれて 出ます。
        </div>
      </div>
    </>
  );
}

/**
 * ★調べていることの 順番（★見本 SC['順番']）。
 *
 *   ★★「疑っている 順に、5つまで。★1番目だけ、補正なしで 見ます。」
 *   ★★入れ替えたら、★そこから 数え直します。
 *     ★見てから 選び直せると、★いちばん よく見える 組を 選べてしまいます。
 */
function OrderScreen({ order, onChange, onBack, message }) {
  const label = (k) => (ITEMS.find((x) => x.key === k) || {}).label || k;
  return (
    <div>
      <button type="button" onClick={onBack}
        style={{
          display: "block", background: "transparent", border: "none",
          padding: "10px 1px", minHeight: SPACE.tapMin,
          color: C.inkSoft, fontSize: rem(13), fontFamily: FONT_STACK
        }}>‹　くらべる</button>
      {/* ★★見本は 画面の 題です（.hd > h2・17px）。★小さな 見出しでは ありません。
          ★★2026-09-11、★比較画像で 11.5px の 小見出しに なっていました。 */}
      <div style={{ padding: "2px 1px 6px" }}>
        <h2 style={TYPE.title}>{ORDER_COPY.title}</h2>
      </div>
      <div style={{
        background: "#F6F1E4", border: "1px solid #E8DFC8", borderRadius: 12,
        padding: `${rem(9)} ${rem(11)}`, marginBottom: rem(10), ...TYPE.note
      }}>
        {ORDER_COPY.warnA}<b>{ORDER_COPY.warnB}</b>{ORDER_COPY.warnC}
      </div>
      <Card style={{ padding: "0 12px" }}>
        {order.map((k, i) => (
          <div key={k} style={{
            display: "flex", alignItems: "center", gap: rem(9),
            // ★★上下の 余白を 入れません。★↑ の 押しどころ（44px）が 高さを 決めます。
            //   ★★2026-09-11、★両方 入れていて、★1行 64px に なっていました。
            //     ★見本の .ord は 46px です。
            padding: 0, minHeight: SPACE.tapMin,
            borderBottom: i === order.length - 1 ? "none" : `1px solid ${C.line2}`,
            ...TYPE.li
          }}>
            {/* ★★番号は 順番です。★点数では ありません。 */}
            <span style={{
              flex: "none", width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: rem(11),
              background: i === 0 ? C.curtain : C.paper,
              color: i === 0 ? "#FFFDF8" : C.inkSoft
            }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{label(k)}</span>
            <button type="button"
              onClick={() => (i > 0 ? onChange(moveUp(order, i)) : null)}
              disabled={i === 0}
              aria-label={label(k) + " を 上へ"}
              style={{
                flex: "none", minHeight: SPACE.tapMin, padding: "0 10px",
                background: "transparent", border: "none",
                color: C.inkSoft, opacity: i === 0 ? 0.25 : 1,
                fontSize: rem(15), fontFamily: FONT_STACK
              }}>↑</button>
          </div>
        ))}
      </Card>
      {message ? (
        <p style={{ ...TYPE.usual, margin: `0 0 ${rem(9)}` }}>{message}</p>
      ) : null}
      <div style={{
        ...cardStyle, background: "#F6F1E4", borderColor: "#E8DFC8",
        marginBottom: SPACE.cardGap
      }}>
        <div style={{ ...TYPE.li, lineHeight: 1.8 }}>
          {ORDER_COPY.firstLabel}　{label(order[0] || "")}<br />
          <span style={{ ...TYPE.usual }}>{ORDER_COPY.firstNote}</span>
          <br /><br />
          {ORDER_COPY.restLabel}<br />
          <span style={{ ...TYPE.usual }}>{ORDER_COPY.restNote}</span>
        </div>
      </div>
      {/* ★★見本は .note を 畳んでいます（foldNotes）。 */}
      <Note fold>
        {ORDER_COPY.notes.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}

/**
 * ★くらべる。
 *
 *   @param stacked      ★順番の 画面を 出しているか（★親が 持ちます）
 *   @param onStack      ★順番の 画面を 開く／閉じる（★親へ 知らせます）
 *
 *   ★★2026-09-11、★順番の 画面が「ふりかえる」の 中に 入れ子で 出ていました。
 *     ★★見本の push('順番') は、★画面ごと 入れ替えます。
 *       ★頭（ふりかえる）も、★4つの 札も 出ません。
 *     ★★だから、★開いているか どうかを 親（LookBackV2）が 持ちます。
 *       ★親は、★開いている あいだ 頭と 札を 描きません。
 */
export default function CompareV2({ entries, dates, stacked, onStack }) {
  // ★★調べる ものは、★順番の 1番目です。★好きに 選べません（★見本）。
  //   ★見てから 選び直せると、★いちばん よく見える 組を 選べてしまいます。
  const known = ITEMS.map((x) => x.key);
  const [order, setOrder] = useState(() => readOrder(known));
  const [lag, setLag] = useState(null);
  const [firstDayOnly, setFirstDayOnly] = useState(true);
  // ★★開いているかは 親が 持ちます。★親が いない ときだけ 自分で 持ちます。
  const [ownOrder, setOwnOrder] = useState(false);
  const showOrder = onStack ? !!stacked : ownOrder;
  const setShowOrder = onStack || setOwnOrder;
  const [orderMsg, setOrderMsg] = useState("");
  useEffect(() => { setOrder(readOrder(known)); /* eslint-disable-next-line */ }, []);

  const itemKey = firstOf(order) || ITEMS[0].key;
  const item = ITEMS.find((x) => x.key === itemKey) || ITEMS[0];
  const shownLag = lag || defaultLagOf(itemKey);
  const judging = judgingLagOf(itemKey, null);
  const data = buildCompare(entries, dates, itemKey, shownLag, { firstDayOnly });
  const verdict = compareVerdict(data, testedCount());
  const sentence = compareSentence(itemKey, verdict);

  if (showOrder) {
    return (
      <OrderScreen
        order={order}
        message={orderMsg}
        onChange={(next) => {
          setOrder(writeOrder(next, known));
          // ★★入れ替えたら、★そこから 数え直します（★見本）。
          setOrderMsg(ORDER_COPY.recount);
        }}
        onBack={() => { setShowOrder(false); setOrderMsg(""); }} />
    );
  }

  const hasPoints = !!data && data.good.length + data.hard.length > 0;
  if (!hasPoints) {
    return (
      <div>
        <Empty />
        <Note fold>{NOTES.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}</Note>
      </div>
    );
  }

  return (
    <div>
      {/* ★★但し書き（.warn）。★見本の kuraberu() の 1行目です。
          ★★2026-09-11、★比較画像で これが 画面の いちばん上に あり、
            ★★切替の 札より 上に 出ていました。★見本では 下です。
          ★★何も 出ていない ときは 出しません。
            ★見本の kuraberu() は、★stateBlock で 先に 返します。 */}
      <Warn>{LINE_UP_NOTE}</Warn>

      {/* ★★1文は、★3つの門（10日以上／差の大きさ／q）を 通ったときだけ 出ます。
          ★★通っていない 日は、★1文を 出しません。★下の 但し書きだけです。 */}
      {sentence ? (
        <div style={{
          ...cardStyle, borderColor: "#C9A0AB", background: "#FFFCFC",
          marginBottom: SPACE.cardGap
        }}>
          <div style={{ fontSize: rem(15), lineHeight: 1.85, fontWeight: 700, color: C.ink }}>
            {sentence}
          </div>
          {/* ★★数は 3つだけです。★点数でも 順位でも ありません。
              ★★q は 確率では ありません。★「たまたま」を どこで 切ったかです。 */}
          <div style={{ ...TYPE.usual, marginTop: rem(9), lineHeight: 1.8 }}>
            書いた日 {verdict.n}日／差の 大きさ {Math.abs(verdict.g).toFixed(2)}
            ／q = {verdict.q.toFixed(2)}<br />
            くらべた先は、あなた自身の 普段です
          </div>
        </div>
      ) : null}

      <Card style={{ padding: "11px 12px 9px" }}>
        {/* ★★いま 何番目を 見ているか（★見本「（いま 1番目）」）。 */}
        <div style={{ ...TYPE.mini, marginBottom: 2 }}>
          {item.label}　<span style={{ color: C.inkSoft }}>（いま 1番目）</span>
        </div>

        <div style={{ display: "flex", gap: 5, margin: "7px 0 2px", flexWrap: "wrap" }}>
          {LAGS.map((l) => (
            <Pill key={l.key} on={shownLag === l.key} onClick={() => setLag(l.key)}>
              {l.label}
            </Pill>
          ))}
        </div>

        <Scatter data={data} itemKey={itemKey} />
        {/* ★★見本の 凡例。★1文字も 変えないこと。 */}
        <div style={{ ...TYPE.usual, lineHeight: 1.8 }}>
          ● 書いた日　○ あとから 書いた日　- - - まんなか
        </div>
        <div style={{ ...TYPE.usual, marginTop: 5, lineHeight: 1.8 }}>
          時間差を 変えても、<b>判定は「{(LAGS.find((l) => l.key === judging) || {}).label}」に 固定</b>です。ここは 見るだけ。
        </div>
      </Card>

      {/* ★★1文が 出ない 日の 姿（★見本）。★責める 言葉に しないこと。 */}
      {!sentence ? (
        <div style={{
          ...cardStyle, background: "#F6F1E4", borderColor: "#E8DFC8",
          marginBottom: SPACE.cardGap
        }}>
          <div style={{ fontSize: rem(12.5), lineHeight: 1.75, color: C.ink }}>
            まだ、はっきりした差は 見えていません。<br />
            <span style={{ ...TYPE.usual }}>
              {verdict.nHard > 0
                ? `出なかった日が ${verdict.nHard}日 たまりました。この形のまま 続けてください。`
                : "この形のまま 続けてください。"}
            </span>
          </div>
        </div>
      ) : null}

      {/* ★★見本の box。★2行です。 */}
      <Card style={{ padding: "0 12px" }}>
        <button type="button" onClick={() => setShowOrder(true)}
          style={{
            display: "block", width: "100%", textAlign: "left",
            background: "transparent", border: "none", padding: 0,
            minHeight: SPACE.tapMin
          }}>
          <Li right={`${order.length}つ ›`}>{ORDER_COPY.row}</Li>
        </button>
        {/* ★★見本の 切替（.sw）。★44×26・つまみ 20。★既定は 入。 */}
        <Li last right={(
          <span onClick={() => setFirstDayOnly((v) => !v)}
            role="switch" aria-checked={firstDayOnly} tabIndex={0}
            aria-label={FIRST_DAY_ONLY_LABEL}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFirstDayOnly((v) => !v); }}
            style={{
              display: "block", width: 44, height: 26, borderRadius: 99,
              position: "relative", cursor: "pointer",
              background: firstDayOnly ? C.curtain : "#DFD4BE"
            }}>
            <span style={{
              position: "absolute", top: 3, left: firstDayOnly ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,.2)", transition: ".16s"
            }} />
          </span>
        )}>
          {FIRST_DAY_ONLY_LABEL}
          <br />
          <span style={{ ...TYPE.usual }}>本番が 続いた日を 1日目に そろえます</span>
        </Li>
      </Card>

      {/* ★★見本の note 4行。★1文字も 変えないこと。
          ★★見本は .note を 畳んでいます（foldNotes）。★fold を 渡します。 */}
      <Note fold>
        {NOTES.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}

/**
 * ★いちばん下の 4行（★見本 kuraberu の note）。
 *
 *   ★★「出しません」と 書いてある 行です。
 *     ★★見張りが 禁じ手の 語を 探すときは、★この 4行を 先に 外すこと。
 */
const NOTES = [
  "「あと◯日」を 出しません。この画面を 消しません。確率を 出しません。",
  "あとから 書いた日は ○の 白抜き。判定からは 外します。",
  "1文は、3つの門（10日以上／差の大きさ／q）を 通ったときだけ 出ます。",
  "2番目から先の 結果は 出しません。止まった理由だけ 出します。"
];
