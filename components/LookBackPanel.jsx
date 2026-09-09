"use client";

import { useState } from "react";
import { C, LEVEL_COLORS } from "@/lib/tokens";
import { buildLookBack, hasAnything } from "@/lib/lookBack";
import { TYPE, SPACE, cardStyle } from "@/lib/uiKit";
import { H3, Card, Pill, Li, Note } from "@/components/UiV2";

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

export default function LookBackPanel({ dates, entries, fields }) {
  const list = Array.isArray(dates) ? dates : [];
  const [open, setOpen] = useState(list.length ? list[0] : null);
  if (list.length === 0) return null;

  const sections = open ? buildLookBack(open, entries, fields) : [];

  return (
    <div>
      {/* ★★見本 A05 の 1文（.note）。★1文字も 変えないこと。 */}
      <Note style={{ marginBottom: 10 }}>
        出なかった日を選ぶと、その前の3日に書いたことが そのまま出ます。
      </Note>

      {/* ★★日を えらびます。★新しい順です。
          ★★見本には 1日ぶんしか 描かれていませんが、★選ぶ 手が 要ります。
            ★選べないと、★いちばん 新しい日しか 見られません。 */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {list.map((d) => (
          <Pill key={d} on={open === d} onClick={() => setOpen(open === d ? null : d)}>
            {d.slice(5).replace("-", "/")}
          </Pill>
        ))}
      </div>

      {/* ★★えらんだ日（★見本 A05 の 1枚目）。★枠の 色を すこし 変えます。
          ★★色は 手元の 濃淡から 取ります（★LEVEL_COLORS[0]）。
            ★見本の #E0C9CE と ほぼ 同じ 色みです。★新しい色を 増やしません。 */}
      {open ? (
        <Card style={{ borderColor: LEVEL_COLORS[0] }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 14, color: C.ink }}>{dayLabel(open)}</b>
            <span aria-hidden="true" style={{
              width: 9, height: 9, borderRadius: "50%", background: C.curtain, display: "inline-block"
            }} />
          </div>
          <div style={{ ...TYPE.mini, marginTop: 4 }}>出づらい と書いた日</div>
        </Card>
      ) : null}

      {open && !hasAnything(sections) && (
        <Card>
          <p style={{ ...TYPE.note, lineHeight: 1.8, margin: 0 }}>
            この日の前には、まだ何も書かれていません。
          </p>
        </Card>
      )}

      {open && hasAnything(sections) && sections.map((s) => (
        <div key={s.key}>
          {/* ★★見本 A05 の 小見出し「まえの日　9月5日（木）」。 */}
          <H3>{s.label}　{dayLabel(s.date)}</H3>
          {s.rows.length === 0 ? (
            /* ★★黙って飛ばしません。★書いていないことも、事実です。 */
            <Card>
              <p style={{ ...TYPE.note, margin: 0 }}>書いていません。</p>
            </Card>
          ) : (
            <Card>
              {s.rows.map((r, i) => (
                // ★★色を変えません。★値の大小で、色を変えないこと。
                <Li key={r.key} right={r.value} last={i === s.rows.length - 1}>
                  {r.label}
                </Li>
              ))}
            </Card>
          )}
        </div>
      ))}

      {/* ★★ここに、まとめの1文を置かないこと。
          ★「前の夜は遅かったようです」も、★書きません。
          ★★並べるところで、終わりです。 */}
    </div>
  );
}
