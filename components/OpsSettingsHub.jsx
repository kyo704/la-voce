"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Box, Li, Note, Usu, Warn } from "@/components/UiV2";
import useWindowWidth from "@/components/useWindowWidth";
import { permHeadLine } from "@/lib/opsPerms";
import {
  sectionsFor, readySections, notYetSections, firstSection, mayOpen,
  SIDE_WIDTH, isTwoPane, NOT_YET_HEAD, NOT_YET_LINE, headOf
} from "@/lib/opsSettingsNav";
import {
  SCALES, SCALE_LABELS, SCALE_SAMPLE_PX, SCALE_SAMPLE_LINES,
  SCALE_NOTE, normalizeScale
} from "@/lib/displayPrefs";

// ============================================================================
// ★設定 ── ★骨（★見本 `P_settei`・裁定 その97 で 機能まで 仕上げます）
//
//   ★★★きょうまで、★節が 縦に 積んで ありました。
//     ★★見本は 左に 一覧、★右に 中身 です。
//     ★★★12の 節の うち、★実装は 4つ でした。
//       ★★残り 8つ は、★どこにも 出て いません でした ──
//         ★★「まだ 作って いない」ことすら、★見た方に 伝わりません。
//
//   ★★★出せない ものは「まだ」と 名ざしで 出します（★§8⑤）。
//     ★★押せる 札には しません。★何が 足りないかを 添えます。
//
//   ★★節の 決めは lib/opsSettingsNav.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-settings-nav.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

/**
 * ★見やすさ（★見本 `stMiyasu`）。
 *
 *   ★★★字の 大きさ だけ です。★明るさ（暗い 画面）は まだ ありません。
 *     ★★この 蔵に、★暗い 画面の 仕掛けが ありません。
 *     ★★無い ものの 札を 置きません。
 *   ★★段と 字は lib/displayPrefs.js が 持ちます。
 *   ★★★書く 道は、★個人の 画面と **同じ もの** です。
 *     ★★2つ 作ると、★片方だけ 効く 日が 来ます。
 */
function Miyasu({ scale, onPick, busy }) {
  const いま = normalizeScale(scale);
  return (
    <div>
      <H3>文字の 大きさ</H3>
      <Warn>
        この 設定は、あなたの 端末だけに かかります。ほかの 方には かかりません。<br />
        画面の 大きさは 変わりません。中の 字と ボタンが 大きくなり、
        その ぶん 1画面に 入る 量が 減ります。
      </Warn>
      <Box>
        {SCALES.map((k, i) => (
          <Li key={k} last={i === SCALES.length - 1}
            right={いま === k
              ? <span style={{ color: C.sage }}>いま これです</span> : "これに する"}
            onClick={busy ? null : () => onPick && onPick(k)}>
            <span style={{ fontSize: SCALE_SAMPLE_PX[k] }}>{SCALE_LABELS[k]}</span>
            <div style={{ ...小, fontSize: Math.round(SCALE_SAMPLE_PX[k] * 0.85) }}>
              {SCALE_SAMPLE_LINES[0]}
            </div>
          </Li>
        ))}
      </Box>
      <H3>大きくすると どうなるか</H3>
      <Box>
        {[["字と ボタン", "大きくなります"],
          ["押せる ところ", "広くなります"],
          ["1画面に 入る 量", "減ります（横に すべる 表が 増えます）"],
          ["表の 列", "狭く なります。横に すべって ご覧ください"],
          ["画面の 外わく", "変わりません"]].map((x, i, a) => (
          <Li key={x[0]} last={i === a.length - 1} right={x[1]}>{x[0]}</Li>
        ))}
      </Box>
      <Note>
        {SCALE_NOTE.map((t) => (<div key={t}>{t}</div>))}
      </Note>
    </div>
  );
}

export default function OpsSettingsHub({
  perms, postName,
  // ★節の 中身。★上から 渡します（★ここで 組み立てません）。
  panes = {},
  // ★見やすさ（★個人の 画面と 同じ 道 を 渡して いただきます）。
  scale, onPickScale, scaleBusy
}) {
  const width = useWindowWidth();
  const 二面 = isTwoPane(width);
  const [open, setOpen] = useState(() => firstSection(perms));
  const 一覧 = sectionsFor(perms);
  const まだ = notYetSections(perms);
  const いま = mayOpen(perms, open) ? open : firstSection(perms);

  const 中身 = (key) => {
    if (key === "miyasu") {
      return <Miyasu scale={scale} onPick={onPickScale} busy={scaleBusy} />;
    }
    return panes[key] || null;
  };

  const 一覧の札 = (
    <Box>
      {readySections(perms).map((x, i, a) => (
        <Li key={x.key} last={i === a.length - 1}
          right={いま === x.key && 二面 ? "" : "›"}
          style={いま === x.key
            ? { color: C.curtain, fontWeight: 700 } : undefined}
          onClick={() => setOpen(x.key)}>{x.label}</Li>
      ))}
    </Box>
  );

  const まだの札 = まだ.length ? (
    <div>
      <H3>{NOT_YET_HEAD}</H3>
      <Box>
        {まだ.map((x, i) => (
          <Li key={x.key} last={i === まだ.length - 1} right="まだ">
            {x.label}
            <div style={小}>{x.needs}</div>
          </Li>
        ))}
      </Box>
      <Usu>{NOT_YET_LINE}</Usu>
    </div>
  ) : null;

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={headOf(perms)} />
      {perms !== undefined ? (
        <p style={{ ...小, margin: 0 }}>{permHeadLine(postName, perms)}</p>
      ) : null}

      {/* ★★★広い ときは 2面（★見本 ── 左 210px）。
          ★★狭い ときは、★一覧の 下に 中身を 続けます。
            ★★1画面の ままに します。★戻る 道を 1本 増やしません。 */}
      {二面 ? (
        <div style={{ display: "flex", gap: rem(14), alignItems: "flex-start",
                      marginTop: rem(10) }}>
          <div style={{ flex: `0 0 ${SIDE_WIDTH}px`, minWidth: 0 }}>
            {一覧の札}
            {まだの札}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>{中身(いま)}</div>
        </div>
      ) : (
        <div style={{ marginTop: rem(10) }}>
          {一覧の札}
          <div style={{ marginTop: rem(12) }}>{中身(いま)}</div>
          {まだの札}
        </div>
      )}
      <Usu>{`節 ${一覧.length} のうち、いま 触れるのは ${readySections(perms).length} です。`}</Usu>
    </div>
  );
}
