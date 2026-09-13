"use client";

import { useState } from "react";
import { C, CONCERN_STEPS } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, rem } from "@/lib/uiKit";
import {
  ScreenHead, HeadRound, Card, Seg, Pill, Warn, Note, BarRow, Li, Btn, Two, EmptyBox
} from "@/components/UiV2";
import LookBackPanel from "@/components/LookBackPanel";
import { LOOK_BACK_FIELDS, hardDays, lookBackableDays } from "@/lib/lookBack";
import { PERIODS, LINE_UP_NOTE, LINE_UP_STACK_NOTE, datesBack } from "@/lib/lineUp";
import LineUpChart from "@/components/LineUpChart";
import { tx } from "@/lib/t";
import { SYMPTOM_LOCATION } from "@/lib/symptomLocations";
import { isLaterWritten } from "@/lib/entrySource";
import CompareV2 from "@/components/CompareV2";
import CountV2 from "@/components/CountV2";
import { tabIsOpen, quietReason } from "@/lib/quietDays";

// ============================================================================
// 「ふりかえる」の画面（見本④⑤ ／ 2026-09-09）
//
//   ★★見本の 決まり
//     ★★「文章を添えません。★確率も割合も出しません。」
//     ★一色の 濃淡だけです。★値で 色を 変えません。
//     ★書いていない日は、★空けます。★0 として 描きません。
//
//   ★★「さかのぼる」は、★前からある C1 を そのまま 使います。
//     ★★作り直しません。★同じものを 2つ 持つと、★片方だけ 直ります。
//     ★足したのは、★どの日から さかのぼれるか、だけです（★lib/lookBack.js）。
//
//   ★★「くらべる」「かぞえる」は、★まだ 置きません。
//     ★見本が 届いていません。★押せるのに 何も 起きないものを 出さないため。
//
//   ★数と 言葉は lib/lineUp.js と lib/lookBack.js が 持ちます。
//
//   ★見張り components/tests/line-up.test.js
// ============================================================================

// ★★大きさ・間・色は lib/uiKit.js と lib/tokens.js が 持ちます（★design.zip）。
//   ★ここで 決めません。
const small = { ...TYPE.note, lineHeight: 1.7 };

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

/** ★一色の 濃淡の 帯（★見本④）。★値の 数字を 添えません。 */
function Bars({ title, rows, tint, entries, foot }) {
  if (!rows) return null;
  // ★★あとから書いた日が 1日でも あれば、★凡例を 出します（★見本⑫）。
  //   ★1日も 無ければ 出しません。★読む人に、要らない断りを 増やしません。
  const anyLater = (entries || rows) &&
    rows.some((r) => isLaterWritten(((entries || {})[r.date] || {}).source));
  return (
    <Card>
      {/* ★★見本④の .mini（★11.5px・ink2）。 */}
      <div style={{ ...TYPE.mini, marginBottom: 8 }}>{title}</div>
      {rows.map((r) => (
        // ★★長さも 濃さも、★同じ1つの 値から 作ります（★UiV2 の BarRow）。
        //   ★2つの 見え方に 分けると、★2つのことを 言ったことに なります。
        //
        // ★★あとから書いた日は、★中を 抜きます（★見本⑫の ○）。
        //   ★★消しません。★同じ長さで、★同じ所に 出ます。
        //     ★「目では見えますが、判定には 入れていません」（★見本⑫）。
        //   ★決めるのは lib/entrySource.js だけです。★ここで 決めません。
        <BarRow key={r.date} label={mmdd(r.date)} tint={tint} ratio={r.density}
          hollow={isLaterWritten(((entries || {})[r.date] || {}).source)} />
      ))}
      {/* ★★目もりの 断り（★見本の「4〜9時間」）。★渡されたときだけ 出します。 */}
      {foot ? (
        <p style={{ ...small, marginTop: 6, textAlign: "right" }}>{foot}</p>
      ) : null}
      {/* ★★凡例（★見本⑫）。★あとから書いた日が あるときだけ 出します。 */}
      {anyLater ? (
        <p style={{ ...small, marginTop: 8 }}>
          ○は あとから書いた日です。目では見えますが、判定には 入れていません。
        </p>
      ) : null}
    </Card>
  );
}

/**
 * ★「気になったこと」の 升目（★見本④）。
 *
 *   ★★書いたか、書いていないか、の 2つだけです。★強さを 出しません。
 *     ★★強さを 出すと、★「ひどい日」を こちらが 決めることに なります。
 *   ★★数えません。★「7日中5日」と 書きません。★割合を 出さないためです。
 *   ★1つも 書かれていなければ、★升目ごと 出しません。
 */
function Symptoms({ entries, dates }) {
  // ★★見本④の 升目（.cal）── ★7つずつ 並べ、★1色の 濃淡 3段で 塗ります。
  //   ★出どころ tokens.md §1-4「気になったこと ★#EFE7D6 → #E3CDD2 → #D7AFB7（3段）」
  //
  //   ★★前は、★1日 1行・症状ごとに 縦の 帯を 出していました。
  //     ★見本④は、★7つずつの 升目 1枚です。★そちらに 合わせます。
  //
  //   ★★3段は「強さ」では ありません。★<b>書いた 場所の 数</b>です。
  //     ★★強さを 出すと、★「ひどい日」を こちらが 決めることに なります。
  //     ★場所が 1つの日と 3つの日は、★ご本人が 書き分けた ちがいです。
  //   ★★数字を 添えません。★「7日中5日」と 書きません。
  const rows = dates.map((d) => ({
    date: d,
    n: (((entries[d] || {}).throatSymptoms) || []).length
  }));
  if (rows.every((r) => r.n === 0)) return null;
  return (
    <Card>
      <div style={{ ...TYPE.mini, marginBottom: 8 }}>気になったこと</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {rows.map((r) => (
          <span key={r.date}
            title={`${mmdd(r.date)}${r.n > 0 ? "　書いた日" : ""}`}
            style={{
              display: "block", height: 16, borderRadius: 3,
              background: CONCERN_STEPS[Math.min(r.n, CONCERN_STEPS.length - 1)]
            }} />
        ))}
      </div>
      {/* ★★何の升目かを 書きます。★色の 意味を 当てさせないこと。 */}
      <p style={{ ...small, marginTop: 8 }}>
        {dates.length > 0 ? `${mmdd(dates[0])} から ${mmdd(dates[dates.length - 1])}　濃いほど、書いた 場所が 多い日です。` : ""}
      </p>
    </Card>
  );
}

/**
 * ★お休みの 画面（★見本 B04）。
 *
 *   ★★くらべる と かぞえる の 2か所に、★同じものを 書いていました。
 *     ★★この 製品で 何度も 直してきた 形です。★1つに します。
 *   ★★出すか どうかを 決めるのは lib/quietDays.js だけです。★ここでは 決めません。
 */
function QuietScreen({ reason, onGo }) {
  // ★★枠だけの ボタンは 共通の 部品です（★見本 .btn.g）。★写しを 置きません。
  const q = reason;
  return (
    <>
      {/* ★★見本 B04 は、★上を 120px 空けて、★真ん中に 1枚 置きます。 */}
      <div style={{ height: 120 }} />
      <Card style={{ textAlign: "center", padding: "22px 16px" }}>
        <div style={{ fontSize: rem(15), color: C.ink, lineHeight: 1.9 }}>
          くらべる と かぞえる は、<br />いまは お休みです。
        </div>
        {q ? (
          <div style={{ ...TYPE.usual, marginTop: 12, lineHeight: 1.9 }}>
            {/* ★★「あと◯日」は、★ご本人が 入れた 予定までの 日数です。
                ★ごほうびへの 残りでは ありません。★事実の 表示です。 */}
            {q.daysUntil > 0
              ? `${Number(q.performedOn.slice(5, 7))}月${Number(q.performedOn.slice(8, 10))}日の 本番まで あと${q.daysUntil}日です。`
              : `${Number(q.performedOn.slice(5, 7))}月${Number(q.performedOn.slice(8, 10))}日の 本番のあとです。`}
            <br />本番の 翌々日から、また 出ます。
          </div>
        ) : null}
      </Card>
      {/* ★★見本は .note を 畳んでいます（foldNotes・★2026-09-11 夜の 訂正）。
          ★★畳むのは .note だけです。★図の 見方（見本の .usu）は 畳みません。
            ★★畳むと、★図の 色や 印の 意味が 分からなく なります。 */}
      <Note fold style={{ textAlign: "center", margin: "6px 0 16px" }}>
        並べる と さかのぼる は、いつでも 見られます。<br />
        記録も、いつもどおり 書けます。
      </Note>
      {/* ★★見本 restBlock は .two（横に 2つ）です。 */}
      <Two>
        <Btn ghost onClick={() => onGo("narabe")} style={{ flex: 1 }}>並べるを 見る</Btn>
        <Btn ghost onClick={() => onGo("sakanobore")} style={{ flex: 1 }}>さかのぼるを 見る</Btn>
      </Two>
    </>
  );
}

export default function LookBackV2({ entries, todayISO, notOutDays, performanceDays, onOpenMore }) {
  const [tab, setTab] = useState("narabe");
  // ★★くらべる の 中の「順番」は、★画面ごと 入れ替わります（★見本 push('順番')）。
  //   ★★見本は 1枚の 画面です。★頭（ふりかえる）も 4つの 札も 出ません。
  //   ★★2026-09-11、★比較画像で 入れ子に なっていました。
  //     ★だから、★開いているかを ここで 持ちます。
  const [orderOpen, setOrderOpen] = useState(false);
  const [periodKey, setPeriodKey] = useState("14d");

  const period = PERIODS.find((p) => p.key === periodKey) || PERIODS[0];
  const dates = datesBack(todayISO, period.days);
  // ★★「かぞえる」は、★書いた ぶん ぜんぶを 見ます（★見本 B03）。
  //   ★ならべる の 窓（14日・4週・3か月）とは 別です。
  //   ★きょうより 先の 日は 入れません。
  const allDates = Object.keys(entries || {}).filter((d) => d <= todayISO).sort();

  // ★★押しどころの 形は UiV2 が 持ちます。★ここで 作りません（★design.zip）。
  const chip = (on) => ({
    minHeight: SPACE.tapMin, padding: "0 14px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? "#FFFDF8" : C.inkSoft, fontSize: rem(11.5)
  });

  // ★★順番の 画面は、★1枚の 画面です（★見本 SC['順番']）。
  //   ★★頭（ふりかえる）も、★4つの 札も 出しません。
  //     ★見本の push() は、★画面を 積み替えます。★中に 入れません。
  //   ★★戻る「‹ くらべる」は、★くらべる の 中に あります。
  if (orderOpen && tab === "kuraberu") {
    return (
      <div className="reference-ui">
        <CompareV2 entries={entries} dates={dates}
          stacked onStack={setOrderOpen} />
      </div>
    );
  }

  return (
    <div>
      {/* ★★見本 .hd。★ゴシック 17px。★明朝を 使いません（tokens.md §2）。
          ★★歯車について。★見本の 中で 揺れています ──
            ★A04・A05 に 歯車は ありません。★B01〜B04 には あります。
            ★★同じ 画面なので、★どちらかに 決めるしか ありません。
            ★★4枚（B群）が 出しているので、★出す ほうを 採ります。
              ★歯車は「もっと」への 入口です。★塞ぐと 行き場が 減ります。 */}
      <ScreenHead title="ふりかえる" right={
        onOpenMore ? <HeadRound mark="⚙" label="もっとを開く" onClick={onOpenMore} /> : null
      } />

      {/* ★★切替（★見本④⑤ .seg）。★4つを 横に 並べます。★流れません。
          ★★但し書き（.warn）は、★ここより 下です。
            ★★見本の S_furi は、★hd → seg → 各タブ の 順で 組み立て、
              ★.warn は narabe() と kuraberu() の 中に あります。
            ★★さかのぼる と かぞえる には、★.warn が ありません。
            ★★2026-09-11、★比較画像で 上下が 逆に なっていました。 */}
      <Seg activeKey={tab} onSelect={setTab}
        items={[
          // ★★見本は 漢字の「並べる」です（★S_furi の seg）。
          //   ★★2026-09-11、★比較画像で ひらがなに なっていました。
          //   ★★鍵（narabe）は そのままです。★覚えた ものが 外れません。
          { key: "narabe", label: "並べる" },
          { key: "sakanobore", label: "さかのぼる" },
          { key: "kuraberu", label: "くらべる" },
          { key: "kazoeru", label: "かぞえる" }
        ]} />

      {tab === "narabe" && (
        <>
          {/* ★★見本④の 但し書き（.warn）。★1文字も 変えないこと。
              ★★飾りでは ありません。★この画面が 何を していないかの 断りです。 */}
          <Warn>{LINE_UP_NOTE}</Warn>
          {/* ★★期間（★見本④ .pill）。★あいだ 6px・下に 11px。 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
            {PERIODS.map((p) => (
              <Pill key={p.key} on={periodKey === p.key} onClick={() => setPeriodKey(p.key)}>
                {p.label}
              </Pill>
            ))}
          </div>
          {/* ★★同じ 日付の 軸に、★上下に 並べます。★これが この画面の 仕事です。 */}
          {dates.some((date) => entries && entries[date]) ? (
            <Card>
              <LineUpChart entries={entries} dates={dates} />
            </Card>
          ) : (
            <EmptyBox
              title="まだ、並べる ものが ありません。"
              sub="記録を 2日ぶん 書くと、ここに 縦に 並びはじめます。" />
          )}

          {/* ★★何を している 画面かを、★下に 3行 置きます（★見本の .note）。
              ★★見本は これを 畳んでいます（foldNotes）。 */}
          <Note fold>
            {LINE_UP_STACK_NOTE.map((line, i) => (
              <span key={i}>{i > 0 ? <br /> : null}{line}</span>
            ))}
          </Note>
        </>
      )}

      {tab === "sakanobore" && (() => {
        // ★★前からある C1 を、そのまま 使います（★components/LookBackPanel.jsx）。
        //   ★足したのは、★どの日から さかのぼれるか、だけです。
        //   ★★本番で「出なかった」日と、★その日を「出づらい」と 書いた日。
        //     ★見本⑤は 後者です。★どちらも 要ります。★1つに しません。
        const days = lookBackableDays(notOutDays, hardDays(entries, todayISO, period.days));
        if (days.length === 0) {
          // ★★共通の 部品です（★見本 stateBlock・797行）。★写しを 置きません。
          //   ★★字も 見本の ものに そろえました。★私が 書いた 字では ありません。
          //     ★前　「「出づらい」と書いた日が、この期間にはありません。」
          //     ★見本「まだ、出づらいと 書いた日が ありません。」
          //         ＋「記録の「声の 出来」に △出づらい を つけた日が、ここに 並びます。」
          //   ★★何が あれば 出るかを 1行 書きます。★白紙に しません。
          return (
            <EmptyBox
              title="まだ、出づらいと 書いた日が ありません。"
              sub="記録の「声の 出来」に △出づらい を つけた日が、ここに 並びます。" />
          );
        }
        // ★★2026-09-11、★見本 SC['前3日'] の 形に しました。
        //   ★★fields を 渡しません。★渡すと 古い 24項目の 形に なります。
        //   ★前から ある 画面（★VocalTracker の notOutDays）は、
        //     ★これまでどおり fields を 渡して 動きます。
        return <LookBackPanel dates={days} entries={entries} />;
      })()}

      {tab === "kuraberu" && (() => {
        // ★★本番の 前後は お休みです（★見本⑮・査読 §1）。
        //   ★★「あなたは こうです」と 言う 2つだけを 休みます。
        //   ★ならべる と さかのぼる は、★いつでも 見られます。
        //   ★決めるのは lib/quietDays.js だけです。★ここで 日を 数えません。
        if (!tabIsOpen("kuraberu", todayISO, performanceDays)) {
          const q = quietReason(todayISO, performanceDays);
          return <QuietScreen reason={q} onGo={setTab} />;
        }
        return (
          <CompareV2 entries={entries} dates={dates}
            stacked={orderOpen} onStack={setOrderOpen} />
        );
      })()}

      {tab === "kazoeru" && (() => {
        // ★★かぞえる も、★本番の前後は お休みです（★見本⑮）。
        //   ★★「あなたの ふだんは これです」も、★言い当てる ことばです。
        if (!tabIsOpen("kazoeru", todayISO, performanceDays)) {
          const q = quietReason(todayISO, performanceDays);
          return <QuietScreen reason={q} onGo={setTab} />;
        }
        // ★★2026-09-10、★ここが ③と 同じ形の 穴でした。
        //   ★★かぞえる に、★ならべる の 窓（★既定 14日）を 渡していました。
        //     ★★けれど 期間の 札は、★ならべる のときにしか 出ません。
        //     ★★だから かぞえる は、★いつも 14日 だけを 見ており、
        //       ★その 窓を 変える 手が、★画面に 1つも ありませんでした。
        //   ★★「ふだん」は 5日 いります。★14日中 5日 書いていない 項目は、
        //     ★何年 書きつづけても 出ません。
        //   ★★見本 B03 は「書いた 日 54日」「…（54日）」です。
        //     ★かぞえる は、★書いた ぶん ぜんぶを 見る 画面です。
        //   ★→ ★窓を 外しました。★書いた 日 ぜんぶを 渡します。
        return <CountV2 entries={entries} dates={allDates} todayISO={todayISO} />;
      })()}
    </div>
  );
}
