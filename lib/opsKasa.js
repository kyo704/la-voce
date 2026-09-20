// ============================================================================
// ★重なり ── ★3つの 姿だけ を しまいます
//   ★見本 `P_kasa`（事務）／ `P_kasaT`（先生）／ `P_kasaFix`（動かす）
//   ★裁定 その108 ③・2026-09-20
//
//   ★★★重なり そのものは しまいません。★`lessons` から 数えます。
//     ★★数える ところは `lib/opsSchedule.js` の `overlapsOf` 1か所 です。
//     ★★ここが 持つのは、★**人が 決めた こと** だけ です。
//
//   ★★★表は 3列 です（★`overlap_notices`）。
//     ★★だから 書けない ことが あります。★`KASA_NOT_YET` に 並べました。
//     ★★★無い ものを、★在る ように 見せません。
//
//   ★見張り components/tests/ops-kasa.test.js
// ============================================================================

// ★★時刻は `lib/opsSchedule.js` から 借ります。★数え方を 2つ 作りません。
//   ★★あちらは ここを 呼びません。★輪に なりません。
import { timeOf } from "@/lib/opsSchedule";

/** ★3つの 姿。★この 3つ だけ です（★台帳の `check` と 同じ）。 */
export const KASA_STATES = Object.freeze(["まだ", "知らせた", "解決"]);

/** ★姿の 字（★見本の `stc`）。 */
export const STATE_LINE = Object.freeze({
  "まだ": "まだ 知らせて いません",
  "知らせた": "先生に 知らせました",
  "解決": "片づきました"
});

/** ★何が ぶつかって いるか（★見本の `k`）。 */
export const KIND_LINE = Object.freeze({ "場所": "同じ 場所", "先生": "同じ 先生" });

/** ★絞りの 札（★見本の `S.kf`）。 */
export const KASA_FILTERS = Object.freeze(["全部", "場所", "先生"]);

/**
 * ★その 重なりの 姿。
 *
 *   ★★1つの 重なりは 2コマ 以上 です。★行も コマごと に 置きます。
 *   ★★★**全部の コマ** が そう なって いる ときだけ、★その 姿に します。
 *     ★★片方 だけ の 行が 残って いても、★勝手に 上がりません。
 *     ★★コマを 動かすと、★動かした ぶんの 行を 消します（★重なりが 消えた ため）。
 *       ★★その とき 相手の 行が 残ります。★消せません（★よその コマ です）。
 *       ★★★残った 1行 だけ で「知らせた」に なると、★嘘に なります。
 */
export function statusOf(notices, lessonIds) {
  const ids = (lessonIds || []).map(String).filter(Boolean);
  if (ids.length === 0) return "まだ";
  const 表 = new Map((notices || [])
    .filter((n) => n && n.lesson_id)
    .map((n) => [String(n.lesson_id), String(n.status || "まだ")]));
  const 皆が = (...姿) => ids.every((id) => 姿.includes(表.get(id)));
  if (皆が("解決")) return "解決";
  if (皆が("知らせた", "解決")) return "知らせた";
  return "まだ";
}

/** ★その 重なりの コマの 番号。 */
export function lessonIdsOf(overlap) {
  return ((overlap && overlap.lessons) || []).map((l) => l && l.id).filter(Boolean);
}

/** ★まだ 片づいて いない 数（★題の 下の 1行に 出します）。 */
export function openCount(overlaps, notices) {
  return (overlaps || [])
    .filter((o) => statusOf(notices, lessonIdsOf(o)) !== "解決").length;
}

/** ★絞った あとの 一覧。★並び替えません（★数えた 順の まま）。 */
export function filterKasa(overlaps, filter) {
  const f = String(filter || "全部");
  return (overlaps || []).filter((o) => f === "全部" || (o && o.kind) === f);
}

/**
 * ★先生の 側に 出す 並び（★見本 `P_kasaT`）。
 *
 *   ★★★先生は、★よその コマを 見られません（★台帳の `can_view_ops`）。
 *     ★★だから **ご自分で 数えられる 重なり** は、★ご自分の コマ どうし だけ です。
 *     ★★同じ 場所を よその 先生と 分け合って いる ときは、★数えようが ありません。
 *   ★★★そこで 2つ から 作ります ──
 *     ①ご自分の コマ どうし の 重なり（★その場で 数えます）
 *     ②事務が「知らせた」を つけた ご自分の コマ（★しるし だけ が 届きます）
 *   ★★★②では、★相手の コマを 出しません。★見えない ものを 書けません。
 *     ★★`KASA_NOT_YET` の `other_side` を ご覧ください。
 *   ★★片づいた もの（`解決`）は 出しません。
 */
export function mineRows({ lessons, overlaps, notices, myId }) {
  const 私 = String(myId || "");
  const 出 = [];
  const 済 = new Set();

  (overlaps || []).forEach((o) => {
    ((o && o.lessons) || []).forEach((l) => {
      if (!l || String(l.teacher_id) !== 私) return;
      const 姿 = statusOf(notices, lessonIdsOf(o));
      if (姿 === "解決") return;
      済.add(String(l.id));
      出.push({
        key: `${o.key}:${l.id}`, lesson: l, kind: o.kind, at: o.at,
        status: 姿, others: (o.lessons || []).filter((x) => x && x.id !== l.id)
      });
    });
  });

  const 私のコマ = new Map((lessons || [])
    .filter((l) => l && String(l.teacher_id) === 私)
    .map((l) => [String(l.id), l]));
  (notices || []).forEach((n) => {
    if (!n || n.status === "解決") return;
    const id = String(n.lesson_id || "");
    if (済.has(id)) return;
    const l = 私のコマ.get(id);
    if (!l) return;
    済.add(id);
    出.push({
      key: `n:${id}`, lesson: l, kind: null, at: timeOf(l),
      status: String(n.status || "まだ"), others: []
    });
  });

  return 出.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.key < b.key ? -1 : 1)));
}

/**
 * ★日程の 札に 出す 数（★決めは ここ 1か所）。
 *
 *   ★★事務は、★その日の 重なりの 数。
 *   ★★★先生は、★ご自分の ぶん の 数 です。
 *     ★★ご自分の コマ どうし の 重なりが 0でも、★事務が 知らせた ぶんが あれば
 *       ★★札を 出します。★出さないと、★入口が ありません。
 */
export function chipCount({ overlaps, notices, lessons, myId, mine }) {
  if (!mine) return (overlaps || []).length;
  return mineRows({ lessons, overlaps, notices, myId }).length;
}

// ---------------------------------------------------------------------------
// ★押せる か どうか（★決めは ここ 1か所。★画面で 判じません）
// ---------------------------------------------------------------------------

/** ★知らせる（★事務）。★何度でも 押せます ── ★姿が 変わる だけ です。 */
export function mayTell(status) { return status !== "解決"; }
/** ★このままで よい（★事務）。 */
export function mayClose(status) { return status !== "解決"; }
/** ★やっぱり 直す（★事務）。★片づけた ものを 戻します。 */
export function mayUndo(status) { return status === "解決"; }

/** ★押した あとの 姿。★戻す 先は 必ず「まだ」です（★下の `KASA_NOT_YET` ①）。 */
export const AFTER_TELL = "知らせた";
export const AFTER_CLOSE = "解決";
export const AFTER_UNDO = "まだ";

// ---------------------------------------------------------------------------
// ★字（★見本の とおり。★画面に 書き写しません）
// ---------------------------------------------------------------------------

export const KASA_HEAD = "重なり";
export const KASA_SUB_TAIL = "印を つけるだけです。自動で 動かしません";
export const KASA_EMPTY = "この 絞りに、重なりは ありません。";
export const KASA_EMPTY_SUB = "「全部」で 全部 出ます。";

export const TELL_LABEL = "担当の 先生に 知らせる";
export const TELL_AGAIN_LABEL = "もう一度 知らせる";
export const CLOSE_LABEL = "このままで よい";
export const UNDO_LABEL = "やっぱり 直す（取り消す）";
export const GO_SCHEDULE_LABEL = "日程で 見る";

/**
 * ★知らせると どうなるか（★見本の 右の 箱）。
 *
 *   ★★★見本の 字を、★そのままは 使えません。
 *     ★★見本は「先生は 3つから 選びます」と 書いて います。
 *     ★★★この 蔵に、★その 答えを しまう ところが ありません（★3列 です）。
 *     ★★だから **いま できる こと だけ** を 書きます。
 */
export const TELL_WHAT_HEAD = "知らせると どうなるか";
export const TELL_WHAT = Object.freeze([
  "両方の 先生の 画面に、この 重なりが 出ます。",
  "先生は ご自分の コマを 動かせます。",
  "動かすと、ここから 消えます。",
  "メールや LINE は 送りません。画面に 出るだけです。"
]);

export const KASA_WHAT_HEAD = "何を 重なりと 見るか";
export const KASA_WHAT = Object.freeze([
  { line: "同じ 時間に、同じ 場所を 違う先生が 使っている", sub: "一番 起きます", show: true },
  { line: "同じ 先生の 時間が 重なっている", sub: "別の 部屋に 同時に 入っています", show: true },
  { line: "同じ 生徒の 時間が 重なっている", sub: "この画面には 出しません。生徒ご本人にだけ", show: false }
]);

export const KASA_NOTES = Object.freeze([
  { text: "部屋の 予約は しません。重なりを 知らせて、動かすのを 助けるところまでです。",
    bold: "部屋の 予約は しません。" },
  { text: "事務が 勝手に 動かしません。動かすのは 先生です。", bold: "事務が 勝手に 動かしません。" },
  { text: "同じ 生徒の 重なりは この画面に 出しません（よそに 通っていることが 漏れます）。", bold: "" }
]);

// ★先生の 側（★見本 `P_kasaT`）。
export const KASA_MINE_SUB_TAIL = "動かすかどうかは、あなたが 決めます";
export const KASA_MINE_EMPTY = "あなたの 重なりは ありません。";
export const KASA_MINE_EMPTY_SUB = "見つかると、ここに 出ます。";
export const MOVE_LABEL = "わたしが 動かします";
export const KASA_MINE_NOTES = Object.freeze([
  { text: "動かすのは、あなたです。事務は 知らせるところまで。勝手に 動かしません。",
    bold: "動かすのは、あなたです。" },
  { text: "「わたしが 動かします」を 押すと、その日の 空いている 枠が 出ます。", bold: "" },
  { text: "理由は 聞きません。体調は どこにも 出てきません。", bold: "" }
]);

// ★動かす 画面（★見本 `P_kasaFix`）。
export const FIX_HEAD = "どこへ 動かしますか";
export const FIX_PICK_HEAD = "まず、マスを 押してください";
export const FIX_PICK_SUB =
  "「空き」の マスを 押すと、ここに 出ます。押しただけでは 動きません。";
export const FIX_HERE_HEAD = "ここへ 動かします";
export const FIX_DO = "ここへ 動かす";
export const FIX_AGAIN = "選び直す";
export const FIX_NOW = "いま ここ";
export const FIX_NOW_SUB = "重なっています";
export const FIX_FREE = "空き";
export const FIX_NONE =
  "動かせる 枠が 1つも ありません。場所を 変えるか、日程で お確かめ ください。";
export const FIX_ROOM_HEAD = "時間は 動かさずに、場所だけ 変える";
export const FIX_ROOM_PUT = "ここに 移す";
export const FIX_ROOM_NOTE = "場所を 変えるだけなら、生徒の 予定は 動きません。";
export const FIX_NOTES = Object.freeze([
  { text: "週の 表で 選びます。文字の 一覧では、いつが 空いているのか 分かりません。",
    bold: "週の 表で 選びます。" },
  { text: "その生徒が 来られる 時間だけ「空き」に なります。", bold: "" },
  { text: "空いている 部屋を こちらで 探しません。候補を 出すだけです。", bold: "" }
]);

/** ★押す 前の 確かめ（★相手の 予定も 動く ため・★`putAsk` と 同じ 形）。 */
export function moveAsk({ dateISO, period, place }) {
  const 日 = String(dateISO || "").slice(5).replace("-", "月") + "日";
  const 所 = place ? `　${place}` : "";
  return `${日}　${(period && period.name) || ""}${所} に 動かします。`;
}
export const MOVE_ASK_NOTE = "生徒の 予定も 動きます。よろしければ 押して ください。";

/**
 * ★動かせる 枠（★`openSlots` を 使います。★2つ 作りません）。
 *
 *   ★★いま 入って いる 枠は 出しません（★そこへは 動かせません）。
 *   ★★`openSlots` の 決め ── ★その方が 来られて、★空いて いて、
 *     ★先生の 予定が 入って いない 枠 だけ。
 */
export function moveTargets(openSlotsFn, opts, lesson, timeOfMin) {
  const 枠 = openSlotsFn(opts) || [];
  const 元日 = lesson && lesson.scheduled_at ? String(lesson.scheduled_at) : "";
  const 元分 = 元日 && timeOfMin ? timeOfMin(元日) : null;
  const 元の日 = 元日 && opts && Array.isArray(opts.days)
    ? opts.days.find((d) => String(元日).startsWith(d)) || "" : "";
  return 枠.filter((s) => !(元の日 && s.dateISO === 元の日
    && 元分 !== null && s.period && s.period.start_min === 元分));
}

// ---------------------------------------------------------------------------
// ★見本に ある のに、★置いて いない もの（★3列 だから です）
// ---------------------------------------------------------------------------
//   ★★★引き金 ── ★`overlap_notices` に 列を 足す と 決めた 日。
//     ★★そのとき この 並びを 見て、★1つずつ 戻して ください。
//     ★★台帳 docs/ledgers/08-保留している決め.md 08-27

export const KASA_NOT_YET = Object.freeze([
  {
    key: "told_by",
    line: "知らせました　9月9日 9:15　田村 まこと（事務長）",
    why: "いつ・誰が 知らせたか を しまう 列が ありません（3列 です）",
    needs: "`overlap_notices` に `told_at` と `told_by` を 足す、という お決め"
  },
  {
    key: "closed_by",
    line: "片づけた人　田村 まこと　取り消せます",
    why: "誰が 片づけたか を しまう 列が ありません",
    needs: "`overlap_notices` に `closed_by` を 足す、という お決め"
  },
  {
    key: "teacher_answer",
    line: "先生は 3つから 選びます（動かします／動かせません／事務に お願いする）",
    why: "先生ごとの 答えを しまう ところが ありません。動かす こと だけ が 残ります",
    needs: "先生ごとの 答えの 表、という お決め"
  },
  {
    key: "other_side",
    line: "② 渡辺 たける　アンサンブル（12人）",
    why: "先生は よその コマを 読めません。相手の 中身を 出す 道が ありません",
    needs: "重なりの 片割れ だけ を 返す 仕掛け、という お決め"
  },
  {
    key: "both_no",
    line: "両方が「動かせません」なら、事務が 引き取ります",
    why: "答えを しまわないので、両方が そう 答えた ことが 分かりません",
    needs: "上の `teacher_answer` と 同じ お決め"
  }
]);
