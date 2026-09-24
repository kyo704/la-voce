// ============================================================================
// ★★★本番の 日の 流れ ／ 自分の 予定（出演者・スタッフ）── ★決めは ここ だけ
//
//   ★出どころ  裁定148 Q6（スタッフには 自分が 呼ばれた 区切りだけ）／ 裁定178
//     ／ 見本 `SC['本番の日の流れ']` `SC['スタッフの自分の予定']` `SC['公演の自分の予定']`
//        woolsong-2026-09-21_1.zip
//        00-動く見本-iPhoneで開く用.html（md5 67c56244）
//        00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-24 に 確かめ
//
//   ★★★出演者は **ぜんぶ** 見えます。★自分の ところだけ 濃く。
//     ★スタッフは **自分の 区切りだけ** 見えます（★裁定148 Q6）。
//     ★★どちらかは **台帳** が 決めます（`my_runsheet`）。★画面では 決めません。
//
//   ★★★ほかの 方の 入りの 時刻は 出しません。★体調の ことも 出しません。
//     ★`my_runsheet` は ほかの 方の 時刻を 返しません。★求める 形も 作りません。
//
//   ★★★時刻が 変わったら 画面が 変わります。★お知らせは 送りません（★催促しない）。
// ============================================================================

/** ★台帳の 行を 画面の 形に します。★並べ替えません（★台帳が 並べて います）。 */
export function dayRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    time: hhmm(r.at_time),
    what: r.what || "",
    who: r.who || "",
    mine: r.mine === true
  }));
}

/** ★"13:00:00" → "13:00"。★読めなければ その まま。 */
export function hhmm(v) {
  const s = String(v == null ? "" : v);
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? m[1].padStart(2, "0") + ":" + m[2] : s;
}

/**
 * ★自分の 入り（★いちばん はやい「自分の」区切り）。
 *
 *   ★★★ほかの 方の 入りは 出しません。★`mine` の 行 だけ を 見ます。
 *   ★★1つも 無ければ null。★「―」も 出しません ── ★呼ばれて いない だけ です。
 */
export function myCallTime(rows) {
  const 自 = (Array.isArray(rows) ? rows : []).filter((r) => r && r.mine && r.time);
  if (自.length === 0) return null;
  return 自.slice().sort((a, b) => String(a.time).localeCompare(String(b.time)))[0].time;
}

/** ★呼ばれて いる 区切りが 1つでも あるか。 */
export function hasAny(rows) {
  return (Array.isArray(rows) ? rows : []).some((r) => r && r.mine);
}

/** ★稽古の 予定（`my_koen_schedule`）を 画面の 形に します。 */
export function scheduleRows(rows, koenId) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && (!koenId || r.koen_id === koenId) && !r.canceled)
    .map((r) => ({
      id: r.session_id,
      kind: r.kind || "",
      startsAt: r.starts_at,
      callAt: r.call_at,
      dismissAt: r.dismiss_at,
      place: r.place || "",
      rowsLabel: r.rows_label || ""
    }));
}

/**
 * ★自分の 楽屋。
 *
 *   ★★★自分の 行 だけ を 見ます。★ほかの 方が どこかは 出しません。
 *     ★台帳（`koen_room_members`）は 自分の 行しか 返しません（★決めで 止めます）。
 *   ★★無ければ null。★「―」も 出しません ── ★決まって いない だけ です。
 */
export function myRoomName(rooms, members, myMemberId) {
  if (!myMemberId) return null;
  const 行 = (Array.isArray(members) ? members : [])
    .find((x) => x && x.member_id === myMemberId);
  if (!行) return null;
  const 部 = (Array.isArray(rooms) ? rooms : []).find((r) => r && r.id === 行.room_id);
  return 部 ? (部.name || null) : null;
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const DAY_HEAD = "本番の日の 流れ";
/**
 * ★呼ばれて いる 行に 添える 字（★見本 `SC['当日の進行を見る']`・★2026-09-24）。
 *
 *   ★★★見本は **呼ばれて いる ほう**に 字を 置きます ──「あなたも」。
 *     ★★これまでは 逆 でした ── ★呼ばれて いない 行 ぜんぶに
 *       ★「あなたは 呼ばれていません」と 並んで いました。
 *     ★★★6行の 進行の うち 2行しか 出番が 無い 方の 画面には、
 *       ★★「呼ばれていません」が **4回** 並びます。
 *     ★★薄さで すでに 言って います。★註でも 言って います
 *       （「薄い 行は、あなたが 呼ばれていない ところです。」）。
 *       ★★3度 言う 必要は ありません。★2度目・3度目は 責める 字に なります。
 *   ★★`DAY_NOT_CALLED` は 消しません ── ★呼ばれて いる 行が
 *     ★**1つも 無い** ときに、★1度だけ 出します。
 */
export const DAY_ALSO_YOU = "あなたも";
// ★★★2026-09-24・design-v44 ── ★見本は **2つに 分けて** います。
//   `SC['本番の日の流れ']`（出演者）…「あなたは 呼ばれていません」
//   `SC['スタッフの自分の予定']`  …「この 日は 呼ばれていません」
// ★★同じ 一枚が 両方を 描きます（`KoenDayFlow`）。★だから 字も 2つ 持ちます。
//   ★★出演者には「あなた」と 申し上げます ── ★出番の 話 だから です。
//   ★★スタッフには「この 日」と 申し上げます ── ★区切りの 話 だから です。
export const DAY_NOT_CALLED = "あなたは 呼ばれていません";
export const DAY_NOT_CALLED_STAFF = "この 日は 呼ばれていません";
export const DAY_MY_CALL = "あなたの 入り";
export const DAY_GO_MINE = "自分の 呼び出しを 見る";
export const DAY_ROOM = "楽屋";
export const DAY_NOTE = Object.freeze([
  "薄い 行は、あなたが 呼ばれていない ところです。",
  "ほかの 方の 入りの 時刻は 出ません。体調の ことも 出ません。",
  "時刻が 変わったら、この 画面が 変わります（お知らせは 送りません）。"
]);

export const MINE_HEAD = "自分の 予定";
export const MINE_NONE = "いまは 呼ばれている 稽古が ありません";
export const MINE_PAPER = "紙に 出す";
export const MINE_PAPER_WHY = "入りと 出番だけの 1枚";
export const STAFF_PAPER_WHY = "区切りと 場所だけの 1枚";
export const MINE_MEET = " 集合";
export const MINE_NOTE = Object.freeze([
  "ここに 出るのは あなたが 呼ばれている ところだけです。",
  "ほかの 出演者の 予定は 出ません。体調の ことも 出ません。"
]);

export const STAFF_PLACE = "場所";
export const STAFF_DAY = "その日";
/**
 * ★スタッフの 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★2行目が 裁定148 Q6 の かなめ です ──
 *     「ほかの スタッフの 時刻も、出演者の 出番も 出ません。」
 *     ★★スタッフには **出番** を 見せません。★区切り だけ です。
 */
export const STAFF_NOTE = Object.freeze([
  "ここに 出るのは あなたが 呼ばれた 区切りだけです。",
  "ほかの スタッフの 時刻も、出演者の 出番も 出ません。体調の ことも 出ません。",
  "区切りが 変わったら、この画面が 変わります（お知らせは 送りません）。"
]);
