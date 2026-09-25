"use client";

import { C } from "@/lib/tokens";
import {
  EDEMA_CHOICES, THROAT_CHOICES, DEKI_CHOICES,
  A03_HEADS, A03_TITLES, A03_ASK_NOTE, A03_NOTES, A03_SKIP, A03_SUBMIT,
  markOf, fiveOf, mayUseQuickCondition,
  readThroatValue, readDekiValue
} from "@/lib/recordV2";
import { TYPE, SPACE, FONT_STACK, rem, cardStyle } from "@/lib/uiKit";
import { Card, Warn, Note, Two, Btn, H3 } from "@/components/UiV2";

// ============================================================================
// 「記録」の 画面（A03）── ★動く見本の S_kiroku() の 形
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kiroku()（★616〜690行）。★これが 唯一の 正です。
//
//   ★★2026-09-11、★9月9日の「折りたたみ 5つ」から 作り直しました。
//     ★★静止画（screens/*.html）は 24時間 古く、★裁定20本ぶん 反映が
//       ありませんでした（★正誤表 §1）。★あれを 見て 作っていました。
//     ★★正しい 形は「あさ／よる／足す」の 3つの 見出しです。
//
//   ★★並び
//     hd（記録＋保存しました）／ 日付の帯 ／
//     あさ … むくみ3択 ＋ 昨夜の睡眠 ／
//     よる … のど3択 ＋ 出来3択 ＋ 声を使った時間 ／ しるし ／
//     足す … 本番レッスン・食べたもの・からだのこと・ひとこと・お仕事 ／
//     ［きょうは 書かない］［出す］／ しるし 3行
//
//   ★★行き先を ここで 決めません。★lib/recordV2.js だけが 決めます。
//   ★★大きさ・間・書体は lib/uiKit.js が 持ちます。★ここで 決めません。
//   ★★数を 出しません。★「n/5」も「あと◯つ」も 出しません。
//     ★★見本は「3つ」と 出しますが、★見本自身が「この見本の 説明用です」と
//       断っています。★この家では 出しません。
//
//   ★★「?（記録のきまり）」を 置きました（★2026-09-25）。
//     ★★2026-09-11 から、★ここには こう 書いて ありました ──
//       「★行き先の 画面が まだ ありません。★押せない ボタンを 置かない」
//     ★★★その 行き先を 作りました ── `components/KirokuNoKimari.jsx`。
//       ★だから 引き金が 引かれ、★「?」を 置いて います。
//     ★★字は `lib/kirokuNoKimari.js` が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/record-v2.test.js
//         components/tests/a03-kiroku.test.js
// ============================================================================

// ★★小見出し（.h3）は 共通の 部品です（★components/UiV2.jsx）。
//   ★★2026-09-11 まで、★ここに 写しが ありました。
//     ★同じ 形を 2か所に 置くと、★片方だけ 直ります。

/**
 * ★3択（★見本の tri）。
 *
 *   ★★印（◎○△）は 並びから 出します。★組ごとに 書き写しません。
 *   ★★選ばれた 印は、★2px の 枠です。★色は その 上の 念押しです。
 *     ★色だけに 意味を 持たせていません。
 */
/**
 * ★3択の 札の 地（★見本 `.tri div{background:#FDFAF3}`）。
 *
 *   ★★白（`C.card`）では ありません。★ほんの 少し 生成りです。
 *   ★★新しい 色では ありません。★見本が もともと 持って いた 値です。
 */
const TRI_BG = "#FDFAF3";

function Tri({ title, choices, current, onPick }) {
  return (
    <Card>
      <div style={{ ...TYPE.mini, marginBottom: rem(9) }}>{title}</div>
      <div style={{ display: "flex", gap: 7 }}>
        {choices.map((w, i) => {
          const on = current === w;
          return (
            <button key={w} type="button" onClick={() => onPick(w)}
              aria-pressed={on}
              style={{
                ...cardStyle,
                flex: 1, minWidth: 0,
                // ★★高さ（★2026-09-14・坂本さんの お決め ㋔）。
                //   ★★見本は 60 です。★字を 1段 大きく したので、
                //     ★60 では 窮屈に なります。★70 に します。
                minHeight: 70,
                // ★★`minHeight` を 70 に しただけでは、★74 に なりました。
                //   ★★中身（21 ＋ 5 ＋ 12 ＝ 38）に 上下の 余白 26 を 足すと 64、
                //     ★行の 高さで 74 まで 伸びます。
                //   ★★余白を 2px 削って、★70 に します。
                padding: "11px 6px",
                textAlign: "center",
                // ★★地の 色（★お決め ㋓）。★見本 `.tri div{background:#FDFAF3}`。
                //   ★★白い カードの 上に 白い 札を 置くと、
                //     ★境が 枠線だけ に なります。★ほんの 少し 生成りに します。
                background: TRI_BG,
                border: on ? `2px solid ${C.curtain}` : cardStyle.border,
                fontFamily: FONT_STACK
              }}>
              <span aria-hidden="true" style={{
                // ★★印の 大きさ（★お決め ㋒）。★見本 `.tri div .g{font-size:21px}`。
                display: "block", fontSize: rem(21), lineHeight: 1,
                // ★★印の 色（★お決め ㋕）。★見本 `.tri div .g{color:var(--enji)}`。
                //   ★★見本は **切でも えんじ** です。★墨では ありません。
                //     ★3つの ちがいは、★色では なく **濃さ**で 出します。
                //   ★★2026-09-14 まで、★切のときを 墨に して いました。
                //     ★濃さの 仕掛けは あったので、★色だけが ちがって いました。
                color: C.curtain,
                // ★★見本は 濃さで 3段に します（★opacity 1／.72／.5）。
                //   ★★選ばれていない ときだけ 薄くします。
                opacity: on ? 1 : [1, 0.72, 0.5][i]
              }}>
                {markOf(choices, w)}
              </span>
              <span style={{
                // ★★語（★見本 `.tri div .w{font-size:11.5px;color:var(--ink2)}`）。
                //   ★★字の 大きさは TYPE の 引き上げに 合わせて 12px の ままです。
                display: "block", fontSize: rem(12), marginTop: rem(5),
                color: on ? C.curtain : C.inkSoft,
                fontWeight: on ? 700 : 400
              }}>{w}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function RecordV2Head({
  entry, saved, dateBand,
  onPickEdema, onPickThroat, onPickDeki,
  sleepRow, koeRow, addRows,
  onSkip, onSubmit, onOpenKimari
}) {
  const quick = mayUseQuickCondition(entry);
  const throatNow = readThroatValue(entry);
  const dekiNow = readDekiValue(entry);
  const edemaNow = entry ? entry.morningEdema : null;

  // ★★1〜5 を 言葉に 戻します。★書いたのと 同じ 切り方で 読みます。
  const wordOf = (choices, v) =>
    (choices.find((w) => fiveOf(choices, w) === v) || null);

  return (
    <div style={{ fontFamily: FONT_STACK }}>

      {/* ★★見本 .hd。★題と、★保存の 知らせ。
          ★★「保存しました」は 押しどころでは ありません。★緑です。
            ★えんじは 押しどころの 色なので、★押せると 読めてしまいます。 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 1px 6px"
      }}>
        <h2 style={TYPE.title}>記録</h2>
        {saved ? (
          <span style={{ fontSize: rem(12.5), color: C.sage }}>保存しました</span>
        ) : null}
        {/* ★★「?」── ★この画面の きまり へ（★2026-09-25）。
            ★★渡されて いない ときは 出しません ── ★押せない 札を 置きません。
              ★これまで 置いて いなかった 理由が それ です。 */}
        {!saved && onOpenKimari ? (
          <button type="button" onClick={onOpenKimari}
            aria-label="この画面の きまり"
            style={{
              minWidth: 44, minHeight: 44, border: "none", background: "none",
              // ★★15 では なく 15.5 です ── ★6段（12／12.5／13／13.5／14.5／15.5）の 中。
              //   ★大きさは lib/uiKit.js の 段が 決めます。★見本の 生の 数では ありません。
              color: C.inkSoft, fontSize: rem(15.5), cursor: "pointer"
            }}>?</button>
        ) : null}
      </div>

      {/* ★★日付の 帯。★見本は 日付を 字で 出すだけですが、★消せません ──
          ★消すと、★前の日を 書けなく なります。
          ★「消えた」は、★書けなく なった、ということです。 */}
      {dateBand || null}

      {/* ══════ あさ ══════ */}
      <H3>{A03_HEADS.morning}</H3>
      <Tri title={A03_TITLES.edema} choices={EDEMA_CHOICES}
        current={typeof edemaNow === "number" ? EDEMA_CHOICES[edemaNow] : null}
        onPick={(w) => onPickEdema(w)} />
      {sleepRow || null}

      {/* ══════ よる ══════ */}
      <H3>{A03_HEADS.night}</H3>
      {quick ? (
        <>
          <Tri title={A03_TITLES.throat} choices={THROAT_CHOICES}
            current={wordOf(THROAT_CHOICES, throatNow)}
            onPick={(w) => onPickThroat(w)} />
          <Tri title={A03_TITLES.deki} choices={DEKI_CHOICES}
            current={wordOf(DEKI_CHOICES, dekiNow)}
            onPick={(w) => onPickDeki(w)} />
        </>
      ) : (
        // ★★場面ごとに もう 書いてある日です。★3択を 出しません。
        //   ★出すと、★書いてあるものを 1つの答えで 上書きしてしまいます。
        //   ★★この姿は 見本に ありません。★見本が 描いていない 日の ことです。
        <Card>
          <p style={{ ...TYPE.body, margin: 0 }}>
            きょうは、場面ごとに 書いてくださっています。
          </p>
          <p style={{ ...TYPE.usual, margin: "6px 0 0" }}>
            直すときは、下の「本番以外で 声を使った時間」から どうぞ。
          </p>
        </Card>
      )}
      {koeRow || null}

      {/* ★★見本 .warn。★「この2つは 聞きません」と 画面で 約束しています。
          ★★だから、★湿度の 入力欄を 門の中では 出していません。
            ★書いてあることと、★していることを、★合わせています。 */}
      <Warn>{A03_ASK_NOTE}</Warn>

      {/* ══════ 足す（どれも 任意） ══════ */}
      <H3>{A03_HEADS.add}</H3>
      {addRows || null}

      {/* ★★見本 .two。★左が「きょうは 書かない」、★右が「出す」。
          ★★出口の ない画面を 作らないこと。★答えられない日が あります。
          ★★とばした数を 数えません。★「未入力」も「完了度」も 出しません。 */}
      <Two style={{ marginTop: 12 }}>
        {/* ★★共通の 部品です（★見本 .btn.g ／ .btn）。★写しを 置きません。 */}
        <Btn ghost onClick={onSkip} style={{ flex: 1 }}>{A03_SKIP}</Btn>
        <Btn onClick={onSubmit} style={{ flex: 1 }}>{A03_SUBMIT}</Btn>
      </Two>

      {/* ★★見本 .note の 3行。★1文字も 変えないこと。
          ★★ここは「出しません」と 書いてある 行です。
            ★★見張りが 禁じ手の 語を 探すときは、★この 3行を 先に 外すこと
              （★components/tests/_source.js の 但し書き外し）。 */}
      {/* ★★見本は .note を 畳んで います（foldNotes）。 */}
      <Note fold>
        {A03_NOTES.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}
