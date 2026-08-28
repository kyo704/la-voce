// ============================================================================
// 書き出しに添える「記録の控え」（統合実行ルートv4 G3-16 の一部・無料のまま）
//
// ★これは受診用サマリーとは別物です。
//   受診用サマリー … お医者さんに見せるもの。独自指標を意図的に外している。
//   記録の控え     … 本人が「ちゃんと入っているか」を確かめるもの。
//
// ★この紙に、解釈を1つも書かないこと。
//   「多い」「少ない」「良い」「悪い」「傾向」「改善」— どれも書きません。
//   書いてよいのは、件数・日付・ファイル名だけです。
//   統合実行ルートv4 §3 の1つ目（診断しない）と、多言語対応の完成.md §7
//   （禁止語の一覧）を、この文書にも同じように適用します。
//
// ★中国語・韓国語がいちばん危ない。
//   機械翻訳は「記録」を「症状」、「調子」を「状態（病状）」に寄せがちです。
//   下の FORBIDDEN_TERMS を、テストが4言語ぶん機械的に検査します。
// ============================================================================

// この文書だけの、4分岐の言語規則。アプリ本体の9言語とは独立しています。
// ja→ja / zh→zh / ko→ko / それ以外→en。
export const SUMMARY_LANGUAGES = ["ja", "zh", "ko", "en"];
export function resolveSummaryLanguage(uiLanguage) {
  if (uiLanguage === "ja" || uiLanguage === "zh" || uiLanguage === "ko") return uiLanguage;
  return "en";
}

// ---------------------------------------------------------------------------
// ★禁止語。診断・臨床を思わせる語をこの文書に出さない。
//   「喉の調子」は5段階の数値の記録であって、症状名ではありません。
// ---------------------------------------------------------------------------
export const FORBIDDEN_TERMS = {
  ja: ["診断", "症状", "患者", "治療", "疾患", "病気", "所見", "異常", "正常値", "改善", "悪化", "傾向", "リスク"],
  zh: ["诊断", "症状", "患者", "治疗", "疾病", "异常", "正常值", "改善", "恶化", "趋势", "风险", "病情"],
  ko: ["진단", "증상", "환자", "치료", "질환", "이상", "정상치", "개선", "악화", "경향", "위험", "병세"],
  en: ["diagnos", "symptom", "patient", "treatment", "disease", "disorder", "abnormal",
       "improve", "worsen", "trend", "risk", "condition of", "healthy", "unhealthy"]
};

// ---------------------------------------------------------------------------
// 文言。★項目名は「記録の名前」であって、症状名ではありません。
//   例: 「喉の調子」→ throat rating（throat symptom ではない）
// ---------------------------------------------------------------------------
export const SUMMARY_TEXT = {
  ja: {
    title: "Woolsong　記録の控え",
    createdAt: (d) => `${d} 作成`,
    sectionYou: "あなたについて",
    labelName: "お名前", labelProfession: "声のお仕事", labelStarted: "記録を始めた日",
    sectionAmount: "記録の量",
    labelDays: "記録した日数", labelRange: "期間",
    sectionItems: "記録した項目",
    itemVoice: "声・喉の記録", itemSleep: "睡眠", itemActivity: "活動・練習",
    itemMeal: "食事・水分", itemMental: "心の余裕", itemNotes: "メモ",
    unitDays: (n) => `${n}日分`, unitCount: (n) => `${n}件`,
    sectionFiles: "一緒に書き出したファイル",
    fileJson: "すべての記録（入れ子の構造もそのまま）",
    fileCsv: "日々の記録（表計算ソフトで開けます）",
    footer: "この紙は、記録が何日ぶんあるかを確かめるためのものです。診断や評価ではありません。",
    notSet: "未設定"
  },
  zh: {
    title: "Woolsong　记录清单",
    createdAt: (d) => `${d} 制作`,
    sectionYou: "关于您",
    labelName: "姓名", labelProfession: "用声工作", labelStarted: "开始记录的日期",
    sectionAmount: "记录数量",
    labelDays: "记录天数", labelRange: "期间",
    sectionItems: "记录的项目",
    itemVoice: "嗓音与喉部记录", itemSleep: "睡眠", itemActivity: "活动与练习",
    itemMeal: "饮食与水分", itemMental: "心情余裕", itemNotes: "备忘",
    unitDays: (n) => `${n}天`, unitCount: (n) => `${n}条`,
    sectionFiles: "一并导出的文件",
    fileJson: "全部记录（保留嵌套结构）",
    fileCsv: "每日记录（可用表格软件打开）",
    footer: "本页仅用于确认记录共有多少天。这不是诊断，也不是评价。",
    notSet: "未填写"
  },
  ko: {
    title: "Woolsong　기록 목록",
    createdAt: (d) => `${d} 작성`,
    sectionYou: "회원님에 대하여",
    labelName: "이름", labelProfession: "목소리를 쓰는 일", labelStarted: "기록을 시작한 날",
    sectionAmount: "기록의 양",
    labelDays: "기록한 날수", labelRange: "기간",
    sectionItems: "기록한 항목",
    itemVoice: "목소리·목 기록", itemSleep: "수면", itemActivity: "활동·연습",
    itemMeal: "식사·수분", itemMental: "마음의 여유", itemNotes: "메모",
    unitDays: (n) => `${n}일치`, unitCount: (n) => `${n}건`,
    sectionFiles: "함께 내보낸 파일",
    fileJson: "모든 기록 (중첩 구조 그대로)",
    fileCsv: "일별 기록 (스프레드시트로 열 수 있습니다)",
    footer: "이 종이는 기록이 며칠치 있는지 확인하기 위한 것입니다. 진료나 평가가 아닙니다.",
    notSet: "미설정"
  },
  en: {
    title: "Woolsong — Record Inventory",
    createdAt: (d) => `Created ${d}`,
    sectionYou: "About you",
    labelName: "Name", labelProfession: "Voice work", labelStarted: "First record",
    sectionAmount: "How much you recorded",
    labelDays: "Days recorded", labelRange: "Period",
    sectionItems: "What you recorded",
    itemVoice: "Voice and throat entries", itemSleep: "Sleep", itemActivity: "Activity and practice",
    itemMeal: "Food and water", itemMental: "How much room you had", itemNotes: "Notes",
    unitDays: (n) => `${n} days`, unitCount: (n) => `${n} entries`,
    sectionFiles: "Files exported alongside this page",
    fileJson: "Every record (nested structure kept as-is)",
    fileCsv: "Daily records (opens in a spreadsheet)",
    footer: "This page exists so you can check how many days of records you have. It is not a diagnosis and not an assessment.",
    notSet: "Not set"
  }
};

// ---------------------------------------------------------------------------
// 一緒に書き出されるファイル。
// ★名前を思い込みで書かないこと。handleExportData が実際に作るのはこの2つだけで、
//   zip にはまとめていない（それぞれ別々にダウンロードされる）。
// ---------------------------------------------------------------------------
export function exportFileNames(stamp) {
  return [
    { name: `la-voce-${stamp}.json`, descKey: "fileJson" },
    { name: `la-voce-entries-${stamp}.csv`, descKey: "fileCsv" }
  ];
}

// ---------------------------------------------------------------------------
// 事実だけを数える。★ここで解釈をしないこと。
// ---------------------------------------------------------------------------
function has(v) {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

export function countRecordedItems(entries) {
  const dates = Object.keys(entries || {}).sort();
  const count = (fn) => dates.filter((d) => { try { return fn(entries[d] || {}); } catch (e) { return false; } }).length;
  return {
    voice: count((e) => has(e.voiceEntries) || has(e.throatCondition) || has(e.voiceQuality)),
    sleep: count((e) => has(e.sleepHours) || has(e.sleepQuality)),
    activity: count((e) => has(e.activities) || has(e.activityType)),
    meal: count((e) => has(e.meals) || has(e.waterBySlot) || has(e.waterIntake) || has(e.mealNotes)),
    mental: count((e) => has(e.mentalTags) || has(e.mentalReason)),
    notes: count((e) => has(e.notes))
  };
}

/**
 * 書き出しに添える控えの中身を作る。数字と日付だけ。
 * ★連続日数は入れない。「何日続いたか」は達成度の話になり、
 *   この紙の目的（何日ぶん入っているかの確認）から外れる。
 */
export function buildExportSummary({ profile, entries, professionLabel, exportedAt, uiLanguage }) {
  const lang = resolveSummaryLanguage(uiLanguage);
  const dates = Object.keys(entries || {}).sort();
  const stamp = (exportedAt || "").slice(0, 10);
  return {
    lang,
    text: SUMMARY_TEXT[lang],
    createdAt: stamp,
    name: (profile && profile.display_name) || null,
    professionLabel: professionLabel || null,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
    recordedDays: dates.length,
    items: countRecordedItems(entries),
    files: exportFileNames(stamp)
  };
}
