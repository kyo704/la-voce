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

// ---------------------------------------------------------------------------
// ★さかのぼる（★見本 SC['前3日']）── ★2026-09-11 の 見直しで 作り直しました
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//              の SC['前3日']
//
//   ★★何が ちがっていたか。
//     ★実装は LOOK_BACK_FIELDS の **24項目**を 出していました。
//     ★★見本は **6項目**です。★選んで あります。
//     ★★24 出すと、★見に 来た 目的（★前の3日に 何が あったか）が 埋もれます。
//     ★これが「★古い 実装が そのまま 残っていないか」に あたります。
//
//   ★★日も ちがいました。
//     ★実装　前の夜／前の日／2日前（★3つ。★1つは 夜だけ）
//     ★見本　前の日／2日まえ／3日まえ（★3日ぶん。★どれも 1日 まるごと）
//   ★★但し書きの「その前の 3日」と、★見本の ほうが 合っています。
//
//   ★★LOOK_BACK と LOOK_BACK_FIELDS は 消しません。
//     ★★前から ある 画面（★VocalTracker の notOutDays）が 使っています。
//     ★あちらを 変える 決定は、まだ ありません。
// ---------------------------------------------------------------------------

/** ★さかのぼる 日（★見本 SC['前3日']）。★どれも 1日 まるごとです。 */
export const LOOK_BACK_DAYS = Object.freeze([
  { key: "d1", label: "前の日", offset: -1 },
  { key: "d2", label: "2日まえ", offset: -2 },
  { key: "d3", label: "3日まえ", offset: -3 }
]);

/**
 * ★1日ぶんに 出す 6行（★見本 SC['前3日']）。
 *
 *   ★★順も 言葉も 見本の ままです。
 *   ★★書いていない ものは「—」です。★行ごと 消しません。
 *     ★「聞いていない」と「無かった」は 別の ことです。
 */
export const LOOK_BACK_ROWS = Object.freeze([
  { key: "voice", label: "声の 出来", kind: "three3", marks: ["◎出た", "○ふつう", "△出づらい"] },
  { key: "nodo", label: "のどの 調子", kind: "three3", marks: ["◎よい", "○ふつう", "△わるい"] },
  { key: "sleep", label: "昨夜の 睡眠", kind: "hours" },
  { key: "sing", label: "声を使った 時間", kind: "minutes" },
  { key: "tabe", label: "食べたもの", kind: "list" },
  { key: "karada", label: "からだのこと", kind: "list" }
]);

/** ★書いていない ときの 印。★1文字も 変えないこと。 */
export const LOOK_BACK_NONE = "—";

/** ★その日の 1行ぶんの 言葉。★entry から 出します。 */
export function lookBackValue(entry, rowKey) {
  if (!entry) return LOOK_BACK_NONE;
  const row = LOOK_BACK_ROWS.find((r) => r.key === rowKey);
  if (!row) return LOOK_BACK_NONE;
  if (row.kind === "three3") {
    const v = rowKey === "voice" ? entry.voiceQuality : entry.throatCondition;
    if (typeof v !== "number" || !Number.isFinite(v)) return LOOK_BACK_NONE;
    // ★★3が いちばん よい、★1が いちばん わるい（★見本の [3-v]）。
    const i = 3 - Math.max(1, Math.min(3, Math.round(v)));
    return row.marks[i];
  }
  if (row.kind === "hours") {
    const v = entry.sleepHours;
    return typeof v === "number" && Number.isFinite(v) ? `${v.toFixed(1)}時間` : LOOK_BACK_NONE;
  }
  if (row.kind === "minutes") {
    const v = entry.nonPerformanceSpeechMinutes;
    return typeof v === "number" && Number.isFinite(v) ? `${Math.round(v)}分` : LOOK_BACK_NONE;
  }
  const list = rowKey === "tabe" ? entry.dinnerTags : entry.throatSymptoms;
  return Array.isArray(list) && list.length > 0 ? list.join("・") : LOOK_BACK_NONE;
}

/** ★えらんだ 日と、その前の 3日。 */
export function lookBackThree(dateISO) {
  return LOOK_BACK_DAYS.map((d) => ({ ...d, date: addDaysISO(dateISO, d.offset) }))
    .filter((d) => d.date);
}

/** ★下の 但し書き（★見本の .note）。★1文字も 変えないこと。 */
export const LOOK_BACK_NOTE = Object.freeze([
  "書いたものを そのまま 出しています。",
  "文章を 添えません。確率も 割合も 出しません。「これが 原因です」と 言いません。",
  "見て、ご自分で 気づくための 画面です。"
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
