// ============================================================================
// 気温・湿度の「前の日から引き継ぐ」の決まり
//
//   ★引き継ぐのは、今日の記録を作るときだけです。
//     過去の日を後から埋めるときは、引き継ぎません（§4）。
//     何日も前の天気を、いまの値で埋めても意味がありません。
//
//   ★引き継いだ値は「入力された値」と同じ重さで扱いません。
//     weather_source が 'carried' の日は、
//       ・快適帯の判定を出しません（§6）
//       ・絶対湿度を説明変数に使う分析で、割合を数えます（§7）
//
//   ★3日を超えて引き継ぎません（§3）。
//     4日目は空にします。「たぶんこのくらい」を4日続けると、
//     それはもう記録ではありません。
//
//   ★過去の記録は、いっさい書き換えません（§8）。
//     この仕組みができたからといって、空いている日を埋めないこと。
//     「記録しなかった」と「引き継いだ」は別の事実です。
// ============================================================================

/** weather_source に入る値。★null は「引き継いでいない・答えていない」。 */
export const WEATHER_SOURCES = ["entered", "carried"];

/** 何日まで引き継いでよいか（§3）。4日目は空にします。 */
export const MAX_CARRY_DAYS = 3;

export function isWeatherSource(v) {
  return WEATHER_SOURCES.includes(v);
}

/** その日の気温・湿度が、引き継がれたものか。 */
export function isCarried(entry) {
  return !!entry && entry.weatherSource === "carried";
}

/** その日に、気温と湿度の両方が入っているか。 */
export function hasWeather(entry) {
  return !!entry
    && typeof entry.temperature === "number"
    && typeof entry.humidity === "number";
}

/**
 * 直前の何日ぶん、続けて引き継いでいるかを数える。
 *
 * ★「連続」です。途中で自分で入れた日があれば、そこで0に戻ります。
 *
 * @param {object} entries  { "YYYY-MM-DD": entry }
 * @param {string} beforeDate  この日より前を見る（今日は含めない）
 * @param {(d:string, n:number)=>string} addDays
 */
export function consecutiveCarriedBefore(entries, beforeDate, addDays) {
  let n = 0;
  for (let i = 1; i <= MAX_CARRY_DAYS + 1; i++) {
    const d = addDays(beforeDate, -i);
    const e = entries[d];
    if (!e || !isCarried(e)) break;
    n++;
  }
  return n;
}

/**
 * 今日の記録に、前の日の気温・湿度を引き継いでよいか。引き継ぐ値も返す。
 *
 * @returns {{carry:boolean, temperature:number|null, humidity:number|null, reason:string}}
 *
 * ★引き継がない条件
 *   ・今日ではない日を編集している（§4）
 *   ・すでに今日の気温か湿度に触れている
 *   ・前の日に気温・湿度が無い
 *   ・すでに3日続けて引き継いでいる（§3）
 */
export function weatherCarryDecision({ entries, date, realToday, addDays, current }) {
  const no = (reason) => ({ carry: false, temperature: null, humidity: null, reason });

  // §4 過去の日を埋めるときは、引き継がない
  if (date !== realToday) return no("pastDate");

  // すでに何か入っていれば、触らない
  if (current && (typeof current.temperature === "number" || typeof current.humidity === "number")) {
    return no("alreadyHasValue");
  }

  const prev = entries[addDays(date, -1)];
  if (!hasWeather(prev)) return no("noPreviousValue");

  // §3 3日続けて引き継いでいたら、4日目は空にする
  if (consecutiveCarriedBefore(entries, date, addDays) >= MAX_CARRY_DAYS) {
    return no("carryLimitReached");
  }

  return {
    carry: true,
    temperature: prev.temperature,
    humidity: prev.humidity,
    reason: "carried"
  };
}

/**
 * 引き継いだ値に添える文（§5）。
 *
 * ★「そのままで構いません」とは書かないこと。
 *   直さなくてよい、と読ませると、引き継いだ値が
 *   そのまま記録として積み上がります。
 */
export const CARRIED_NOTE = "前の日の値です。変わっていたら、直してください。";

/**
 * 絶対湿度を説明変数に使ってよいか（§7）。
 *
 * ★引き継いだ日が半分を超えていたら、結論を出しません。
 *   引き継ぎは「その日に測った値」ではないので、
 *   それが多数を占める期間の相関は、何も言っていないのと同じです。
 */
export const MAX_CARRIED_RATIO = 0.5;

export function carriedRatio(entries, dates) {
  const withWeather = (dates || []).filter((d) => hasWeather(entries[d]));
  if (withWeather.length === 0) return { ratio: 0, carried: 0, total: 0 };
  const carried = withWeather.filter((d) => isCarried(entries[d])).length;
  return { ratio: carried / withWeather.length, carried, total: withWeather.length };
}

export function mayUseAbsoluteHumidity(entries, dates) {
  const { ratio, carried, total } = carriedRatio(entries, dates);
  return { allowed: ratio <= MAX_CARRIED_RATIO, ratio, carried, total };
}
