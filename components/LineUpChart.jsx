"use client";

// ============================================================================
// ならべる ── 同じ 日付の 軸に、上下に 並べる（★見本 stackSVG）
//
//   ★出どころ docs/design/pack-final/00-動く見本-PC・iPad（個人）.html の stackSVG()
//            docs/design/pack-final/裁定-ふりかえる・とだな・もっと（9月10日 その7）§1
//            営業資料 v5 1ページ目
//              「声の調子と、眠りと、夕食の時刻と、湿度を、
//                同じ日付の軸に上下に並べます」
//
//   ★★これが この製品の いちばんの 売りです。
//     ★★1本の 線では ありません。★上下に 並べて 見くらべる ための 画面です。
//
//   ★★本番・レッスンの 日は、★縦の 帯が 全部の レーンを 貫きます（★裁定 §1-2）。
//     ★「本番の 前後で、上下が どう 動いたか」が 1目で 見えます。
//
//   ★★出さないもの
//     ・平均　　★合成した 数だからです（★裁定 §1-2）
//     ・点数・順位・合計
//     ・良い／悪いの 色分け　★1色の 濃淡だけです
//     ・基準線・予報
//
//   ★数と 決めは lib/lineUp.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/line-up-stack.test.js
// ============================================================================

import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, rem } from "@/lib/uiKit";
import { laneOf, laneValue, laneWord } from "@/lib/lineUp";
import { hadPerformanceOrLesson } from "@/lib/analysisFamilies";
import { tx } from "@/lib/t";

/** ★色は 2系統だけ（★裁定 §1-3）。★系列ごとに 別の 色相を 使いません。 */
function toneColor(tone) {
  return tone === "midori" ? C.sage : C.curtain;
}

export default function LineUpChart({ entries, dates, keys }) {
  const lanes = (keys || []).map(laneOf).filter(Boolean);
  if (lanes.length === 0 || (dates || []).length === 0) return null;

  // ★見本の 数。★1つも 変えていません。
  const W = 880, pl = 66, pr = 16, pt = 10, laneH = 46, gap = 17, pb = 28;
  const iw = W - pl - pr;
  const H = pt + lanes.length * laneH + (lanes.length - 1) * gap + pb;
  const bot = H - pb;
  const xOf = (i) => pl + (dates.length < 2 ? iw / 2 : (iw * i) / (dates.length - 1));
  const mmdd = (iso) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

  const step = Math.max(1, Math.ceil(dates.length / 9));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={tx("記録を 同じ日付の 上下に 並べた図")}
      style={{ width: "100%", height: "auto", display: "block", fontFamily: FONT_STACK }}>

      {/* ★★本番・レッスンの 日。★全部の レーンを 貫きます。
          ★★色で 良し悪しを 言いません。★灰色の 帯です。 */}
      {dates.map((d, i) => (
        hadPerformanceOrLesson((entries || {})[d]) ? (
          <rect key={`h${d}`} x={(xOf(i) - 1.6).toFixed(1)} y={pt}
            width="3.2" height={bot - pt}
            style={{ fill: C.inkSoft, opacity: 0.30 }} />
        ) : null
      ))}

      {lanes.map((lane, j) => {
        const top = pt + j * (laneH + gap);
        const three = lane.scale === "three";
        // ★★書いていない 日は 飛ばします。★0 として 描きません。
        const pts = dates
          .map((d, i) => ({ i, v: laneValue((entries || {})[d], lane.key) }))
          .filter((p) => p.v != null);
        let mx, mn;
        if (three) { mx = 3; mn = 1; }
        else {
          const vs = pts.map((p) => p.v);
          mx = vs.length ? Math.max(...vs) : 1;
          mn = vs.length ? Math.min(...vs) : 0;
        }
        if (mx === mn) mx = mn + 1;
        const yOf = (v) => top + laneH - ((v - mn) / (mx - mn)) * laneH;
        const color = toneColor(lane.tone);
        // ★★書いていない 日で 線を つながないこと。
        //   ★つなぐと、★書いていない 日にも 値が あったように 見えます。
        const segs = [];
        let cur = [];
        dates.forEach((d, i) => {
          const v = laneValue((entries || {})[d], lane.key);
          if (v == null) { if (cur.length > 1) segs.push(cur); cur = []; return; }
          cur.push(`${cur.length ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`);
        });
        if (cur.length > 1) segs.push(cur);

        return (
          <g key={lane.key}>
            {[0, 0.5, 1].map((g) => (
              <line key={g} x1={pl} y1={(top + laneH * g).toFixed(1)}
                x2={W - pr} y2={(top + laneH * g).toFixed(1)}
                style={{ stroke: C.line, strokeWidth: 1 }} />
            ))}
            {segs.map((seg, k) => (
              <path key={k} d={seg.join(" ")} fill="none"
                style={{
                  stroke: color, opacity: lane.opacity, strokeWidth: 2,
                  strokeLinejoin: "round", strokeLinecap: "round"
                }} />
            ))}
            {dates.length <= 32 ? pts.map((p) => (
              <circle key={p.i} cx={xOf(p.i).toFixed(1)} cy={yOf(p.v).toFixed(1)} r="2.5"
                style={{ fill: color, opacity: lane.opacity }} />
            )) : null}
            {/* ★★名前は 図の 中に 置きます。★紙の 色で 縁取り、線に 重なっても 読めます。 */}
            <text x={pl + 6} y={top + 14} fontSize="12.5" paintOrder="stroke"
              style={{ fill: C.ink, stroke: C.paper, strokeWidth: 4, strokeLinejoin: "round" }}>
              {lane.label}
            </text>
            <text x={pl - 8} y={top + 9} fontSize="10" textAnchor="end" style={{ fill: C.inkSoft }}>
              {three ? "◎" : laneWord(lane.key, mx)}
            </text>
            <text x={pl - 8} y={top + laneH + 3} fontSize="10" textAnchor="end" style={{ fill: C.inkSoft }}>
              {three ? "△" : laneWord(lane.key, mn)}
            </text>
          </g>
        );
      })}

      {dates.map((d, i) => (
        (i % step === 0 || i === dates.length - 1) ? (
          <text key={`x${d}`} x={xOf(i).toFixed(1)} y={H - 9} fontSize="10.5"
            textAnchor="middle" style={{ fill: C.inkSoft }}>{mmdd(d)}</text>
        ) : null
      ))}
      <line x1={pl} y1={bot} x2={W - pr} y2={bot} style={{ stroke: C.line, strokeWidth: 1 }} />
    </svg>
  );
}
