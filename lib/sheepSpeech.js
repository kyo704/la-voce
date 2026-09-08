import data from "@/docs/assets/serifu-add-70.json";

// ============================================================================
// 羊の しゃべり方 ── ②あいづち と ③ひとりごと（2026-09-08 夜）
//
//   ★出どころ woolsong-仕様-羊のしゃべり方・3本に分ける（9月8日）
//             serifu-add-68.json（★70文・J1 12／J2 8／J3 8／K 42）
//
//   ★★3本に 分ける、という 仕様です。
//     ① 今日のことば　1日1つ・上の帯　　　　　★台詞集157文（★未実装。下に書きます）
//     ② あいづち　　　操作した直後・3.0秒　　　★ここで 作ります
//     ③ ひとりごと　　ながめている間・2.5秒　　★ここで 作ります
//
//   ★★①は、★まだ ありません。
//     ★上の帯の「きょうも 来てくれて ありがとう」は、★1文の 決め打ちです。
//     ★台詞集157文は、★文書（docs/opus/lavoce-台詞集…）の ままで、
//     ★★データに なっていません。★157文を 1文も 変えずに 移す作業が 要ります。
//     ★仕様の ⑦「作るもの」にも、★①は 入っていません（★有る前提でした）。
//
//   ★★中身の線（★動かしません）
//     ★羊は「★記録した行為」に 反応します。「★記録の中身」には 反応しません。
//       ✕「きょうは 調子が よさそうですね」
//       ○「かきましたね。」「ここに あります。」
//     ★反応してよい　服・部屋・持ちもの・天気・時刻・季節・自分の生活
//     ★反応しない　　体調・声・記録の中身・続けた日数
//     ★★羊の顔の 禁じられていること 7番と、★同じ線です
//       （★2026-09-08、★坂本さんに 確かめて いただきました）。
//
//   ★★禁止語（★台詞集 §1 のまま）
//     がんばって／えらい／すごい／だいじょうぶ／ひさしぶり／待っていました／
//     そろそろ／まだ／はやく／つづけて／したほうがいい
//
//   ★見張り components/tests/sheep-speech.test.js
// ============================================================================

/** ★足した70文。★id は 変えないこと（★直すときは 新しい id を作ります）。 */
export const LINES = Object.freeze(data.items);

/** ★型。★J は 操作の直後、★K は ひとりごと。 */
export const SAVED = "J1";      // ★記録を保存した直後
export const RECEIVED = "J2";   // ★てんで もらった直後
export const TIDIED = "J3";     // ★片づけ・もようがえの直後
export const SOLO = "K";        // ★ひとりごと

/** ★操作の直後に出す 3つ（★②あいづち）。 */
export const REPLY_TYPES = Object.freeze([SAVED, RECEIVED, TIDIED]);

/**
 * ★吹き出しの 間（★仕様 §③）。
 *
 *   ★★②は 3.0秒、★③は 2.5秒。★どちらも 0.3秒で 消えます。
 *   ★★ひとりごとは 45〜90秒に1回。★ばらつかせます。
 */
export const TIMING = Object.freeze({
  replyMs: 3000,
  soloMs: 2500,
  fadeMs: 300,
  riseMs: 180,
  soloMinMs: 45000,
  soloMaxMs: 90000
});

/**
 * ★顔との 対（★仕様 ⑦-4）。
 *
 *   ★★②は 03 にっこり／04 大喜び／09 照れ。
 *   ★★③は 01 通常／02 まばたき／07 眠い。
 *   ★★かなしい顔は ありません。★作らない、と 決まっています。
 */
export const FACE_FOR = Object.freeze({
  J1: "smile",     // ★書いたことに 応えます
  J2: "joy",       // ★もらった ときです
  J3: "shy",       // ★片づけた ときです
  K: "normal"      // ★ひとりごとは 通常。★まばたきは 別に 動いています
});

/** ★直近いくつを 避けるか（★短い文は 繰り返しが すぐ ばれます）。 */
export const AVOID_RECENT = 5;

/** ★同時に 2つ 出しません。★②が 出ているあいだは ③を 止めます。 */
export const ONE_AT_A_TIME = true;

/**
 * ★その型の 文を、★1つ えらびます。
 *
 *   ★★直近5つは 出しません。
 *     ★避けきれない（★型の在庫が 5つ以下）ときは、★いちばん古いものを 出します。
 *     ★★黙りません。★出せるものが 無い、を 作らないこと。
 *
 *   ★★時刻の条件（when.hour）が あるものは、★その時間だけ。
 *     ★条件の無いものは、★いつでも 出せます。
 *
 *   @param type   型（J1／J2／J3／K）
 *   @param recent 直近に出した id（★新しいものが 先）
 *   @param hour   いまの時（0〜23。★渡さなければ 時刻の条件を 見ません）
 *   @param random 0〜1（★試すときに 差し替えられます）
 */
export function pickLine(type, recent, hour, random) {
  const hist = Array.isArray(recent) ? recent.slice(0, AVOID_RECENT) : [];
  const all = LINES.filter((l) => l.type === type && fitsHour(l, hour));
  if (all.length === 0) return null;
  const fresh = all.filter((l) => !hist.includes(l.id));
  const pool = fresh.length > 0 ? fresh : all;
  const r = typeof random === "function" ? random() : Math.random();
  return pool[Math.floor(r * pool.length) % pool.length];
}

/** ★時刻の条件に 合うか。★条件が無ければ、いつでも 合います。 */
function fitsHour(line, hour) {
  const w = line && line.when;
  const h = w && w.hour;
  if (!h) return true;
  if (typeof hour !== "number") return false;
  if (Array.isArray(h)) return hour >= h[0] && hour <= h[1];
  return true;
}

/** ★つぎの ひとりごとまでの 間（ミリ秒）。 */
export function nextSoloMs(random) {
  const r = typeof random === "function" ? random() : Math.random();
  return TIMING.soloMinMs + r * (TIMING.soloMaxMs - TIMING.soloMinMs);
}

/** ★出したものを、★直近に 積みます（★履歴には 残しません）。 */
export function pushRecent(recent, id) {
  const list = Array.isArray(recent) ? recent : [];
  if (!id) return list;
  return [id, ...list.filter((x) => x !== id)].slice(0, AVOID_RECENT);
}
