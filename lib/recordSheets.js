// ============================================================================
// 記録の 入力シート ── 決めごと 1か所（★見本 SH['ねむり'] ほか）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     SH['ねむり'] ／ SH['こえ'] ／ SH['karada'] ／ SH['tabe'] ／
//     SH['honban'] ／ SH['hito']
//
//   ★★見本の 記録の 画面は、★「＋の 行を 押すと 下から シートが 出る」形です。
//     ★いままで、★押しても 何も 起きませんでした。
//
//   ★★この一枚が 持つのは、★何を 聞くか と、★但し書きの 言葉だけです。
//     ★どの 欄に しまうかは、★これまでどおり entryToRow が 決めます。
//     ★★新しい 欄を 作りません。
// ============================================================================

/**
 * ★本番以外で 声を使った 時間（★SH['こえ']）。
 *
 *   ★★見本の 4つと、★いまの SPEECH_MINUTE_CHOICES は 同じです。
 *     15分 ／ 30分 ／ 1時間 ／ 2時間以上
 *   ★★だから 選択肢を ここに 書き写しません。
 *     ★VocalTracker.jsx の SPEECH_MINUTE_CHOICES を そのまま 使います。
 *     ★2か所に 書くと、★片方だけ 変わります。
 */
export const KOE = Object.freeze({
  title: "本番以外で 声を使った時間",
  lead: "歌ったぶんも、話したぶんも 合わせて",
  note: "4つから 選ぶだけです。数字で 入れたい方は、詳しく 書く で 分単位に できます。"
    + "\n毎日 数字を 打たせません。",
  detail: "詳しく 書く（分で）",
  done: "これでいい"
});

/**
 * ★昨夜の 睡眠（★SH['ねむり']）。
 *
 *   ★★見本は「寝た 時刻」と「起きた 時刻」を 選ばせ、★長さを 出します。
 *   ★★しまうのは、★寝た 時刻（bedtime）と 長さ（sleepHours）です。
 *     ★起きた 時刻の 欄は ありません。★足しません。
 *     ★★寝た 時刻と 長さが あれば、★起きた 時刻は 出せます。
 *       ★同じ ことを 2つの 欄に しまいません。
 */
export const NEMURI = Object.freeze({
  title: "昨夜の 睡眠",
  lead: "寝た時刻と 起きた時刻を 選ぶと、長さが 出ます",
  note: "きのうの値を 初めから 入れています。変わっていたら 直してください。",
  done: "これでいい",
  bedLabel: "寝た 時刻",
  wakeLabel: "起きた 時刻",
  BED: Object.freeze(["22:00", "22:30", "23:00", "23:30", "0:00", "0:30", "1:00", "1:30"]),
  WAKE: Object.freeze(["5:30", "6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00"]),
  // ★★見本の 初期値。★きのうが 無いときに 使います。
  BED_DEFAULT: "23:30",
  WAKE_DEFAULT: "7:00"
});

/** ★「23:30」を、★0時からの 時間に します。 */
export function hourOf(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

/**
 * ★寝た 時刻と 起きた 時刻から、★眠った 長さ（時間）。
 *
 *   ★★日を またぎます。★23:30 → 7:00 は 7.5 時間です。
 *   ★★引き算が 負に なったら、★24 を 足します。
 */
export function sleepLength(bed, wake) {
  const b = hourOf(bed), w = hourOf(wake);
  if (b == null || w == null) return null;
  let d = w - b;
  if (d < 0) d += 24;
  return d;
}

/** ★「6時間20分」の 形。★見本の カードの 中の 字です。 */
export function sleepWord(hours) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) return "";
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  // ★★60分に なったら、★1時間に 繰り上げます（★「6時間60分」を 出さない）。
  if (m === 60) return `${h + 1}時間0分`;
  return `${h}時間${m}分`;
}

/**
 * ★長さと 寝た 時刻から、★起きた 時刻を 出します。
 *
 *   ★★しまってある のは 寝た 時刻と 長さだけです。
 *     ★もう一度 開いたときに、★見本と 同じ 2つの 札を 出すために 使います。
 */
export function wakeFromBed(bed, hours) {
  const b = hourOf(bed);
  if (b == null || typeof hours !== "number" || !Number.isFinite(hours)) return null;
  const w = (b + hours) % 24;
  const h = Math.floor(w);
  const m = Math.round((w % 1) * 60);
  const hh = m === 60 ? (h + 1) % 24 : h;
  const mm = m === 60 ? 0 : m;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

/**
 * ★からだのこと（★SH['karada']）。
 *
 *   ★★選択肢は ここに 書き写しません。
 *     ★SYMPTOM_OPTIONS（★VocalTracker.jsx）を そのまま 使います。
 *     ★2か所に 書くと、★片方だけ 変わります。
 *   ★★但し書きは 見本の まま。★1文字も 変えないこと。
 *     ★「病気の名前を 使いません」は、★この家の 決めそのものです。
 */
export const KARADA = Object.freeze({
  title: "からだのこと",
  lead: "気になったものに 印を（いくつでも）",
  note: "病気の名前を 使いません。ここで 選んだものが、"
    + "ふりかえる → 並べる の「気になったこと」に 1行ずつ 出ます。",
  done: "これでいい"
});

/**
 * ★食べたもの（★SH['tabe']）。
 *
 *   ★★選択肢は DINNER_TAGS を そのまま 使います。
 *   ★★食べ終えた 時刻は、★もう ある 欄（dinner_time）に しまいます。
 */
export const TABE = Object.freeze({
  title: "食べたもの",
  lead: "当てはまるものに 印を（いくつでも）",
  timeLabel: "食べ終えた 時刻",
  TIMES: Object.freeze(["19:00", "20:00", "21:00", "22:00", "23:00"]),
  note: "良い・悪いを 決めません。食べたことを、そのまま 残すだけです。",
  done: "これでいい"
});

/** ★もっと ▸ アカウント（★SH['account']）。★行を 押す 先は これから です。 */
export const ACCOUNT_ROWS = Object.freeze([
  "メールアドレス", "パスワードを 変える", "端末を 見る", "ログアウト"
]);

/**
 * ★設定 ▸ お知らせ（★SH['tsuchi']）。
 *
 *   ★★但し書きは 見本の まま。★1文字も 変えないこと。
 *     ★「記録の 催促は 設けていません」は、★この家の 決めそのものです。
 */
export const TSUCHI_ROWS = Object.freeze([
  "学校からの 連絡", "門下の 連絡", "行事の 前の日"
]);
export const TSUCHI_NOTE = "記録の 催促は 設けていません。出しません。";

/** ★曲の ようす（★SH['yousu']）。★出来ばえでは ありません。 */
export const YOUSU_CHOICES = Object.freeze([
  "はじめたばかり", "さらい中", "本番済み", "しばらく 置く"
]);
export const YOUSU_NOTE = "出来ばえでは ありません。いま どの段階かを、ご自分で 選ぶだけです。";
