// ============================================================================
// ★★★公演の 運営 ── ★どの 画面へ 行けるかを 決めるのは ここ だけ です
//
//   ★出どころ  裁定141 ／ 裁定176（作り終えて 隠して 置く）／ 裁定178
//     ／ 見本 `P_koen`（`SC['公演の運営']`）
//        woolsong-2026-09-21_3.zip ／ 00-動く見本-PC・iPad（運営）.html
//        ★2026-09-24 に 確かめ
//
//   ★★★見本の 行き先は 11 あります。★作った ものは その うち 7つ です。
//     ★★★まだ 無い ものを **出しません**（★裁定176 §3）。
//       ★押せない 札は 不具合に 見えます。
//     ★★どれが まだかは `tools/not_wired_yet.json` と ここの 註に 書きます。
//       ★★数えられる ように して おきます ── ★隠す ためでは ありません。
//
//   ★★★出すか 出さないかは `featureOn(features, "koen")` だけ が 決めます。
//     ★鍵が 閉じて いれば、★入口ごと 出しません。
// ============================================================================

import { featureOn } from "@/lib/featureOn";

/** ★機能の 鍵。★字を 2か所に 書きません。 */
export const KOEN_KEY = "koen";

/**
 * ★公演を 作れるか（★入口の 札を 出すか）。
 *
 *   ★★★2つ とも 要ります ──
 *     ① 鍵が 開いて いる（★裁定176）
 *     ② 「公演」の できことを 持って いる（★台帳の `koen_insert` と 同じ）
 *   ★★★判じるのは **ここ 1か所** です（★裁定176 §1「判定は 1か所」）。
 *     ★呼ぶ 側で `featureOn(...) && can(...)` と 書くと、★2か所に なります。
 *     ★★★片方を 直した とき、★もう 片方が 残ります。
 */
export function mayCreateKoen(features, canGyoji) {
  return featureOn(features, KOEN_KEY) && canGyoji === true;
}

/**
 * ★「つぎに すること」（★見本 `P_koen` の st）。
 *
 *   ★★見本は 4つ です ── ★配役 ／ 出演者 ／ 香盤表 ／ 稽古。
 *   ★★★「稽古を 組む」は まだ 作って いません。★出しません。
 *   ★★「済み」の 印は **数** で 決めます。★人が つける ものでは ありません。
 */
export function nextSteps({ words, roleCount, memberCount, rowCount } = {}) {
  const w = words || {};
  return [
    { key: "cast", label: (w.cast_word || "配役") + "を 決める", done: (roleCount || 0) > 0 },
    { key: "invite", label: "出演者を 招く", done: (memberCount || 0) > 1 },
    { key: "sheet", label: (w.tbl_word || "表") + "を 作る", done: (rowCount || 0) > 0 }
  ];
}

/**
 * ★上の 札（★見本 `P_koen` の pills）。
 *
 *   ★★作った ものだけ です。★「当日の 進行」「配る」「稽古の 一覧」は まだ です。
 */
export function tabs(words) {
  const w = words || {};
  return [
    { key: "sheet", label: w.tbl_word || "表" },
    { key: "export", label: "書き出す" },
    { key: "copy", label: "前の 公演から 写す" }
  ];
}

/** ★行の 字（★見本の まま）。 */
export const KOEN_NEXT_HEAD = "つぎに すること";
export const KOEN_DONE = "済み";
export const KOEN_INFO = "公演の 情報・使える 期限";
export const KOEN_UNTIL = " まで";
export const KOEN_EXPIRED = "（過ぎました）";
export const KOEN_NONE = "—";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★2行目が 約束 です ──
 *     「出演者の 体調は、どの 画面からも 見られません。」
 */
export const KOEN_NOTE = Object.freeze([
  "順番は 前後して かまいません。出演者の 体調は、どの 画面からも 見られません。"
]);

/**
 * ★まだ 作って いない 行き先（★見本には あります）。
 *
 *   ★★★ここに 書くのは、★**出さない ことを 数えられる ように する** ため です。
 *     ★この 一覧を 画面に 出しません。★押せない 札を 置きません。
 *   ★★作ったら、★`tabs()` か `nextSteps()` に 足し、★ここから 消します。
 */
// ★★★2026-09-24、★「公演を作る」を **外しました**（★段3a A群）。
//   ★★作って あります（`components/KoenNew.jsx`）。★呼ばれても います
//     （`VocalTracker.jsx` の できごとの 帯。★`mayCreateKoen` が 判じます）。
//   ★★★この 一覧に 残って いると、★2つの 誤りが 起きます ──
//     ★① 記録が 嘘に なる ──「まだ 作って いない」と 書いて あるのに、あります。
//     ★② 見張りが `KoenArea.jsx` に その 字を 出させません。
//       ★★入口を、★在るのに 置けなく なります。
//   ★★「作った」と「届く」は 別 です。★どちらも 済んだら、★ここから 消します。
export const NOT_MADE_YET = Object.freeze([
  "稽古を組む", "稽古の一覧", "配る", "公演の出欠", "当日の進行",
  // ★★★代役を 立てる（★2026-09-24）。
  //   ★画面は できて います（`components/Understudy.jsx`）。
  //   ★★けれど **稽古の 1回**（`koen_sessions`）が 無いと 中身が 出ません ──
  //     ★`koen_understudy_needed(p_session)` が その 番号を 求めます。
  //   ★★★`稽古を組む` が できるまで、★ここから 出しません。
  //     ★押せる のに 中身が 空、は「押せない 札」より たちが 悪い です。
  "代役を立てる"
]);

// ============================================================================
// ★★★公演を 作る ── ★見本 `P_koenNew`（2026-09-24）
//
//   ★出どころ  裁定143（公演を 作る・値段）／ 裁定148（種類）／ 裁定141
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★種類は **台帳** が 持ちます（`koen_kind_words` ／ `koen_kind_check`）。
//     ★ここに 一覧を 写しません。★言葉も 台帳から 引きます。
//
//   ★★★作れるのは「公演（gyoji）」の できことを 渡された 方 だけ です。
//     ★止めるのは 台帳の 決め（`koen_insert`）です。★画面は 先に 隠す だけ。
//
//   ★★★どれを 選んでも、★出演者の 体調は 誰にも 見えません（★裁定141）。
// ============================================================================

/** ★はじめの 段（★いちばん 小さい・無料）。★台帳の 縛りと 同じ 数 です。 */
export const FIRST_TIER = 15;

/**
 * ★作れる 種類（★裁定187・2026-09-24）。
 *
 *   ★★★台帳では 止めません。★止めるのは 機能の 切り替え だけ です。
 *     ★「2027年10月から」を 台帳に 書くと、★誰も 触らなくても その日に 開きます。
 *     ★★★同じ 決めが 2か所に あると、★必ず ずれます。
 *
 *   ★★★切って ある 種類は **一覧に 出しません**。
 *     ★「まだ 使えません」と 並べるのは、★期待させて 断る こと です。
 *
 *   ★★鍵の 名は `koen_<種類>`。★無い 鍵は false ＝ ★出しません
 *     （★`featureOn` の 決め ── ★勝手に 開かない）。
 *   ★★★ただし ── ★鍵が 1つも 無い ときは **ぜんぶ 出します**。
 *     ★種類ごとの 鍵は まだ 台帳に ありません（★2026-09-24 に 数えました）。
 *     ★★「鍵が 無い ＝ ぜんぶ 閉じる」に すると、★公演が 1つも 作れません。
 *     ★★★鍵が 1つでも できた 日から、★その 決めに 従います。
 */
export function kindsToShow(kinds, features) {
  const 並 = Array.isArray(kinds) ? kinds : [];
  const 鍵 = features && typeof features === "object" ? features : {};
  const ある = 並.some((k) => k && Object.prototype.hasOwnProperty.call(鍵, "koen_" + k.kind));
  if (!ある) return 並;
  return 並.filter((k) => featureOn(鍵, "koen_" + k.kind));
}

/** ★作る ときの 形（★見本の 5つ）。 */
export const NEW_FIELDS = Object.freeze([
  { key: "title", label: "題名" },
  // ★★作品は **選びます**（★打ち込みません）。★`works` から 選ぶ ことで、
  //   ★「よく 使われて いる 順」が 育ちます（★`koen_set_work` が 数えます）。
  { key: "work", label: "作品・曲目", pick: true },
  // ★★★`from` は 台帳の `opens_on` です（★名前が ちがう だけ でした）。
  { key: "from", label: "稽古の はじまり", column: "opens_on", date: true },
  // ★★★本番の 日は 列では ありません。★`koen_sessions(kind='show')` の 1行 です。
  { key: "opens_on", label: "本番の 日", session: true, date: true },
  { key: "venue", label: "会場" }
]);

/** ★題名が 無ければ 作れません（★見本の `koenCreate`）。 */
export function canCreate(form) {
  return String((form && form.title) || "").trim() !== "";
}

/**
 * ★台帳に 入れる 形。
 *
 *   ★★`status` は `draft`。★`tier_people` は いちばん 小さい 段。
 *   ★★`owner_user_id` は **必ず** 自分 です（★`koen_insert` の 決め）。
 *   ★★★`from`（稽古の はじまり）と `work`（作品）を 入れる 列が ありません。
 *     ★台帳に その 列が ない から です。★作りません。
 *     ★★「入れた のに 消える」を 作らない ため、★欄も 出しません（★下の `SHOWN_FIELDS`）。
 */
export function toKoenRow(form, { orgId, userId } = {}) {
  return {
    org_id: orgId || null,
    owner_user_id: userId,
    title: String((form && form.title) || "").trim().slice(0, 120),
    kind: (form && form.kind) || "opera",
    venue: String((form && form.venue) || "").trim().slice(0, 120) || null,
    // ★★★`opens_on` は **稽古の はじまり** です（★Opus の 答え・2026-09-24）。
    //   ★見本の「本番の 日」では ありません。★あちらは 稽古の 1行 に なります。
    opens_on: (form && form.from) || null,
    status: "draft",
    tier_people: FIRST_TIER
  };
}

/**
 * ★作った あとに する こと（★1行 ずつ・★順に）。
 *
 *   ★★★`koen` に 入れた だけでは 足りません ──
 *     ★作品 …… `koen_set_work(koen, work)`（★`used_count` も 増えます）
 *     ★本番の 日 …… `koen_set_show_date(koen, date)`（★期限が 決まります）
 *   ★★どちらも **空なら 呼びません**。★空の 行を 作りません。
 */
export function afterCreate(form) {
  const 出 = [];
  if (form && form.workId) 出.push({ fn: "koen_set_work", args: { p_work: form.workId } });
  if (form && form.opens_on) 出.push({ fn: "koen_set_show_date", args: { p_on: form.opens_on } });
  return 出;
}

/**
 * ★いま 出す 欄。
 *
 *   ★★★2026-09-24、★5つ とも 出せる ように なりました（sql/72 ／ Opus の 答え）──
 *     ★稽古の はじまり …… ★`koen.opens_on` が それ でした（★列は 前から あります）
 *     ★本番の 日 …… ★列を 足しません。★`koen_sessions(kind='show')` の 1行 です
 *                     （★`koen_set_show_date()`。★期限は その 日＋30日 に なります）
 *     ★作品・曲目 …… ★`koen.work_id` ＋ `work_title_at` を 足しました
 *                     （★`koen_set_work()`。★作品を 消しても 題名は 残ります）
 *
 *   ★★★はじめ「列が 無い から 欄を 出さない」と しました。
 *     ★それは 正しい 判断 だったと 確かめて いただきました ──
 *     ★★「入力できて 保存時に 消える」は いちばん 危ない 形 です。
 *     ★★★けれど「列が 無い」は 2つ まちがって いました ──
 *       ★稽古の はじまりは **あった**（`opens_on`）。★私は 名前で 探して いました。
 *       ★本番の 日は **列では ない**（★稽古の 1行）。★形が ちがった だけ でした。
 *     ★★次から …… ★「列が 無い」と 言う 前に、★**何の ことか** を 先に 尋ねます。
 */
export const SHOWN_FIELDS = Object.freeze(["title", "work", "from", "opens_on", "venue"]);

export function shownFields() {
  return NEW_FIELDS.filter((f) => SHOWN_FIELDS.includes(f.key));
}

/** ★見本の 言葉（★1字 も 足しません）。 */
// ---------------------------------------------------------------------------
// ★★★出演者の 側の まとめ画面（★見本 `SC['公演']`・★2026-09-24）
//
//   ★★`KoenArea` は **運営の 側**（`P_koen`）です。★こちらは 出演者の 側 です。
//     ★★同じ「公演」でも、★見える ものが ちがいます。
//   ★★★2026-09-24 まで、★出演者の 側の 入口が 1つも ありません でした。
//     ★`KoenMySchedule` も `KoenDayFlow` も 出来て いたのに、
//     ★どこからも 呼ばれて いません でした。
//   ★★見本の 行き先は 5つ。★作って あるのは 2つ です。
//     ★★残り 3つは 出しません（★押せない 札を 置きません）。
// ---------------------------------------------------------------------------

/**
 * ★出演者の 側の 公演を 出して よいか（★2026-09-24）。
 *
 *   ★★見るのは 鍵 だけ です。★役職も できことも 見ません ──
 *     ★出演者に なるのは、★合言葉で 入った 方 です。
 *   ★★閉じて いれば **入口ごと** 出しません（★裁定176 §3）。
 *     ★読み込み中も false です（★`featureOn` の 決め）。
 */
export function mayShowKoenMine(features) {
  return featureOn(features, KOEN_KEY);
}

export const MINE_HEAD = "公演";
export const MINE_EMPTY = "いまは、入って いる 公演が ありません。";
export const MINE_EMPTY_SUB = "合言葉を いただいたら、「公演の 合言葉で 入る」から 入れます。";

/** ★出演者の 側の 行き先（★作って ある ものだけ）。 */
export const MINE_LINKS = Object.freeze([
  { key: "mine", label: "自分の 予定", sub: "あなたが 呼ばれて いる ところだけ" },
  { key: "day", label: "本番の日の 流れ", sub: "入り・楽屋・区切り" }
]);

/**
 * ★出演者の 側で **出して いない** 行き先（★見本 `SC['公演']`）。
 *
 *   ★★`NOT_MADE_YET`（運営の 側）とは 別 です。★混ぜません。
 *   ★★出来たら ここから 消し、★`MINE_LINKS` に 足します。
 */
export const MINE_NOT_MADE_YET = Object.freeze([
  "当日の進行",          // ★運営の 側の 見本 です。★出演者には `本番の日の 流れ` が あります
  "スタッフの自分の予定",  // ★`KoenDayFlow` の 中の 出し分け です。★別の 入口を 作りません
  "カレンダーにつなぐ"     // ★購読の 道が ありません（★2026-09-24・Opus へ お尋ね中）
]);

/**
 * ★出演者の 側の 註（★見本 `SC['公演']` の note）。
 *
 *   ★★★書いたのは 3行 です。★どれも 確かめました ──
 *     ★`koen_calls` の 決まりは「自分の 行 だけ」。★ほかの 方の 集合時刻は 来ません。
 *     ★`koen_room_members` も 同じ です（★`myRoomName` の 覚え書き）。
 *     ★体調の 列は、★公演の どの 表にも ありません（★裁定141）。
 */
export const MINE_NOTES = Object.freeze([
  "ほかの方の 集合時刻は 見えません。ご自分の ものだけ です。",
  "本番の 日の 時刻も、ご自分の 入りと 出番だけ です。",
  "出演者の 体調は、どの 画面からも 見られません。"
]);

/** ★読む 列（★`select('*')` を 書きません）。 */
export const COLS_MINE = "id, koen_id, part, joined_at, left_at";
export const COLS_KOEN_MINE = "id, title, status, opens_on, valid_until";

export const NEW_HEAD = "公演を 作る";
export const NEW_KIND_HEAD = "どんな 公演ですか";
export const NEW_KIND_SUB = "選ぶと、ことばと 表の 形が 決まります。あとから 変えられます（書いたものは 消えません）。";
export const NEW_KIND_ROW = "種類";
export const NEW_KIND_CHANGE = "変える";
export const NEW_PRICE_HEAD = "料金";
export const NEW_PRICE_MAKE = "作るのは";
export const NEW_PRICE_FREE = "無料";
export const NEW_PRICE_15 = "15人まで";
export const NEW_PRICE_15V = "無料の まま";
export const NEW_PRICE_16 = "16人目から";
export const NEW_PRICE_16V = "そのとき お知らせします";
export const NEW_PRICE_NOTE = "キャストと スタッフを 合わせた 人数です。";
export const NEW_NEED_TITLE = "題名を 入れてください";
export const NEW_MADE = "作りました";

/** ★種類を 選ぶ ところの 但し書き（★見本の .note）。 */
export const NEW_KIND_NOTE = Object.freeze([
  "どれを 選んでも、出演者の 体調は 誰にも 見えません。連絡の 窓も 作りません。",
  "いくつもの 種類が 混ざる 公演は「ガラ・発表会・フェス」を 選んでください。合唱団や バンドを 1つの 列に できます。"
]);

/** ★下の 但し書き（★見本の .note）。 */
export const NEW_NOTE = Object.freeze([
  "公演は、行事の 一覧にも 本番の 日だけ 自動で 出ます。",
  "作れるのは「公演」の できことを 渡された方です。"
]);
