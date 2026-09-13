"use client";

import { useState } from "react";
import { C, LEVEL_COLORS } from "@/lib/tokens";
import { buildLookBack, hasAnything, lookBackThree, lookBackValue, LOOK_BACK_ROWS, LOOK_BACK_NOTE } from "@/lib/lookBack";
import { TYPE, SPACE, cardStyle } from "@/lib/uiKit";
import { H3, Card, Li, Note } from "@/components/UiV2";

// ============================================================================
// C1 ── 出なかった日の、前3日をひらく（2026-09-08）
//   ★見本 A05「ふりかえる ／ さかのぼる」に そろえました（★2026-09-10）
//
//   ★出どころ docs/design/pack/screens/A05-ふりかえるさかのぼる.html
//     ★注記　 ★文章を 添えません。★確率も 割合も 出しません。
//
//   ★★2026-09-10、★実機で「見本と 全く ちがう」と ご指摘を いただきました。
//     ★そのとおりでした。★私は「ふりかえる」の 頭と 切替だけを 直し、
//     ★★この 中身には、★手を つけていませんでした。
//     ★★それを「A05 を そろえた」と 書いていました。★言いすぎでした。
//
//   ★★★文章を、添えません。
//     ★「睡眠が短かったからでしょう」と、★書かないこと。
//     ★確率も、割合も、順位も、色分けも、ありません。
//     ★★書いたことを、そのまま縦に並べるだけです。
//
//   ★★ゲートは要りません。★何も主張しないためです。★1日目から動きます。
//
//   ★★書いていない日も、★出します。★「書いていません」と、そう書きます。
//     ★黙って飛ばすと、★何日ぶんを見ているのか、分からなくなります。
//
//   ★見張り components/tests/look-back.test.js
// ============================================================================

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** ★「9月6日（金）」の 形。★時計を 見ません。 */
function dayLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const w = new Date(iso + "T00:00:00Z").getUTCDay();
  return `${Number(m[2])}月${Number(m[3])}日（${WEEK[w]}）`;
}

/**
 * ★さかのぼる（★見本 SC['前3日']）。
 *
 *   ★★2026-09-11、★作り直しました。
 *     ★前は LOOK_BACK_FIELDS の **24項目**を 出していました。
 *     ★★見本は **6項目 × 3日**です。★選んで あります。
 *     ★24 出すと、★見に 来た 目的が 埋もれます。
 *   ★★fields を 渡された ときは、★これまでどおり その 一覧で 出します。
 *     ★前から ある 画面（★notOutDays）を 壊さない ためです。
 */
export default function LookBackPanel({ dates, entries, fields }) {
  const list = Array.isArray(dates) ? dates : [];
  const [open, setOpen] = useState(list.length ? list[0] : null);
  if (list.length === 0) return null;

  // ★★古い 呼び方（fields つき）は、★そのまま 動かします。
  const legacy = Array.isArray(fields) && fields.length > 0;
  const sections = open && legacy ? buildLookBack(open, entries, fields) : [];
  const three = open && !legacy ? lookBackThree(open) : [];

  return (
    <div>
      {/* ★★見本 A05 の 1文（.note）。★1文字も 変えないこと。 */}
      <Note style={{ marginBottom: 10 }}>
        出なかった日を選ぶと、その前の3日に書いたことが そのまま出ます。
      </Note>

      {/* ★★日を えらびます。★見本の白い一覧です。 */}
      <div style={{ marginBottom: 10 }}>
        {list.map((d) => (
          <Card key={d} onClick={() => setOpen(open === d ? null : d)}
            style={{ padding: "10px 12px", borderColor: open === d ? LEVEL_COLORS[0] : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                <b style={{ ...TYPE.usual, color: C.ink }}>{open === d ? "選んだ日　" : ""}{dayLabel(d)}</b>
                <br />
                <span style={{ ...TYPE.mini }}>{open === d ? "出づらい と書いた日" : "前の3日を 見る"}</span>
              </span>
              <span style={{ ...TYPE.usual, color: C.inkSoft }}>前の3日 ›</span>
            </div>
          </Card>
        ))}
      </div>

      {/* ★★古い 呼び方 ── ★これまでどおり。 */}
      {legacy && open && !hasAnything(sections) && (
        <Card>
          <p style={{ ...TYPE.note, lineHeight: 1.8, margin: 0 }}>
            この日の前には、まだ何も書かれていません。
          </p>
        </Card>
      )}
      {legacy && open && hasAnything(sections) && sections.map((s) => (
        <div key={s.key}>
          <H3>{s.label}　{dayLabel(s.date)}</H3>
          {s.rows.length === 0 ? (
            <Card>
              <p style={{ ...TYPE.note, margin: 0 }}>書いていません。</p>
            </Card>
          ) : (
            <Card>
              {s.rows.map((r, i) => (
                <Li key={r.key} right={r.value} last={i === s.rows.length - 1}>
                  {r.label}
                </Li>
              ))}
            </Card>
          )}
        </div>
      ))}

      {/* ★★見本の 形 ── ★6行 × 3日。
          ★★書いていない ものは「—」です。★行ごと 消しません。
            ★「聞いていない」と「無かった」は 別の ことです。 */}
      {!legacy && three.map((d) => (
        <Card key={d.key} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "11px 13px", borderBottom: `1px solid ${C.line}` }}>
            <b style={{ ...TYPE.usual, color: C.ink }}>{d.label}　{dayLabel(d.date)}</b>
          </div>
          <div style={{ padding: "0 12px" }}>
            {LOOK_BACK_ROWS.map((r, i) => (
              // ★★色を 変えません。★値の 大小で 色を 変えないこと。
              <Li key={r.key} last={i === LOOK_BACK_ROWS.length - 1}
                right={lookBackValue((entries || {})[d.date], r.key)}>
                {r.label}
              </Li>
            ))}
          </div>
        </Card>
      ))}

      {/* ★★下の 3行（★見本の .note）。★1文字も 変えないこと。 */}
      {!legacy ? (
        <Note>
          {LOOK_BACK_NOTE.map((line, i) => (
            <span key={i}>{i > 0 ? <br /> : null}{line}</span>
          ))}
        </Note>
      ) : null}

      {/* ★★ここに、まとめの1文を置かないこと。
          ★「前の夜は遅かったようです」も、★書きません。
          ★★並べるところで、終わりです。 */}
    </div>
  );
}
