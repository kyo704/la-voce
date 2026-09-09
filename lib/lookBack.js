// ============================================================================
// C1 ── 出なかった日の、前3日をひらく（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜）.md C1
//            docs/opus/woolsong-00-実行ルート-v5（9月7日・夜・正）.md 2-6
//
//   ★★「出なかった」と記録した日に、
//     ★前夜・前日・2日前に書いたことを、★全部1画面に縦に出します。
//
//   ★★★文章を、添えません。
//     ★「睡眠が短かったからでしょう」と、★書かないこと。
//     ★確率も、割合も、順位も、出しません（★裁定 ⑦）。
//     ★★書いたことを、そのまま縦に並べるだけです。
//
//   ★★ゲートは要りません。★何も主張しないためです。
//     ★★1日目から動きます。★これが、この機能の値打ちです。
//     ★くらべる（E群）は10回集めてから傾向を言う道具で、
//     ★集まる前の10回、★この方は何も見られません。
//
//   ★無料です（★割りふり表 C群）。
//
//   ★見張り components/tests/look-back.test.js
// ============================================================================

/**
 * ★さかのぼる日。
 *
 *   ★★「前夜」は、★前日の夜に書いたものです。★別の日ではありません。
 *     ★だから、★日付としては2つ（前日・2日前）ですが、
 *     ★見出しは3つに分けます（★前夜・前日・2日前）。
 *   ★★仕様の言葉を、そのまま使います。★言い換えないこと。
 */
export const LOOK_BACK = Object.freeze([
  { key: "prevNight", label: "前の夜", offset: -1, part: "night" },
  { key: "prevDay", label: "前の日", offset: -1, part: "day" },
  { key: "twoDaysAgo", label: "2日前", offset: -2, part: "all" }
]);

export function addDaysISO(dateISO, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || ""))) return null;
  const d = new Date(dateISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * ★「出なかった」と記録した日。
 *
 *   ★★本番の結果（D+1 の一問）が not_out だった日です。
 *   ★★こちらで決めません。★ご本人が押した答えです。
 *
 *   @param performances     [{ id, date }]
 *   @param results          [{ performance_id, result }]
 */
export const NOT_OUT = "not_out";

export function notOutDates(performances, results) {
  const byId = new Map();
  (performances || []).forEach((p) => { if (p && p.id) byId.set(String(p.id), p); });
  const seen = new Set();
  (results || []).forEach((r) => {
    if (!r || r.result !== NOT_OUT) return;
    const p = byId.get(String(r.performance_id));
    const d = p && (p.date || p.performed_on);
    if (d) seen.add(String(d).slice(0, 10));
  });
  return [...seen].sort().reverse();
}

/**
 * ★その日の、さかのぼり3つ分の日付。
 *
 *   ★★書いていない日も、★出します。★「書いていません」と、そう書きます。
 *     ★黙って飛ばすと、★何日ぶんを見ているのか分からなくなります。
 */
export function lookBackDates(dateISO) {
  return LOOK_BACK.map((s) => ({ ...s, date: addDaysISO(dateISO, s.offset) }))
    .filter((s) => s.date);
}

/**
 * ★その日に「夜」書いたことか、「昼」書いたことか。
 *
 *   ★★前の夜だけを取り出すために使います。
 *   ★★決めつけません。★夜の欄に入っているものだけを「夜」とします。
 */
export const NIGHT_FIELDS = Object.freeze([
  // ★★記録の欄の名前と、★1文字ずつ同じにすること。
  //   ★bedTime と書いていて、★実際は bedtime でした。
  //   ★大文字1つで、★前の夜に何も出なくなります。
  "dinnerTime", "bedtime", "sleepSide", "headRaised", "bellyTight",
  "mealNotes", "mealMarks", "dinnerTags"
]);

/**
 * ★書いてあることを、★そのまま並べます。
 *
 *   ★★値を作りません。★合計も、平均も、判定も、出しません。
 *   ★★空の欄は、★出しません。★「―」も並べません。
 *   ★★どの欄を出すかは、★呼ぶ側が渡します（★職業で変わるためです）。
 *
 *   @param entry   その日の記録
 *   @param fields  [{ key, label, format? }]
 *   @param part    "night" | "day" | "all"
 */
export function writtenOn(entry, fields, part) {
  if (!entry) return [];
  const list = Array.isArray(fields) ? fields : [];
  return list
    .filter((f) => {
      if (part === "night") return NIGHT_FIELDS.includes(f.key);
      if (part === "day") return !NIGHT_FIELDS.includes(f.key);
      return true;
    })
    .map((f) => ({ key: f.key, label: f.label, value: present(entry[f.key], f) }))
    .filter((r) => r.value !== null);
}

function present(v, f) {
  if (v == null || v === "") return null;
  if (Array.isArray(v)) return v.length ? (f && f.format ? f.format(v) : v.join("、")) : null;
  if (typeof v === "boolean") return v ? "はい" : null;
  return f && f.format ? f.format(v) : String(v);
}

/**
 * ★1画面ぶん。
 *
 *   ★★返すのは、★書いてあることだけです。
 *     ★1文も添えません。★添える場所も、作りません。
 */
export function buildLookBack(dateISO, entries, fields) {
  return lookBackDates(dateISO).map((s) => ({
    key: s.key,
    label: s.label,
    date: s.date,
    rows: writtenOn((entries || {})[s.date], fields, s.part)
  }));
}

/**
 * ★出す欄。★1か所で持ちます。
 *
 *   ★★「効きそうな欄」を選んでいるのでは ありません。
 *     ★選んだ時点で、★こちらが「これが原因です」と言っているのと同じです。
 *   ★★ご本人が、★その3日に書いた欄を、そのまま並べます。
 *     ★書いていない欄は、★出ません。★空の行を並べません。
 *
 *   ★★ここに入れないもの
 *     ・体重・体脂肪（★体について言うことになります）
 *     ・こちらが計算した値（★点数・合計・平均）
 *     ・要配慮の欄のうち、★分析に要らないもの（薬の印・滞在地）
 */
export const LOOK_BACK_FIELDS = Object.freeze([
  // ★夜に書くもの
  { key: "dinnerTime", label: "夕食の時刻" },
  { key: "bedtime", label: "寝た時刻" },
  { key: "mealMarks", label: "食事の印" },
  { key: "mealNotes", label: "食べたもの" },
  { key: "sleepSide", label: "寝るときの向き" },
  { key: "headRaised", label: "頭の高さ" },
  { key: "bellyTight", label: "おなかの締めつけ" },
  // ★昼に書くもの
  { key: "throatCondition", label: "喉の調子" },
  { key: "voiceQuality", label: "声の質" },
  { key: "ease", label: "歌いやすさ" },
  { key: "throatSymptoms", label: "喉のようす" },
  { key: "sleepHours", label: "眠った時間" },
  { key: "sleepQuality", label: "眠りの深さ" },
  { key: "wakeNote", label: "起きたときのこと" },
  { key: "waterIntake", label: "水分" },
  { key: "activityType", label: "したこと" },
  { key: "activityDuration", label: "その長さ" },
  { key: "repertoire", label: "歌った曲" },
  { key: "exerciseMinutes", label: "運動した時間" },
  { key: "mentalTags", label: "気もちの印" },
  { key: "voiceMemo", label: "声のひとこと" },
  { key: "notes", label: "ひとこと" },
  { key: "smokedToday", label: "たばこ" },
  { key: "drankToday", label: "お酒" }
]);

/**
 * ★★ここに置いてはいけない欄。★見張りが、これを見ています。
 *   ★体重は「体について言う」ことになります。
 *   ★薬の印と滞在地は、★要配慮のうち、この画面に要らないものです。
 */
export const FORBIDDEN_FIELDS = Object.freeze([
  "weightKg", "bodyFatPct", "medicationTags", "location", "cycleStart", "cppsValue"
]);

/** ★1つでも書いてあるか（★何も無い画面を、黙って出さないため）。 */
export function hasAnything(sections) {
  return (sections || []).some((s) => s.rows && s.rows.length > 0);
}

/**
 * ★「出づらい」と書いた日（★見本⑤・2026-09-09）。
 *
 *   ★★notOutDates との ちがい。★どちらも 要ります。★1つに しないこと。
 *     ★notOutDates … ★本番のあと、★D+1 の一問に「出なかった」と 押した日。
 *                     ★本番の日にしか ありません。
 *     ★hardDays　　… ★その日の 記録が「出づらい」だった日。★本番が 無くても。
 *   ★★見本⑤は「出づらいと書いた日」と 書いてあります。★こちらが 要ります。
 *
 *   ★★こちらで 決めません。★ご本人が 選んだ 3択（★lib/recordV2.js）です。
 *     ★出づらい＝2 ですが、★昔の記録は 1〜5 の 目盛りで 書かれています。
 *     ★だから 2以下を 拾います（★conditionWord と 同じ 切り方）。
 *
 *   ★新しい順に 返します。★選ぶ帯が、★いつも 同じ並びに なるようにです。
 */
export function hardDays(entries, todayISO, days) {
  const out = [];
  for (let i = 0; i < (days || 0); i++) {
    const d = addDaysISO(todayISO, -i);
    if (!d) continue;
    const e = entries && entries[d];
    const v = e && e.throatCondition;
    if (typeof v === "number" && Number.isFinite(v) && v <= 2) out.push(d);
  }
  return out;
}

/**
 * ★さかのぼれる日を、★1つの並びに します。
 *
 *   ★★同じ日が 両方に 入ることが あります（★本番の日に「出づらい」と 書いた日）。
 *     ★1つに まとめます。★同じ日を 2回 出しません。
 *   ★新しい順です。
 */
export function lookBackableDays(notOut, hard) {
  const seen = new Set();
  const out = [];
  [...(notOut || []), ...(hard || [])].forEach((d) => {
    if (!d || seen.has(d)) return;
    seen.add(d);
    out.push(d);
  });
  return out.sort().reverse();
}
