"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li } from "@/components/UiV2";
import { PART_HEAD, REPORT, NOTES, NOT_YET, headOf } from "@/lib/afterMatch";
import { tx } from "@/lib/t";

// ============================================================================
// ★成立後（★見本 `SC['成立後']`・裁定 その94 §4・§5）
//
//   ★★★通報の 口を 残します（★§5 `separation_from_report`）。
//     ★★切った 後でも 通報できます。★ここが その 口 です。
//   ★★★アプリは 会う ところを 決めません。★おふたりで お決めください。
//   ★★★連絡先は まだ 持って いません。★交換の 道が 決まって いません。
//     ★★欄だけ 置きません。★入れても どこにも 残りません。
//
//   ★見張り components/tests/after-match.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function AfterMatch({ match, onClose, onReport, loadError = "" }) {
  if (!match) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <ScreenHead title={tx("成立後")} />
        <p style={小}>{loadError || tx("いま 読めませんでした。")}</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={headOf(match)} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      <Card>
        <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>
          {match.posting_title || match.posting_kind || ""}
        </p>
        {Array.isArray(match.posting_days) && match.posting_days.length ? (
          <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{match.posting_days.join("　")}</p>
        ) : null}
      </Card>

      {match.other_instrument ? (
        <Card style={{ marginTop: rem(9) }}>
          <Li last right={<span style={小}>{match.other_instrument}</span>}>
            <span>{PART_HEAD}</span>
          </Li>
        </Card>
      ) : null}

      {/* ★★★通報の 口（★§5-4）。★切った 後でも 残ります。 */}
      {onReport ? (
        <Btn ghost onClick={onReport} style={{ marginTop: rem(10) }}>{REPORT}</Btn>
      ) : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{t}</span>
        ))}
      </Note>

      {/* ★★まだ できない こと。★札を 置かず、★字で お伝えします。 */}
      <div style={{ marginTop: rem(10) }}>
        {NOT_YET.map((x) => (
          <p key={x.key} style={{ ...小, margin: 0 }}>
            {x.label}　……　{tx("まだ できません")}
          </p>
        ))}
      </div>
    </div>
  );
}
